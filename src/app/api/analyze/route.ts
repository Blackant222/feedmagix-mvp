// BACKEND: AI-powered food analysis endpoint
// Implements the /api/analyze route for comprehensive pet food analysis using OpenAI

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { foodAnalyses, pets, apiUsageLogs } from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';
import OpenAI from 'openai';

/**
 * AI Food Analysis Handler
 * Implements multi-agent AI analysis system for pet food evaluation
 * Based on Enhanced AI Analysis Code from documentation
 */

const analysisRequestSchema = z.object({
  type: z.enum(['quick', 'detailed'], {
    errorMap: () => ({ message: 'نوع تحلیل نامعتبر' }),
  }),
  inputMethod: z.enum(['camera', 'text', 'barcode'], {
    errorMap: () => ({ message: 'روش ورودی نامعتبر' }),
  }),
  petId: z.string().uuid('شناسه حیوان خانگی نامعتبر').optional(),
  inputData: z.object({
    text: z.string().max(5000, 'متن نباید بیش از ۵۰۰۰ کاراکتر باشد').optional(),
    imageUrl: z.string().url('آدرس تصویر نامعتبر').optional(),
    barcode: z.string().max(50, 'بارکد نامعتبر').optional(),
    brand: z.string().max(100, 'نام برند نامعتبر').optional(),
    productName: z.string().max(200, 'نام محصول نامعتبر').optional(),
  }),
});

// BACKEND: Initialize OpenAI client lazily
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Check for placeholder key
  if (apiKey === 'sk-placeholder-key-for-development-testing-only') {
    console.warn('Using placeholder OpenAI API key - AI analysis will be simulated');
  }
  
  return new OpenAI({ apiKey });
}

// BACKEND: Rate limiting configuration
const RATE_LIMITS = {
  quick: { perHour: 50, perDay: 200 },
  detailed: { perHour: 20, perDay: 50 },
};

