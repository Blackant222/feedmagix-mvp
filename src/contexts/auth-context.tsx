'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
// WebAuthn removed - using PIN authentication only

interface User {
  id: string;
  email: string;
  displayName: string | null;
  isEmailVerified: boolean;
  preferences: {
    language: 'fa' | 'en';
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      analysis: boolean;
      reminders: boolean;
    };
    privacy: {
      shareData: boolean;
      analytics: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loginWithPin: (identifier: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  registerWithPin: (identifier: string, pin: string, displayName?: string, city?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a token in localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Set the token in apiClient before making the request
      apiClient.setAccessToken(token);

      // Validate the session with the server
      const sessionResponse = await apiClient.getSession();
      
      if (sessionResponse.data && !sessionResponse.error && (sessionResponse.data as { success: boolean; user: User }).success) {
        const sessionData = sessionResponse.data as { success: boolean; user: User };
        setUser(sessionData.user);
        setIsAuthenticated(true);
      } else {
        // Invalid session, clear token
        localStorage.removeItem('accessToken');
        apiClient.clearAccessToken();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Clear invalid session
      localStorage.removeItem('accessToken');
      apiClient.clearAccessToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Note: This method is deprecated - use loginWithPin instead
      // Keeping for backward compatibility
      console.warn('login() method is deprecated, use loginWithPin() instead');
      
      return { success: false, error: 'لطفاً از روش ورود با رمز عبور استفاده کنید' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'خطا در ورود. لطفاً دوباره تلاش کنید.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API if we have a token
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local logout even if API call fails
        }
      }
    } finally {
      // Always clear local state
      localStorage.removeItem('accessToken');
      apiClient.clearAccessToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshSession = async () => {
    await checkExistingSession();
  };

  const loginWithPin = async (identifier: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await apiClient.loginWithPin(identifier, pin);
      
      if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
        const responseData = response.data as { success: boolean; accessToken?: string; user?: User };
        const { accessToken, user } = responseData;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          apiClient.setAccessToken(accessToken);
        }
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
        }
        return { success: true };
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : 'خطا در ورود';
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('PIN login failed:', error);
      return { success: false, error: 'خطا در ورود' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithPin = async (identifier: string, pin: string, displayName?: string, city?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await apiClient.registerWithPin(identifier, pin, displayName, city);
      
      if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
        return { success: true };
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : 'خطا در ثبت‌نام';
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('PIN registration failed:', error);
      return { success: false, error: 'خطا در ثبت‌نام' };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
    loginWithPin,
    registerWithPin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login';
    }
  }, [isAuthenticated, isLoading]);
  
  return { isAuthenticated, isLoading };
}