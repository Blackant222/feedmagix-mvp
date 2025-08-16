// BACKEND: Database schema definition using Drizzle ORM
// Following 2025 best practices for PostgreSQL schema design and type safety

import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal,
  boolean,
  jsonb,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table - Core user authentication and profile data
 * Implements WebAuthn-first authentication with email fallback
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique(),
    phone: varchar('phone', { length: 20 }).unique(),
    displayName: varchar('display_name', { length: 100 }),
    city: varchar('city', { length: 100 }),
    avatarUrl: text('avatar_url'),
    isEmailVerified: boolean('is_email_verified').default(false),
    isPhoneVerified: boolean('is_phone_verified').default(false),
    pinHash: text('pin_hash'), // For PIN authentication
    preferences: jsonb('preferences')
      .$type<{
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
      }>()
      .default({
        language: 'fa',
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          analysis: true,
          reminders: true,
        },
        privacy: {
          shareData: false,
          analytics: true,
        },
      }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    phoneIdx: index('users_phone_idx').on(table.phone),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  })
);

// WebAuthn credentials table removed - using PIN authentication only

/**
 * Pet Profiles table - Pet information and characteristics
 * Supports multiple pets per user with detailed health tracking
 */
export const pets = pgTable(
  'pets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    species: varchar('species', { length: 50 }).notNull(), // 'dog', 'cat', etc.
    breed: varchar('breed', { length: 100 }),
    age: integer('age'), // in months
    weight: decimal('weight', { precision: 5, scale: 2 }), // in kg
    activityLevel: varchar('activity_level', { length: 20 }), // 'low', 'medium', 'high'
    healthConditions: jsonb('health_conditions').$type<string[]>().default([]),
    chronicDiseases: jsonb('chronic_diseases').$type<string[]>().default([]),
    allergies: jsonb('allergies').$type<string[]>().default([]),
    dietaryRestrictions: jsonb('dietary_restrictions').$type<string[]>().default([]),
    currentFood: text('current_food'),
    feedingSchedule: jsonb('feeding_schedule').$type<{
      timesPerDay: number;
      amount: string;
      notes?: string;
    }>(),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('pets_user_id_idx').on(table.userId),
    speciesIdx: index('pets_species_idx').on(table.species),
  })
);

/**
 * Food Cache table - Stores OCR results and product information for reuse
 * Prevents duplicate OCR processing for the same products
 */
export const foodCache = pgTable(
  'food_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productHash: varchar('product_hash', { length: 64 }).notNull().unique(),
    brand: varchar('brand', { length: 200 }),
    productName: varchar('product_name', { length: 300 }),
    flavor: varchar('flavor', { length: 200 }),
    extractedText: text('extracted_text').notNull(),
    detectedSpecies: varchar('detected_species', { length: 20 }).notNull(),
    ingredients: jsonb('ingredients').$type<string[]>().default([]),
    nutritionalInfo: jsonb('nutritional_info').$type<Record<string, unknown>>().default({}),
    targetSpecies: varchar('target_species', { length: 50 }),
    lifestage: varchar('lifestage', { length: 50 }),
    ocrConfidence: decimal('ocr_confidence', { precision: 3, scale: 2 }),
    scanCount: integer('scan_count').default(1),
    firstScannedAt: timestamp('first_scanned_at').defaultNow().notNull(),
    lastScannedAt: timestamp('last_scanned_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    productHashIdx: index('food_cache_product_hash_idx').on(table.productHash),
    brandIdx: index('food_cache_brand_idx').on(table.brand),
    productNameIdx: index('food_cache_product_name_idx').on(table.productName),
    detectedSpeciesIdx: index('food_cache_detected_species_idx').on(table.detectedSpecies),
    lastScannedIdx: index('food_cache_last_scanned_idx').on(table.lastScannedAt),
  })
);

/**
 * Food Analysis table - AI-powered food analysis results
 * Stores comprehensive analysis data with caching capabilities
 */