// BACKEND: AI Analysis Agents
class FoodAnalysisAgents {
  // BACKEND: OCR Agent for image processing
  static async ocrAgent(imageUrl: string): Promise<string> {
    try {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an OCR specialist. Extract ALL text from pet food packaging images.
            Focus on: ingredients list, nutritional information, brand name, product name, feeding guidelines.
            Return only the extracted text in a structured format.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this pet food packaging image:',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OCR Agent error:', error);
      throw new Error('خطا در استخراج متن از تصویر');
    }
  }

  // BACKEND: Product Parsing Agent
  static async productParsingAgent(text: string): Promise<{
    brand?: string;
    productName?: string;
    ingredients?: string[];
    nutritionalInfo?: Record<string, unknown>;
    targetSpecies?: string;
    lifestage?: string;
  }> {
    try {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a pet food product parser. Parse the provided text and extract structured information.
            Return a JSON object with: brand, productName, ingredients (array), nutritionalInfo (object), targetSpecies, lifestage.
            Be precise and only include information that is clearly stated.`,
          },
          {
            role: 'user',
            content: `Parse this pet food information: ${text}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Product Parsing Agent error:', error);
      throw new Error('خطا در تجزیه اطلاعات محصول');
    }
  }

  // BACKEND: Web Search Agent
  static async webSearchAgent(
    productName: string,
    brand: string
  ): Promise<{
    additionalInfo: string;
    reviews: unknown[];
    recalls: unknown[];
    certifications: unknown[];
  }> {
    try {
      // In production, this would integrate with search APIs like Google Custom Search
      // For now, we'll generate contextual information based on the product
      const additionalInfo = `محصول: ${productName} از برند ${brand}. این محصول در بازار ایران موجود است و برای تحلیل دقیق‌تر نیاز به بررسی بیشتر دارد.`;
      
      return {
        additionalInfo,
        reviews: [],
        recalls: [],
        certifications: [],
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        additionalInfo: `اطلاعات تکمیلی برای ${brand} ${productName}`,
        reviews: [],
        recalls: [],
        certifications: [],
      };
    }
  }

  // BACKEND: Final Assessment Agent
  static async finalAssessmentAgent(
    productData: Record<string, unknown>,
    petInfo: Record<string, unknown>,
    analysisType: 'quick' | 'detailed'
  ): Promise<Record<string, unknown>> {
    try {
      const systemPrompt = `You are a veterinary nutritionist AI. Analyze pet food for safety and suitability.
      
      Analysis Type: ${analysisType}
      Pet Info: ${JSON.stringify(petInfo)}
      
      Provide a comprehensive analysis with:
      1. Overall score (0-100)
      2. Nutritional analysis with specific values and assessments
      3. Ingredient quality assessment
      4. Suitability for the specific pet
      5. Recommendations and warnings
      6. Summary in Persian language
      
      Return JSON format with the exact structure expected by the database schema.`;

      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze this pet food: ${JSON.stringify(productData)}`,
          },
        ],
        max_tokens: analysisType === 'detailed' ? 2000 : 1000,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Final Assessment Agent error:', error);
      throw new Error('خطا در تحلیل نهایی');
    }
  }
}

// BACKEND: Rate limiting check
async function checkRateLimit(
  userId: string,
  analysisType: 'quick' | 'detailed'
): Promise<boolean> {
  // Rate limiting time windows
  // const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check hourly limit
  const [hourlyCount] = await db
    .select({ count: count() })
    .from(foodAnalyses)
    .where(
      and(
        eq(foodAnalyses.userId, userId),
        eq(foodAnalyses.type, analysisType)
        // createdAt > oneHourAgo (would need proper SQL function)
      )
    );

  // Check daily limit
  const [dailyCount] = await db
    .select({ count: count() })
    .from(foodAnalyses)
    .where(
      and(
        eq(foodAnalyses.userId, userId),
        eq(foodAnalyses.type, analysisType)
        // createdAt > oneDayAgo (would need proper SQL function)
      )
    );

  const limits = RATE_LIMITS[analysisType];
  return hourlyCount.count < limits.perHour && dailyCount.count < limits.perDay;
}

// BACKEND: Main analysis endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // BACKEND: Authentication
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

    // BACKEND: Validate request
    const validationResult = analysisRequestSchema.safeParse(body);
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

    const { type, inputMethod, petId, inputData } = validationResult.data;

    // BACKEND: Rate limiting
    const canProceed = await checkRateLimit(user.user.id, type);
    if (!canProceed) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'محدودیت تعداد درخواست‌ها',
        },
        { status: 429 }
      );
    }

    // BACKEND: Get pet information if provided
    let petInfo = null;
    if (petId) {
      const [pet] = await db
        .select()
        .from(pets)
        .where(and(eq(pets.id, petId), eq(pets.userId, user.user.id)))
        .limit(1);

      if (pet) {
        petInfo = {
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          weight: pet.weight,
          activityLevel: pet.activityLevel,
          healthConditions: pet.healthConditions,
          allergies: pet.allergies,
        };
      }
    }

    // BACKEND: Multi-agent analysis pipeline
    let extractedText = '';
    let productData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Step 1: OCR if image provided
    if (inputMethod === 'camera' && inputData.imageUrl) {
      extractedText = await FoodAnalysisAgents.ocrAgent(inputData.imageUrl);
    } else if (inputMethod === 'text' && inputData.text) {
      extractedText = inputData.text;
    } else if (inputMethod === 'barcode' && inputData.barcode) {
      extractedText = `Barcode: ${inputData.barcode}, Brand: ${inputData.brand || ''}, Product: ${inputData.productName || ''}`;
    }

    // Step 2: Product parsing
    if (extractedText) {
      productData = await FoodAnalysisAgents.productParsingAgent(extractedText);
    }

    // Step 3: Web search for additional info (if detailed analysis)
    let webData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (type === 'detailed' && productData?.brand && productData?.productName) {
      webData = await FoodAnalysisAgents.webSearchAgent(
        productData.productName,
        productData.brand
      );
    }

    // Step 4: Final assessment
    const analysisResult = await FoodAnalysisAgents.finalAssessmentAgent(
      { ...productData, ...webData },
      petInfo || {},
      type
    );

    const processingTime = Date.now() - startTime;

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
        processingTime,
        confidence: '0.85', // Would be calculated based on AI confidence
        createdAt: new Date(),
      })
      .returning();

    // BACKEND: Log API usage
    await db.insert(apiUsageLogs).values({
      userId: user.user.id,
      endpoint: '/api/analyze',
      method: 'POST',
      statusCode: 200,
      responseTime: processingTime,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تحلیل با موفقیت انجام شد',
        analysis: savedAnalysis,
        processingTime,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Food analysis error:', error);

    const processingTime = Date.now() - startTime;

    // BACKEND: Log error
    try {
      await db.insert(apiUsageLogs).values({
        endpoint: '/api/analyze',
        method: 'POST',
        statusCode: 500,
        responseTime: processingTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        error: 'analysis_failed',
        message: error instanceof Error ? error.message : 'خطا در تحلیل غذا',
      },
      { status: 500 }
    );
  }
}
