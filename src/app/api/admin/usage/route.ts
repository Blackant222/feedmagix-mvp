// BACKEND: API usage tracking and analytics endpoint for admin monitoring
// Provides insights into system usage patterns and performance metrics

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiUsageLogs, users } from '@/lib/schema';
import { validateSession } from '@/lib/auth';
import { desc, eq, gte, lte, count, avg } from 'drizzle-orm';

/**
 * BACKEND: Zod schema for usage query parameters
 * Validates date ranges and filtering options for usage analytics
 */
const usageQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  endpoint: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * BACKEND: GET /api/admin/usage
 * Retrieves API usage statistics and logs for admin monitoring
 * Requires admin privileges for access
 */
export async function GET(request: NextRequest) {
  try {
    // BACKEND: Extract and validate session token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'احراز هویت مورد نیاز است' },
        { status: 401 }
      );
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json(
        { error: 'احراز هویت مورد نیاز است' },
        { status: 401 }
      );
    }

    // BACKEND: Check if user has admin privileges (simplified check)
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user[0] || !user[0].email || !user[0].email.includes('admin')) {
      return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
    }

    // BACKEND: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validatedQuery = usageQuerySchema.parse(queryParams);

    // BACKEND: Build query conditions
    const conditions = [];

    if (validatedQuery.startDate) {
      conditions.push(
        gte(apiUsageLogs.createdAt, new Date(validatedQuery.startDate))
      );
    }

    if (validatedQuery.endDate) {
      conditions.push(
        lte(apiUsageLogs.createdAt, new Date(validatedQuery.endDate))
      );
    }

    if (validatedQuery.userId) {
      conditions.push(eq(apiUsageLogs.userId, validatedQuery.userId));
    }

    if (validatedQuery.endpoint) {
      conditions.push(eq(apiUsageLogs.endpoint, validatedQuery.endpoint));
    }

    // BACKEND: Get usage logs with pagination
    const usageLogs = await db
      .select({
        id: apiUsageLogs.id,
        userId: apiUsageLogs.userId,
        endpoint: apiUsageLogs.endpoint,
        method: apiUsageLogs.method,
        statusCode: apiUsageLogs.statusCode,
        responseTime: apiUsageLogs.responseTime,
        createdAt: apiUsageLogs.createdAt,
        userAgent: apiUsageLogs.userAgent,
        ipAddress: apiUsageLogs.ipAddress,
      })
      .from(apiUsageLogs)
      .where(
        conditions.length > 0
          ? conditions.reduce((acc, condition) => acc && condition)
          : undefined
      )
      .orderBy(desc(apiUsageLogs.createdAt))
      .limit(validatedQuery.limit)
      .offset(validatedQuery.offset);

    // BACKEND: Get usage statistics
    const totalRequests = await db
      .select({ count: count() })
      .from(apiUsageLogs)
      .where(
        conditions.length > 0
          ? conditions.reduce((acc, condition) => acc && condition)
          : undefined
      );

    const avgResponseTime = await db
      .select({ avg: avg(apiUsageLogs.responseTime) })
      .from(apiUsageLogs)
      .where(
        conditions.length > 0
          ? conditions.reduce((acc, condition) => acc && condition)
          : undefined
      );

    // BACKEND: Get endpoint usage breakdown
    const endpointStats = await db
      .select({
        endpoint: apiUsageLogs.endpoint,
        count: count(),
        avgResponseTime: avg(apiUsageLogs.responseTime),
      })
      .from(apiUsageLogs)
      .where(
        conditions.length > 0
          ? conditions.reduce((acc, condition) => acc && condition)
          : undefined
      )
      .groupBy(apiUsageLogs.endpoint)
      .orderBy(desc(count()));

    return NextResponse.json({
      success: true,
      data: {
        logs: usageLogs,
        statistics: {
          totalRequests: totalRequests[0]?.count || 0,
          averageResponseTime: avgResponseTime[0]?.avg || 0,
          endpointBreakdown: endpointStats,
        },
        pagination: {
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          hasMore: usageLogs.length === validatedQuery.limit,
        },
      },
    });
  } catch (error) {
    console.error('BACKEND: Usage analytics error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'پارامترهای نامعتبر',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