export const foodAnalyses = pgTable(
  'food_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'set null' }),
    type: varchar('type', { length: 20 }).notNull(), // 'quick' | 'detailed'
    inputMethod: varchar('input_method', { length: 20 }).notNull(), // 'camera' | 'text' | 'barcode'
    inputData: jsonb('input_data')
      .$type<{
        text?: string;
        imageUrl?: string;
        barcode?: string;
        brand?: string;
        productName?: string;
      }>()
      .notNull(),
    analysisResult: jsonb('analysis_result').$type<{
      overallScore: number; // 0-100
      nutritionalAnalysis: {
        protein: { value: number; assessment: string };
        fat: { value: number; assessment: string };
        carbohydrates: { value: number; assessment: string };
        fiber: { value: number; assessment: string };
        vitamins: Array<{ name: string; value: number; assessment: string }>;
        minerals: Array<{ name: string; value: number; assessment: string }>;
      };
      ingredients: Array<{
        name: string;
        category: string;
        quality: 'excellent' | 'good' | 'fair' | 'poor';
        concerns?: string[];
      }>;
      suitability: {
        forPet: boolean;
        reasons: string[];
        alternatives?: string[];
      };
      recommendations: string[];
      warnings: string[];
      summary: string;
    }>(),
    processingTime: integer('processing_time'), // in milliseconds
    confidence: decimal('confidence', { precision: 3, scale: 2 }), // 0.00-1.00
    isFavorite: boolean('is_favorite').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('food_analyses_user_id_idx').on(table.userId),
    petIdIdx: index('food_analyses_pet_id_idx').on(table.petId),
    typeIdx: index('food_analyses_type_idx').on(table.type),
    createdAtIdx: index('food_analyses_created_at_idx').on(table.createdAt),
    favoriteIdx: index('food_analyses_favorite_idx').on(table.isFavorite),
  })
);

/**
 * User Sessions table - Session management for authentication
 * Implements secure session handling with automatic cleanup
 */
export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    sessionToken: text('session_token').notNull().unique(),
    refreshToken: text('refresh_token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    refreshExpiresAt: timestamp('refresh_expires_at').notNull(),
    deviceInfo: jsonb('device_info').$type<{
      userAgent: string;
      ip: string;
      platform?: string;
      browser?: string;
    }>(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
    sessionTokenIdx: index('user_sessions_session_token_idx').on(
      table.sessionToken
    ),
    expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt),
  })
);

/**
 * API Usage Logs table - Rate limiting and usage tracking
 * Implements comprehensive API monitoring and abuse prevention
 */
export const apiUsageLogs = pgTable(
  'api_usage_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    endpoint: varchar('endpoint', { length: 255 }).notNull(),
    method: varchar('method', { length: 10 }).notNull(),
    statusCode: integer('status_code').notNull(),
    responseTime: integer('response_time'), // in milliseconds
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    requestSize: integer('request_size'), // in bytes
    responseSize: integer('response_size'), // in bytes
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('api_usage_logs_user_id_idx').on(table.userId),
    endpointIdx: index('api_usage_logs_endpoint_idx').on(table.endpoint),
    createdAtIdx: index('api_usage_logs_created_at_idx').on(table.createdAt),
    ipAddressIdx: index('api_usage_logs_ip_address_idx').on(table.ipAddress),
  })
);

// Relations definitions for type-safe joins
export const usersRelations = relations(users, ({ many }) => ({
  pets: many(pets),
  foodAnalyses: many(foodAnalyses),
  userSessions: many(userSessions),
  apiUsageLogs: many(apiUsageLogs),
  achievements: many(userAchievements),
  streaks: many(userStreaks),
  foodComparisons: many(foodComparisons),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  user: one(users, {
    fields: [pets.userId],
    references: [users.id],
  }),
  foodAnalyses: many(foodAnalyses),
  healthScores: many(petHealthScores),
  analytics: many(petAnalytics),
  foodComparisons: many(foodComparisons),
}));

export const foodAnalysesRelations = relations(foodAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [foodAnalyses.userId],
    references: [users.id],
  }),
  pet: one(pets, {
    fields: [foodAnalyses.petId],
    references: [pets.id],
  }),
}));

// WebAuthn credentials relations removed - using PIN authentication only

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const apiUsageLogsRelations = relations(apiUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [apiUsageLogs.userId],
    references: [users.id],
  }),
}));

export const foodCacheRelations = relations(foodCache, ({ many }) => ({
  analyses: many(foodAnalyses),
}));

/**
 * User Achievements table - Gamification system for tracking user accomplishments
 * Supports badges, streaks, and milestone tracking
 */
export const userAchievements = pgTable(
  'user_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    achievementType: varchar('achievement_type', { length: 50 }).notNull(), // 'badge', 'streak', 'milestone'
    achievementKey: varchar('achievement_key', { length: 100 }).notNull(), // 'first_scan', 'healthy_streak_7', etc.
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    iconUrl: text('icon_url'),
    points: integer('points').default(0),
    level: integer('level').default(1),
    progress: integer('progress').default(0),
    maxProgress: integer('max_progress').default(1),
    isCompleted: boolean('is_completed').default(false),
    completedAt: timestamp('completed_at'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_achievements_user_id_idx').on(table.userId),
    typeIdx: index('user_achievements_type_idx').on(table.achievementType),
    completedIdx: index('user_achievements_completed_idx').on(table.isCompleted),
  })
);

/**
 * Pet Health Scores table - Tracks pet health progression over time
 * Enables health score visualization and trend analysis
 */
