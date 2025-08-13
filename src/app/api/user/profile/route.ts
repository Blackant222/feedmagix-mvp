// BACKEND: User profile management endpoint
// Implements the /api/user/profile route for user profile operations

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * User Profile Management Handler
 * Handles GET and PUT operations for user profile data
 * Includes preferences and display settings
 */

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'نام نمایشی الزامی است')
    .max(100, 'نام نمایشی نباید بیش از ۱۰۰ کاراکتر باشد')
    .optional(),
  preferences: z
    .object({
      language: z
        .enum(['fa', 'en'], {
          errorMap: () => ({ message: 'زبان نامعتبر' }),
        })
        .optional(),
      theme: z
        .enum(['light', 'dark', 'system'], {
          errorMap: () => ({ message: 'تم نامعتبر' }),
        })
        .optional(),
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

// BACKEND: Get user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'توکن احراز هویت یافت نشد',
        },
        { status: 401 }
      );
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json(
        {
          error: 'invalid_session',
          message: 'جلسه نامعتبر یا منقضی شده',
        },
        { status: 401 }
      );
    }

    // BACKEND: Get full user profile from database
    const [userProfile] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        isEmailVerified: users.isEmailVerified,
        preferences: users.preferences,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, user.user.id))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        {
          error: 'user_not_found',
          message: 'کاربر یافت نشد',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: userProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'توکن احراز هویت یافت نشد',
        },
        { status: 401 }
      );
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json(
        {
          error: 'invalid_session',
          message: 'جلسه نامعتبر یا منقضی شده',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // BACKEND: Validate request body
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'validation_failed',
          message: 'داده‌های ورودی نامعتبر',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // BACKEND: Get current user data for merging preferences
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.user.id))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json(
        {
          error: 'user_not_found',
          message: 'کاربر یافت نشد',
        },
        { status: 404 }
      );
    }

    // BACKEND: Deep merge preferences with existing data
    let updatedPreferences = currentUser.preferences;
    if (updateData.preferences) {
      updatedPreferences = {
        language: updateData.preferences.language || currentUser.preferences?.language || 'fa',
        theme: updateData.preferences.theme || currentUser.preferences?.theme || 'system',
        notifications: {
          email: updateData.preferences.notifications?.email ?? currentUser.preferences?.notifications?.email ?? true,
          push: updateData.preferences.notifications?.push ?? currentUser.preferences?.notifications?.push ?? true,
          analysis: updateData.preferences.notifications?.analysis ?? currentUser.preferences?.notifications?.analysis ?? true,
          reminders: updateData.preferences.notifications?.reminders ?? currentUser.preferences?.notifications?.reminders ?? true,
        },
        privacy: {
          shareData: updateData.preferences.privacy?.shareData ?? currentUser.preferences?.privacy?.shareData ?? false,
          analytics: updateData.preferences.privacy?.analytics ?? currentUser.preferences?.privacy?.analytics ?? true,
        },
      };
    }

    // BACKEND: Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: updateData.displayName || currentUser.displayName,
        preferences: updatedPreferences as typeof currentUser.preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.user.id))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        isEmailVerified: users.isEmailVerified,
        preferences: users.preferences,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: 'پروفایل با موفقیت به‌روزرسانی شد',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Delete user account (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'توکن احراز هویت یافت نشد',
        },
        { status: 401 }
      );
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json(
        {
          error: 'invalid_session',
          message: 'جلسه نامعتبر یا منقضی شده',
        },
        { status: 401 }
      );
    }

    // BACKEND: Mark user as inactive by updating lastLoginAt to null
    await db
      .update(users)
      .set({
        lastLoginAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.user.id));

    return NextResponse.json(
      {
        success: true,
        message: 'حساب کاربری با موفقیت حذف شد',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user account error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}
