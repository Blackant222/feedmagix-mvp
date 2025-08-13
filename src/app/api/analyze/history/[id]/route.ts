// BACKEND: Individual analysis history management endpoint
// Implements DELETE /api/analyze/history/[id] for removing specific analysis records

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { foodAnalyses } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Delete Analysis Handler
 * Permanently removes a specific analysis record from user's history
 * Ensures proper ownership validation before deletion
 */

// BACKEND: Delete specific analysis by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const analysisId = id;

    if (!analysisId) {
      return NextResponse.json(
        {
          error: 'validation_failed',
          message: 'شناسه تحلیل الزامی است',
        },
        { status: 400 }
      );
    }

    // BACKEND: Check if analysis exists and user owns it
    const [existingAnalysis] = await db
      .select()
      .from(foodAnalyses)
      .where(
        and(
          eq(foodAnalyses.id, analysisId),
          eq(foodAnalyses.userId, user.user.id)
        )
      )
      .limit(1);

    if (!existingAnalysis) {
      return NextResponse.json(
        {
          error: 'analysis_not_found',
          message: 'تحلیل یافت نشد یا شما مجاز به حذف آن نیستید',
        },
        { status: 404 }
      );
    }

    // BACKEND: Permanently delete the analysis record
    await db
      .delete(foodAnalyses)
      .where(
        and(
          eq(foodAnalyses.id, analysisId),
          eq(foodAnalyses.userId, user.user.id)
        )
      );

    return NextResponse.json(
      {
        success: true,
        message: 'تحلیل با موفقیت حذف شد',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete analysis error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Get specific analysis by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const analysisId = id;

    // BACKEND: Get analysis with ownership validation
    const [analysis] = await db
      .select()
      .from(foodAnalyses)
      .where(
        and(
          eq(foodAnalyses.id, analysisId),
          eq(foodAnalyses.userId, user.user.id)
        )
      )
      .limit(1);

    if (!analysis) {
      return NextResponse.json(
        {
          error: 'analysis_not_found',
          message: 'تحلیل یافت نشد',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        analysis,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}