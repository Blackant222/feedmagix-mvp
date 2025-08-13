// BACKEND: Database configuration using Drizzle ORM with Vercel Postgres
// Following 2025 best practices for serverless database connections and type safety

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

/**
 * Database instance configured for Vercel Postgres with Drizzle ORM
 * Uses connection pooling and serverless-optimized settings
 *
 * @description Implements 2025 best practices:
 * - Serverless-ready connection pooling
 * - Type-safe database operations
 * - Automatic connection management
 * - Environment-based configuration
 */
export const db = drizzle(sql, { schema });

/**
 * Database connection health check
 * Used for API health endpoints and monitoring
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Database transaction wrapper with error handling
 * Provides consistent transaction management across the application
 */
export async function withTransaction<T>(
  callback: (tx: unknown) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    try {
      return await callback(tx);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
}
