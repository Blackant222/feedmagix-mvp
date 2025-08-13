// BACKEND: Session management endpoint
// Implements the /api/auth/session route for session validation and refresh

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, refreshAccessToken, logoutUser } from '@/lib/auth';
import { z } from 'zod';

/**
 * Session Management Handler
 * Handles session validation, refresh, and logout operations
 * Uses existing auth infrastructure for session management
 */

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'توکن تازه‌سازی الزامی است'),
});

// BACKEND: Get current session information
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

    // BACKEND: Validate session using existing auth function
    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json(
        {
          error: 'invalid_session',
          message: 'جلسه نامعتبر یا منقضی شده',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session,
        user: session.user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Refresh access token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // BACKEND: Validate refresh token request
    const validationResult = refreshTokenSchema.safeParse(body);
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

    const { refreshToken } = validationResult.data;

    // BACKEND: Use existing auth function to refresh token
    const result = await refreshAccessToken(refreshToken);

    if (!result) {
      return NextResponse.json(
        {
          error: 'invalid_refresh_token',
          message: 'توکن تازه‌سازی نامعتبر یا منقضی شده',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'توکن با موفقیت تازه‌سازی شد',
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth-token=${result.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Logout user and invalidate session
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

    // BACKEND: Use existing auth function to logout user
    await logoutUser(token);

    return NextResponse.json(
      {
        success: true,
        message: 'خروج با موفقیت انجام شد',
      },
      {
        status: 200,
        headers: {
          'Set-Cookie':
            'auth-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
        },
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}
