// BACKEND: Save analysis result to history endpoint
// Implements the /api/analyze/save route for saving scan results to user's history

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { foodAnalyses } from '@/lib/schema';
import { z } from 'zod';

/**
 * Save Analysis Handler
 * Saves scan results to user's analysis history
 */

const saveAnalysisSchema = z.object({
  type: z.enum(['quick', 'detailed']),
  inputMethod: z.enum(['camera', 'text', 'barcode']),
  petId: z.string().uuid().optional(),
  inputData: z.object({
    productName: z.string().optional(),
    brand: z.string().optional(),
    text: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  analysisResult: z.object({
    overallScore: z.number(),
    summary: z.string().optional(),
    ingredients: z.array(z.string()),
    warnings: z.array(z.string()),
    recommendations: z.array(z.string()),
    nutritionalInfo: z.object({
      protein: z.number(),
      fat: z.number(),
      carbs: z.number(),
      fiber: z.number(),
      calories: z.number(),
    }).optional(),
    petCompatibility: z.object({
      dogs: z.enum(['safe', 'caution', 'dangerous']),
      cats: z.enum(['safe', 'caution', 'dangerous']),
    }).optional(),
  }),
});

// BACKEND: Save analysis result
export async function POST(request: NextRequest) {
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
    const validationResult = saveAnalysisSchema.safeParse(body);
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

    const { type, inputMethod, petId, inputData, analysisResult } = validationResult.data;

    // BACKEND: Save analysis to database
    const [savedAnalysis] = await db
      .insert(foodAnalyses)
      .values({
        userId: user.user.id,
        petId: petId || null,
        type,
        inputMethod,
        inputData,
        analysisResult: analysisResult as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        processingTime: 0, // Manual save, no processing time
        confidence: '0.90', // High confidence for manual saves
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'تحلیل با موفقیت در تاریخچه ذخیره شد',
        analysis: savedAnalysis,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save analysis error:', error);
    return NextResponse.json(
      {
        error: 'save_failed',
        message: 'خطا در ذخیره‌سازی تحلیل',
      },
      { status: 500 }
    );
  }
}