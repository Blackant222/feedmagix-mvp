import { NextRequest, NextResponse } from 'next/server';
import { registerWithPin } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for PIN registration
const pinRegistrationSchema = z.object({
  identifier: z.string().min(1, 'شناسه الزامی است'),
  pin: z.string().min(4, 'رمز عبور باید حداقل ۴ رقم باشد').max(8, 'رمز عبور باید حداکثر ۸ رقم باشد'),
  displayName: z.string().optional(),
  city: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = pinRegistrationSchema.safeParse(body);
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

    const { identifier, pin, displayName, city } = validationResult.data;

    // Register user with PIN
    const result = await registerWithPin(identifier, pin, displayName, city);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'registration_failed',
          message: result.error || 'خطا در ثبت‌نام',
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'ثبت‌نام با موفقیت انجام شد',
        userId: result.userId,
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('PIN registration error:', error);

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