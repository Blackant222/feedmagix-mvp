// FRONTEND: API client utility for making authenticated requests to backend
// # FIX: Created centralized API client to replace mock data with real backend calls

interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Define proper response types
interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  imageUrl?: string;
  dietaryRestrictions?: string[];
  healthConditions?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FoodAnalysisResult {
  id: string;
  overallScore: number;
  summary: string;
  inputData: {
    productName?: string;
    brand?: string;
    imageUrl?: string;
  };
  nutritionalAnalysis: {
    protein: { value: number; assessment: string };
    fat: { value: number; assessment: string };
    carbohydrates: { value: number; assessment: string };
    fiber: { value: number; assessment: string };
  };
  ingredients: Array<{
    name: string;
    category: string;
    quality: string;
    concerns?: string[];
  }>;
  suitability: {
    forPet: boolean;
    reasons: string[];
    alternatives?: string[];
  };
  recommendations: string[];
  warnings: string[];
  createdAt: string;
}

interface AnalysisHistoryResponse {
  analyses: FoodAnalysisResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    analysis: boolean;
    reminders: boolean;
  };
  preferences: {
    language: 'fa' | 'en';
    theme: 'light' | 'dark' | 'system';
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Try to get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  clearAccessToken() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Gracefully handle cases where response has no JSON body
      let data: any = null;
      try {
        data = await response.json();
      } catch (_e) {
        data = null;
      }

      if (!response.ok) {
        // Normalize error formats: string error, object error, or fallback
        let code = 'HTTP_ERROR';
        let message = response.statusText || 'An error occurred';
        let details: Record<string, unknown> | undefined;

        if (data) {
          if (typeof data.error === 'string') {
            code = data.error || code;
            message = data.message || data.error || message;
          } else if (data.error && typeof data.error === 'object') {
            code = data.error.code || code;
            message = data.error.message || message;
            details = data.error.details;
          }
        }

        return {
          error: { code, message, details },
        };
      }

      // Normalize success formats: unwrap `{ success, data }` into plain `data`
      let payload: any = data;
      if (data && typeof data === 'object' && 'data' in data) {
        payload = (data as any).data;
      }

      return { data: payload as T };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          details: error instanceof Error ? { message: error.message, name: error.name } : { error: String(error) },
        },
      };
    }
  }

  // Authentication methods
  async getSession() {
    return this.makeRequest('/api/auth/session');
  }

  // WebAuthn methods removed - using PIN authentication only

  async logout() {
    const response = await this.makeRequest('/api/auth/logout', {
      method: 'POST',
    });
    this.clearAccessToken();
    return response;
  }

  // PIN Authentication methods
  async registerWithPin(identifier: string, pin: string, displayName?: string, city?: string) {
    return this.makeRequest('/api/auth/pin/register', {
      method: 'POST',
      body: JSON.stringify({ identifier, pin, displayName, city }),
    });
  }

  async loginWithPin(identifier: string, pin: string) {
    return this.makeRequest('/api/auth/pin/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, pin }),
    });
  }

  // User profile methods
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/api/user/profile');
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Pet methods
  async getPets(): Promise<ApiResponse<Pet[]>> {
    return this.makeRequest<Pet[]>('/api/pets');
  }

  async getPet(petId: string): Promise<ApiResponse<Pet>> {
    return this.makeRequest<Pet>(`/api/pets/${petId}`);
  }

  async createPet(petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Pet>> {
    return this.makeRequest<Pet>('/api/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
  }

  async updatePet(petId: string, petData: Partial<Pet>): Promise<ApiResponse<Pet>> {
    return this.makeRequest<Pet>(`/api/pets/${petId}`, {
      method: 'PUT',
      body: JSON.stringify(petData),
    });
  }

  async deletePet(petId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/api/pets/${petId}`, {
      method: 'DELETE',
    });
  }

  // Food analysis methods
  async analyzeFood(analysisData: {
    petId: string;
    type: string;
    inputMethod: string;
    inputData: {
      imageUrl?: string;
      productName?: string;
      ingredients?: string;
    };
  }): Promise<ApiResponse<FoodAnalysisResult>> {
    return this.makeRequest<FoodAnalysisResult>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  async getAnalysisHistory(params?: Record<string, string>): Promise<ApiResponse<AnalysisHistoryResponse>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest<AnalysisHistoryResponse>(`/api/analyze/history${queryString}`);
  }

  async saveAnalysisToHistory(analysisData: {
    type: 'quick' | 'detailed';
    inputMethod: 'camera' | 'text' | 'barcode';
    petId?: string;
    inputData: {
      productName?: string;
      brand?: string;
      text?: string;
      imageUrl?: string;
    };
    analysisResult: {
      overallScore: number;
      summary?: string;
      ingredients: string[];
      warnings: string[];
      recommendations: string[];
      nutritionalInfo?: {
        protein: number;
        fat: number;
        carbs: number;
        fiber: number;
        calories: number;
      };
      petCompatibility?: {
        dogs: 'safe' | 'caution' | 'dangerous';
        cats: 'safe' | 'caution' | 'dangerous';
      };
    };
  }): Promise<ApiResponse<FoodAnalysisResult>> {
    return this.makeRequest<FoodAnalysisResult>('/api/analyze/history', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  async updateAnalysis(analysisId: string, data: Partial<FoodAnalysisResult>): Promise<ApiResponse<FoodAnalysisResult>> {
    return this.makeRequest<FoodAnalysisResult>(`/api/analyze/history/${analysisId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAnalysisById(analysisId: string): Promise<ApiResponse<FoodAnalysisResult>> {
    return this.makeRequest<FoodAnalysisResult>(`/api/analyze/history/${analysisId}`);
  }

  async deleteAnalysis(analysisId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/api/analyze/history/${analysisId}`, {
      method: 'DELETE',
    });
  }

  async getUserSettings(): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/api/user/settings');
  }

  async updateUserSettings(settings: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getUsageStats() {
    return this.makeRequest('/api/usage/stats');
  }
}

export const apiClient = new ApiClient();
export default apiClient;