'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
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

  // Helper function to set auth token in both localStorage and cookies
  const setAuthToken = (token: string) => {
    localStorage.setItem('accessToken', token);
    // Set cookie for middleware
    document.cookie = `auth-token=${token}; path=/; max-age=${24 * 60 * 60}; secure; samesite=strict`;
    apiClient.setAccessToken(token);
  };

  // Helper function to clear auth token from both localStorage and cookies
  const clearAuthToken = () => {
    localStorage.removeItem('accessToken');
    // Clear cookie
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    apiClient.clearAccessToken();
  };

  const checkExistingSession = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.debug('Checking existing session');
      
      // Check if we have a token in localStorage
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        logger.debug('No token found in localStorage');
        setIsLoading(false);
        return;
      }

      // Set the token in apiClient before making the request
      apiClient.setAccessToken(token);

      // Validate the session with the server
      logger.debug('Validating session with server');
      const sessionResponse = await apiClient.getSession();
      
      if (sessionResponse.data && !sessionResponse.error && (sessionResponse.data as { success: boolean; user: User }).success) {
        const sessionData = sessionResponse.data as { success: boolean; user: User };
        setUser(sessionData.user);
        setIsAuthenticated(true);
        // Ensure cookie is set for middleware
        setAuthToken(token);
        logger.auth('session_refresh', sessionData.user.id);
      } else {
        logger.warn('Session invalid, clearing token');
        // Invalid session, clear token
        clearAuthToken();
      }
    } catch (error) {
      logger.warn('Session validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Clear invalid session
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

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
      clearAuthToken();
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
          setAuthToken(accessToken);
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