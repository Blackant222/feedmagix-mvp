import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithPin } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for PIN login
const pinLoginSchema = z.object({
  identifier: z.string().min(1, 'شناسه الزامی است'),
  pin: z.string().min(4, 'رمز عبور باید حداقل ۴ رقم باشد'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = pinLoginSchema.safeParse(body);
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

    const { identifier, pin } = validationResult.data;

    // Authenticate user with PIN
    const result = await authenticateWithPin(identifier, pin);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'authentication_failed',
          message: result.error || 'خطا در ورود',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'ورود با موفقیت انجام شد',
        accessToken: result.sessionData?.accessToken,
        refreshToken: result.sessionData?.refreshToken,
        expiresAt: result.sessionData?.expiresAt,
        user: result.user,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('PIN login error:', error);

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// CORS headers
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}