export const petHealthScores = pgTable(
  'pet_health_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id')
      .references(() => pets.id, { onDelete: 'cascade' })
      .notNull(),
    overallScore: integer('overall_score').notNull(), // 0-100
    nutritionScore: integer('nutrition_score').notNull(), // 0-100
    activityScore: integer('activity_score').notNull(), // 0-100
    healthTrend: varchar('health_trend', { length: 20 }).notNull(), // 'improving', 'stable', 'declining'
    factors: jsonb('factors').$type<{
      recentFeeds: number;
      healthyChoices: number;
      consistentFeeding: boolean;
      weightManagement: boolean;
    }>().notNull(),
    recommendations: jsonb('recommendations').$type<string[]>().default([]),
    calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  },
  (table) => ({
    petIdIdx: index('pet_health_scores_pet_id_idx').on(table.petId),
    calculatedAtIdx: index('pet_health_scores_calculated_at_idx').on(table.calculatedAt),
  })
);

/**
 * Food Comparisons table - Stores multi-food comparison results
 * Enables side-by-side analysis and recommendation tracking
 */
export const foodComparisons = pgTable(
  'food_comparisons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'set null' }),
    comparisonName: varchar('comparison_name', { length: 200 }),
    foodItems: jsonb('food_items').$type<Array<{
      id: string;
      name: string;
      brand: string;
      imageUrl?: string;
      analysisId?: string;
      overallScore: number;
      keyFeatures: string[];
    }>>().notNull(),
    winner: jsonb('winner').$type<{
      foodId: string;
      reasons: string[];
      confidenceScore: number;
    }>(),
    comparisonMatrix: jsonb('comparison_matrix').$type<{
      criteria: Array<{
        name: string;
        weight: number;
        scores: Record<string, number>;
      }>;
      summary: string;
    }>(),
    recommendations: jsonb('recommendations').$type<string[]>().default([]),
    isBookmarked: boolean('is_bookmarked').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('food_comparisons_user_id_idx').on(table.userId),
    petIdIdx: index('food_comparisons_pet_id_idx').on(table.petId),
    createdAtIdx: index('food_comparisons_created_at_idx').on(table.createdAt),
    bookmarkedIdx: index('food_comparisons_bookmarked_idx').on(table.isBookmarked),
  })
);

/**
 * User Streaks table - Tracks various user activity streaks
 * Supports multiple streak types for gamification
 */
export const userStreaks = pgTable(
  'user_streaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    streakType: varchar('streak_type', { length: 50 }).notNull(), // 'daily_scan', 'healthy_choices', 'consistent_feeding'
    currentStreak: integer('current_streak').default(0),
    longestStreak: integer('longest_streak').default(0),
    lastActivityDate: timestamp('last_activity_date'),
    streakStartDate: timestamp('streak_start_date'),
    isActive: boolean('is_active').default(true),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_streaks_user_id_idx').on(table.userId),
    typeIdx: index('user_streaks_type_idx').on(table.streakType),
    activeIdx: index('user_streaks_active_idx').on(table.isActive),
  })
);

/**
 * Pet Analytics table - Detailed analytics for pet health and feeding patterns
 * Enables advanced dashboard insights and trend analysis
 */
export const petAnalytics = pgTable(
  'pet_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id')
      .references(() => pets.id, { onDelete: 'cascade' })
      .notNull(),
    analyticsDate: timestamp('analytics_date').notNull(),
    feedingStats: jsonb('feeding_stats').$type<{
      totalFeeds: number;
      healthyFeeds: number;
      averageScore: number;
      consistencyScore: number;
    }>().notNull(),
    healthMetrics: jsonb('health_metrics').$type<{
      weightTrend: 'gaining' | 'stable' | 'losing';
      activityLevel: number;
      appetiteScore: number;
      energyLevel: number;
    }>(),
    behaviorPatterns: jsonb('behavior_patterns').$type<{
      feedingTimes: string[];
      preferredFoods: string[];
      avoidedIngredients: string[];
    }>(),
    insights: jsonb('insights').$type<string[]>().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
     petIdIdx: index('pet_analytics_pet_id_idx').on(table.petId),
     dateIdx: index('pet_analytics_date_idx').on(table.analyticsDate),
   })
 );

// Relations for new gamification tables
export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const petHealthScoresRelations = relations(petHealthScores, ({ one }) => ({
  pet: one(pets, {
    fields: [petHealthScores.petId],
    references: [pets.id],
  }),
}));

export const foodComparisonsRelations = relations(foodComparisons, ({ one }) => ({
  user: one(users, {
    fields: [foodComparisons.userId],
    references: [users.id],
  }),
  pet: one(pets, {
    fields: [foodComparisons.petId],
    references: [pets.id],
  }),
}));

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userStreaks.userId],
    references: [users.id],
  }),
}));

export const petAnalyticsRelations = relations(petAnalytics, ({ one }) => ({
  pet: one(pets, {
    fields: [petAnalytics.petId],
    references: [pets.id],
  }),
}))
