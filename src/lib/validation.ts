// BACKEND: Comprehensive Zod validation schemas for API input sanitization
// Following 2025 security best practices for data validation and type safety

import { z } from 'zod';

/**
 * Base validation schemas for common data types
 * Implements strict validation with security-focused constraints
 */

// UUID validation with proper format checking
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Email validation with comprehensive format checking
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

// Persian text validation for RTL content
export const persianTextSchema = z
  .string()
  .min(1, 'Text cannot be empty')
  .max(1000, 'Text must not exceed 1000 characters')
  .trim()
  .refine((val) => val.length > 0, 'Text cannot be empty after trimming');

// Secure password validation (for fallback authentication)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

/**
 * User-related validation schemas
 */

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must not exceed 100 characters')
    .trim()
    .optional(),
  preferences: z
    .object({
      language: z.enum(['fa', 'en']).default('fa'),
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      notifications: z
        .object({
          email: z.boolean().default(true),
          push: z.boolean().default(true),
          analysis: z.boolean().default(true),
          reminders: z.boolean().default(true),
        })
        .default({}),
      privacy: z
        .object({
          shareData: z.boolean().default(false),
          analytics: z.boolean().default(true),
        })
        .default({}),
    })
    .default({}),
});

// User profile update schema
export const userProfileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must not exceed 100 characters')
    .trim()
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  preferences: z
    .object({
      language: z.enum(['fa', 'en']).optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      notifications: z
        .object({
          email: z.boolean().optional(),
          push: z.boolean().optional(),
          analysis: z.boolean().optional(),
          reminders: z.boolean().optional(),
        })
        .optional(),
      privacy: z
        .object({
          shareData: z.boolean().optional(),
          analytics: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

// WebAuthn validation schemas removed - using PIN authentication only

/**
 * Pet-related validation schemas
 */

// Pet creation schema
export const petCreationSchema = z.object({
  name: z
    .string()
    .min(1, 'Pet name is required')
    .max(100, 'Pet name must not exceed 100 characters')
    .trim(),
  type: z.enum(
    ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'other'],
    {
      errorMap: () => ({ message: 'Invalid pet type' }),
    }
  ),
  breed: z
    .string()
    .max(100, 'Breed must not exceed 100 characters')
    .trim()
    .optional(),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(0, 'Age cannot be negative')
    .max(300, 'Age seems unrealistic')
    .optional(),
  weight: z
    .number()
    .positive('Weight must be positive')
    .max(200, 'Weight seems unrealistic')
    .optional(),
  activityLevel: z.enum(['low', 'medium', 'high']).optional(),
  healthConditions: z
    .array(z.string().max(100))
    .max(20, 'Too many health conditions')
    .default([]),
  allergies: z
    .array(z.string().max(100))
    .max(20, 'Too many allergies')
    .default([]),
  dietaryRestrictions: z
    .array(z.string().max(100))
    .max(20, 'Too many dietary restrictions')
    .default([]),
  currentFood: z
    .string()
    .max(200, 'Current food description too long')
    .trim()
    .optional(),
  feedingSchedule: z
    .object({
      timesPerDay: z
        .number()
        .int()
        .min(1, 'Must feed at least once per day')
        .max(10, 'Too many feeding times'),
      amount: z.string().max(100, 'Amount description too long'),
      notes: z.string().max(500, 'Notes too long').optional(),
    })
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

// Pet update schema (all fields optional)
export const petUpdateSchema = petCreationSchema.partial();

/**
 * Food Analysis validation schemas
 */

// Food analysis request schema
export const foodAnalysisRequestSchema = z.object({
  petId: uuidSchema.optional(),
  type: z.enum(['quick', 'detailed'], {
    errorMap: () => ({ message: 'Analysis type must be quick or detailed' }),
  }),
  inputMethod: z.enum(['camera', 'text', 'barcode'], {
    errorMap: () => ({ message: 'Invalid input method' }),
  }),
  inputData: z.object({
    text: z
      .string()
      .min(3, 'Text input too short')
      .max(5000, 'Text input too long')
      .trim()
      .optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    barcode: z
      .string()
      .regex(/^[0-9]{8,14}$/, 'Invalid barcode format')
      .optional(),
    brand: z.string().max(100, 'Brand name too long').trim().optional(),
    productName: z.string().max(200, 'Product name too long').trim().optional(),
  }),
});

// Food analysis result schema (for validation of AI responses)
export const foodAnalysisResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  nutritionalAnalysis: z.object({
    protein: z.object({
      value: z.number().min(0).max(100),
      assessment: z.string().max(500),
    }),
    fat: z.object({
      value: z.number().min(0).max(100),
      assessment: z.string().max(500),
    }),
    carbohydrates: z.object({
      value: z.number().min(0).max(100),
      assessment: z.string().max(500),
    }),
    fiber: z.object({
      value: z.number().min(0).max(100),
      assessment: z.string().max(500),
    }),
    vitamins: z.array(
      z.object({
        name: z.string().max(100),
        value: z.number().min(0),
        assessment: z.string().max(500),
      })
    ),
    minerals: z.array(
      z.object({
        name: z.string().max(100),
        value: z.number().min(0),
        assessment: z.string().max(500),
      })
    ),
  }),
  ingredients: z.array(
    z.object({
      name: z.string().max(200),
      category: z.string().max(100),
      quality: z.enum(['excellent', 'good', 'fair', 'poor']),
      concerns: z.array(z.string().max(200)).optional(),
    })
  ),
  suitability: z.object({
    forPet: z.boolean(),
    reasons: z.array(z.string().max(500)),
    alternatives: z.array(z.string().max(200)).optional(),
  }),
  recommendations: z.array(z.string().max(500)),
  warnings: z.array(z.string().max(500)),
  summary: z.string().max(2000),
});

/**
 * API pagination and filtering schemas
 */

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine((val) => val >= 1, 'Page must be at least 1')
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
});

// Food analysis history filters
export const foodAnalysisFiltersSchema = z.object({
  petId: uuidSchema.optional(),
  type: z.enum(['quick', 'detailed']).optional(),
  inputMethod: z.enum(['camera', 'text', 'barcode']).optional(),
  isFavorite: z
    .string()
    .regex(/^(true|false)$/, 'isFavorite must be true or false')
    .transform((val) => val === 'true')
    .optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
});

/**
 * System and health check schemas
 */

// Health check response schema
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  services: z.object({
    database: z.boolean(),
    ai: z.boolean(),
    storage: z.boolean(),
  }),
  version: z.string(),
  uptime: z.number(),
});

/**
 * Error response schemas
 */

// Standard error response schema
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    timestamp: z.string().datetime(),
    requestId: z.string().uuid().optional(),
  }),
});

// Validation error response schema
export const validationErrorResponseSchema = z.object({
  error: z.object({
    code: z.literal('VALIDATION_ERROR'),
    message: z.string(),
    details: z.object({
      fieldErrors: z.record(z.array(z.string())),
    }),
    timestamp: z.string().datetime(),
    requestId: z.string().uuid().optional(),
  }),
});

/**
 * Type exports for use throughout the application
 */
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type PetCreation = z.infer<typeof petCreationSchema>;
export type PetUpdate = z.infer<typeof petUpdateSchema>;
export type FoodAnalysisRequest = z.infer<typeof foodAnalysisRequestSchema>;
export type FoodAnalysisResult = z.infer<typeof foodAnalysisResultSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type FoodAnalysisFilters = z.infer<typeof foodAnalysisFiltersSchema>;
export type HealthCheck = z.infer<typeof healthCheckSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type ValidationErrorResponse = z.infer<
  typeof validationErrorResponseSchema
>;
