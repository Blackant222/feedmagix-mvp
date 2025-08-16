// BACKEND: OpenAI integration utilities for food analysis with proper schema alignment
import OpenAI from 'openai';
// CHANGE: Removed unused imports 'and' and 'gte'
import { db } from './db';
import { foodAnalyses, apiUsageLogs } from './schema';
import { eq, desc } from 'drizzle-orm';

/**
 * OpenAI client configuration with security best practices
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

/**
 * Rate limiting configuration based on OpenAI API limits
 */
const RATE_LIMITS = {
  RPM: 500, // Requests per minute
  RPD: 10000, // Requests per day
  TPM: 80000, // Tokens per minute
  TPD: 2000000, // Tokens per day
  IPM: 5, // Images per minute
};

/**
 * Predefined prompts for food analysis
 */
const ANALYSIS_PROMPTS = {
  quick: {
    persian: `این تصویر غذا را تحلیل کن و بگو آیا برای حیوان خانگی مناسب است یا خیر. پاسخ کوتاه و مفید بده.`,
    english: `Analyze this food image and tell me if it's suitable for pets. Give a brief and helpful response.`,
  },
  detailed: {
    persian: `این تصویر غذا را به طور کامل تحلیل کن:
1. نوع غذا و مواد تشکیل دهنده
2. آیا برای حیوانات خانگی مناسب است؟
3. مواد مضر احتمالی
4. توصیه‌های تغذیه‌ای
5. نکات ایمنی

پاسخ را به فارسی و کامل بده.`,
    english: `Analyze this food image comprehensively:
1. Food type and ingredients
2. Is it suitable for pets?
3. Potential harmful substances
4. Nutritional recommendations
5. Safety notes

Provide a complete response in English.`,
  },
};

/**
 * Log API usage for monitoring and rate limiting
 */
async function logApiUsage(
  userId: string,
  endpoint: string,
  responseTime: number,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    await db.insert(apiUsageLogs).values({
      userId,
      endpoint,
      method: 'POST',
      statusCode: success ? 200 : 500,
      responseTime,
      errorMessage: error,
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

/**
 * Check rate limits for user
 */
async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent usage
    const recentUsage = await db
      .select()
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.userId, userId));

    const minuteUsage = recentUsage.filter(
      (log) => log.createdAt >= oneMinuteAgo
    );
    const dayUsage = recentUsage.filter((log) => log.createdAt >= oneDayAgo);

    // Check request limits
    if (minuteUsage.length >= RATE_LIMITS.RPM) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: too many requests per minute',
      };
    }

    if (dayUsage.length >= RATE_LIMITS.RPD) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: too many requests per day',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: false, reason: 'Rate limit check failed' };
  }
}

/**
 * Analyze food image using OpenAI Vision API
 */
export async function analyzeFoodImage(
  imageBase64: string,
  analysisType: 'quick' | 'detailed' = 'quick',
  language: 'persian' | 'english' = 'persian',
  petId?: string
): Promise<{
  success: boolean;
  analysis?: string;
  analysisId?: string;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Get prompt based on type and language
    const prompt = ANALYSIS_PROMPTS[analysisType][language];

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: analysisType === 'detailed' ? 'high' : 'low',
              },
            },
          ],
        },
      ],
      max_tokens: analysisType === 'detailed' ? 1000 : 300,
      temperature: 0.3,
    });

    const analysis = response.choices[0]?.message?.content;
    if (!analysis) {
      throw new Error('No analysis received from OpenAI');
    }

    // Determine if food is healthy based on analysis
    const isHealthy =
      !analysis.toLowerCase().includes('مضر') &&
      !analysis.toLowerCase().includes('خطرناک') &&
      !analysis.toLowerCase().includes('harmful') &&
      !analysis.toLowerCase().includes('toxic');

    // Save analysis to database
    await db.insert(foodAnalyses).values({
      userId: 'system', // Will be replaced with actual userId in API routes
      petId: petId || null,
      type: analysisType,
      inputMethod: 'camera',
      inputData: {
        imageUrl: `data:image/jpeg;base64,${imageBase64.substring(0, 100)}...`, // Truncated for storage
      },
      analysisResult: {
        overallScore: isHealthy ? 85 : 45,
        nutritionalAnalysis: {
          protein: { value: 0, assessment: 'Unknown' },
          fat: { value: 0, assessment: 'Unknown' },
          carbohydrates: { value: 0, assessment: 'Unknown' },
          fiber: { value: 0, assessment: 'Unknown' },
          vitamins: [],
          minerals: [],
        },
        ingredients: [],
        suitability: {
          forPet: isHealthy,
          reasons: [analysis],
          alternatives: [],
        },
        recommendations: [],
        warnings: isHealthy ? [] : ['Potential safety concerns detected'],
        summary: analysis,
      },
      confidence: '0.85',
      processingTime: Date.now() - startTime,
    });

    const responseTime = Date.now() - startTime;
    await logApiUsage('system', '/api/analyze-food', responseTime, true);

    return {
      success: true,
      analysis,
      analysisId: 'generated-id', // Will be returned from database insert
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await logApiUsage(
      'system',
      '/api/analyze-food',
      responseTime,
      false,
      errorMessage
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get analysis history for a user
 */
export async function getAnalysisHistory(
  petId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  analyses: Array<{
    id: string;
    type: string;
    result: string;
    confidence: number;
    isHealthy: boolean;
    createdAt: Date;
  }>;
  total: number;
}> {
  try {
    const whereClause = petId ? eq(foodAnalyses.petId, petId) : undefined;

    const rawAnalyses = await db
      .select()
      .from(foodAnalyses)
      .where(whereClause)
      .orderBy(desc(foodAnalyses.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform the data to match the expected return type
    const analyses = rawAnalyses.map((analysis) => ({
      id: analysis.id,
      type: analysis.type,
      result: analysis.analysisResult?.summary || 'No summary available',
      confidence: parseFloat(analysis.confidence || '0'),
      isHealthy: analysis.analysisResult?.suitability?.forPet || false,
      createdAt: analysis.createdAt,
    }));

    // Get total count
    const totalResult = await db
      .select({ count: foodAnalyses.id })
      .from(foodAnalyses)
      .where(whereClause);

    return {
      analyses,
      total: totalResult.length,
    };
  } catch (error) {
    console.error('Failed to get analysis history:', error);
    return { analyses: [], total: 0 };
  }
}

/**
 * Get user API usage statistics
 */
export async function getUserUsageStats(userId: string): Promise<{
  dailyRequests: number;
  monthlyRequests: number;
  lastRequest?: Date;
}> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const usage = await db
      .select()
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.userId, userId));

    const dailyRequests = usage.filter(
      (log) => log.createdAt >= oneDayAgo
    ).length;
    const monthlyRequests = usage.filter(
      (log) => log.createdAt >= oneMonthAgo
    ).length;
    const lastRequest = usage.length > 0 ? usage[0].createdAt : undefined;

    return {
      dailyRequests,
      monthlyRequests,
      lastRequest,
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return { dailyRequests: 0, monthlyRequests: 0 };
  }
}

export { checkRateLimit };
