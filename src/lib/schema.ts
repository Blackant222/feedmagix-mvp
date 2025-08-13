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
  sessions: many(userSessions),
  apiUsageLogs: many(apiUsageLogs),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  user: one(users, {
    fields: [pets.userId],
    references: [users.id],
  }),
  foodAnalyses: many(foodAnalyses),
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
