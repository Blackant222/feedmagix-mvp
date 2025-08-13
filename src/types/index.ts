// User Types
export interface User {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

// Pet Types
export interface Pet {
  id: string;
  name: string;
  species: 'cat' | 'dog' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age: number;
  weight?: number;
  photoUrl?: string;
  healthConditions?: string[];
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

// Food Analysis Types
export interface FoodScan {
  id: string;
  foodName: string;
  brandName: string;
  imageUrl: string;
  analysisDate: string;
  overallScore: number;
  nutritionalAnalysis?: NutritionalAnalysis;
  ingredients?: Ingredient[];
  recommendations?: string[];
  petId?: string;
}

export interface NutritionalAnalysis {
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  moisture: number;
  ash: number;
  calories: number;
}

export interface Ingredient {
  name: string;
  percentage?: number;
  category:
    | 'protein'
    | 'carbohydrate'
    | 'fat'
    | 'vitamin'
    | 'mineral'
    | 'additive'
    | 'preservative';
  healthScore: number;
  notes?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalScansThisMonth: number;
  favoriteFoodsCount: number;
  averageHealthScore: number;
}

export interface ActivityItem {
  id: string;
  type: 'scan' | 'pet_added' | 'favorite_added' | 'recommendation';
  description: string;
  timestamp: string;
  // CHANGE: Replaced 'any' type with proper union type for metadata values
  metadata?: Record<string, string | number | boolean>;
}

export interface DashboardData {
  user: User;
  recentScans: FoodScan[];
  pets: Pet[];
  stats: DashboardStats;
  recentActivity: ActivityItem[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

// Settings Types
export interface UserSettings {
  language: 'fa' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    scanReminders: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
}

// Camera/Scan Types
export interface ScanRequest {
  imageData: string; // base64
  petId?: string;
  notes?: string;
}

export interface ScanResult {
  id: string;
  foodName: string;
  brandName: string;
  confidence: number;
  overallScore: number;
  analysis: NutritionalAnalysis;
  ingredients: Ingredient[];
  recommendations: string[];
  warnings?: string[];
}
