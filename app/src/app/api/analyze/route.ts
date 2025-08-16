// BACKEND: AI-powered food analysis endpoint
// Implements the /api/analyze route for comprehensive pet food analysis using OpenAI

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { foodAnalyses, pets, apiUsageLogs, foodCache } from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import OpenAI from 'openai';
import crypto from 'crypto';

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
    imageBase64: z.string().optional(), // Accept base64 images from frontend
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

/**
 * Create a hash for product identification based on extracted text
 * This helps identify if we've seen this product before
 */
function createProductHash(extractedText: string): string {
  // Normalize text by removing extra spaces, converting to lowercase
  const normalizedText = extractedText
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  return crypto.createHash('sha256').update(normalizedText).digest('hex');
}

/**
 * Check if a product exists in cache and return cached data
 */
/**
 * Validate if cached product data is complete and accurate
 */
function validateCachedData(cachedProduct: any): { isComplete: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  // Check essential product information
  if (!cachedProduct.brand || cachedProduct.brand.trim() === '') {
    missingFields.push('brand');
  }
  if (!cachedProduct.productName || cachedProduct.productName.trim() === '') {
    missingFields.push('productName');
  }
  
  // Check ingredients
  if (!cachedProduct.ingredients || !Array.isArray(cachedProduct.ingredients) || cachedProduct.ingredients.length === 0) {
    missingFields.push('ingredients');
  }
  
  // Check nutritional information
  if (!cachedProduct.nutritionalInfo || typeof cachedProduct.nutritionalInfo !== 'object' || Object.keys(cachedProduct.nutritionalInfo).length === 0) {
    missingFields.push('nutritionalInfo');
  } else {
    // Check for essential nutritional values
    const nutrition = cachedProduct.nutritionalInfo;
    const essentialNutrients = ['protein', 'fat', 'fiber'];
    const missingNutrients = essentialNutrients.filter(nutrient => 
      !nutrition[nutrient] || nutrition[nutrient] === '0%' || nutrition[nutrient] === 0
    );
    if (missingNutrients.length > 0) {
      missingFields.push(`nutritionalInfo.${missingNutrients.join(', ')}`);
    }
  }
  
  const isComplete = missingFields.length === 0;
  return { isComplete, missingFields };
}

async function checkProductCache(productHash: string) {
  try {
    const cachedProduct = await db
      .select()
      .from(foodCache)
      .where(eq(foodCache.productHash, productHash))
      .limit(1);
    
    if (cachedProduct.length > 0) {
       const product = cachedProduct[0];
       
       // Validate cached data completeness
       const validation = validateCachedData(product);
       
       // Update scan count and last scanned timestamp
       await db
         .update(foodCache)
         .set({
           scanCount: (product.scanCount || 0) + 1,
           lastScannedAt: new Date(),
           updatedAt: new Date(),
         })
         .where(eq(foodCache.id, product.id));
       
       // Return product with validation info
       return {
         ...product,
         _cacheValidation: validation
       };
     }
    
    return null;
  } catch (error) {
    console.error('Error checking product cache:', error);
    return null;
  }
}

/**
 * Save product to cache for future use
 */
async function saveProductToCache(productHash: string, ocrResult: Record<string, unknown>, productData: Record<string, unknown>) {
  try {
    const productInfo = ocrResult.productInfo as Record<string, unknown> || {};
    
    // Use upsert to handle duplicate product hashes
    await db.insert(foodCache).values({
      productHash,
      brand: (productData.brand || productInfo.brand || null) as string | null,
      productName: (productData.productName || productInfo.productName || null) as string | null,
      flavor: (productInfo.flavor || null) as string | null,
      extractedText: ocrResult.extractedText as string,
      detectedSpecies: ocrResult.detectedSpecies as string,
      ingredients: (productData.ingredients || []) as string[],
      nutritionalInfo: (productData.nutritionalInfo || {}) as Record<string, unknown>,
      targetSpecies: (productData.targetSpecies || null) as string | null,
      lifestage: (productData.lifestage || null) as string | null,
      ocrConfidence: String(ocrResult.confidence || 0.85), // Convert to string
    }).onConflictDoUpdate({
      target: [foodCache.productHash],
      set: {
        brand: (productData.brand || productInfo.brand || null) as string | null,
        productName: (productData.productName || productInfo.productName || null) as string | null,
        flavor: (productInfo.flavor || null) as string | null,
        extractedText: ocrResult.extractedText as string,
        detectedSpecies: ocrResult.detectedSpecies as string,
        ingredients: (productData.ingredients || []) as string[],
        nutritionalInfo: (productData.nutritionalInfo || {}) as Record<string, unknown>,
        targetSpecies: (productData.targetSpecies || null) as string | null,
        lifestage: (productData.lifestage || null) as string | null,
        ocrConfidence: String(ocrResult.confidence || 0.85),
        updatedAt: new Date(),
      },
    });
    
    logger.debug('Product saved/updated in cache', { productHash: productHash.substring(0, 12) + '...' });
  } catch (error) {
    console.error('Error saving product to cache:', error);
  }
}

// BACKEND: AI Analysis Agents - Multi-Agent System
class FoodAnalysisAgents {
  // BACKEND: Agent 1 - OCR Processing with Species Detection
  static async ocrAgent(imageBase64: string): Promise<{
    extractedText: string;
    detectedSpecies: 'cat' | 'dog' | 'unknown';
    foodType: 'wet' | 'dry' | 'unknown';
    productInfo: {
      brand?: string;
      productName?: string;
      flavor?: string;
    };
  }> {
    try {
      logger.aiAnalysis('Agent 1 (OCR): Starting image analysis');
      const openai = getOpenAIClient();
      
      // Convert base64 to data URL
      const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert OCR and pet food specialist. Extract ALL text from pet food packaging and identify the target species.
            
            CRITICAL: Determine if this is CAT food or DOG food based on:
            - Text mentioning "cat", "feline", "گربه"
            - Text mentioning "dog", "canine", "سگ"
            - Package design and imagery
            - Nutritional content typical for cats vs dogs
            
            CRITICAL: Determine if this is WET or DRY food based on:
            - Package type: pouch, can, tray = wet; bag, kibble = dry
            - Text mentioning "wet", "dry", "kibble", "pouch", "can", "gravy", "pate"
            - Moisture content: >70% = wet, <15% = dry
            - Visual appearance of food if visible
            
            Extract:
            1. ALL visible text (ingredients, guaranteed analysis, brand, product name)
            2. Target species (cat/dog/unknown)
            3. Food type (wet/dry/unknown)
            4. Brand name (look for prominent brand text like ROYAL CANIN, HILL'S, etc.)
            5. Product name
            6. Flavor/taste (chicken, beef, fish, etc.)
            
            Return JSON format:
            {
              "extractedText": "all text found",
              "detectedSpecies": "cat|dog|unknown",
              "foodType": "wet|dry|unknown",
              "brand": "brand name",
              "productName": "product name",
              "flavor": "flavor/taste"
            }`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this pet food packaging image and extract all information:',
              },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '{}';
      logger.aiAnalysis('Agent 1 (OCR): Raw response received', { 
        responseLength: content.length,
        hasContent: !!content
      });
      
      try {
        // Try to extract JSON from the content if it's wrapped in markdown
        let jsonContent = content;
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
        
        const parsed = JSON.parse(jsonContent);
        const result = {
          extractedText: parsed.extractedText || '',
          detectedSpecies: parsed.detectedSpecies || 'unknown',
          foodType: parsed.foodType || 'unknown',
          productInfo: {
            brand: parsed.brand,
            productName: parsed.productName,
            flavor: parsed.flavor,
          },
        };
        logger.aiAnalysis('Agent 1 (OCR): Completed successfully', {
          extractedText: result.extractedText?.substring(0, 100) + '...',
          detectedSpecies: result.detectedSpecies
        });
        return result;
      } catch (parseError) {
        logger.aiAnalysis('Agent 1 (OCR): JSON parse failed, using fallback', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
        // Try to extract basic info from raw text
        const extractedText = content;
        const detectedSpecies = content.toLowerCase().includes('cat') || content.toLowerCase().includes('گربه') ? 'cat' : 
                              content.toLowerCase().includes('dog') || content.toLowerCase().includes('سگ') ? 'dog' : 'unknown';
        
        // Detect food type from text
        const foodType = content.toLowerCase().includes('pouch') || content.toLowerCase().includes('can') || 
                        content.toLowerCase().includes('gravy') || content.toLowerCase().includes('pate') ? 'wet' :
                        content.toLowerCase().includes('kibble') || content.toLowerCase().includes('dry') ? 'dry' : 'unknown';
        
        return {
          extractedText,
          detectedSpecies: detectedSpecies as 'cat' | 'dog' | 'unknown',
          foodType: foodType as 'wet' | 'dry' | 'unknown',
          productInfo: {
            brand: content.includes('ROYAL CANIN') ? 'ROYAL CANIN' : undefined,
            productName: content.includes('VETERINARY') ? content.split('\n')[0] : undefined,
          },
        };
      }
    } catch (error) {
      console.error('❌ Agent 1 (OCR) error:', error);
      throw new Error('خطا در استخراج متن از تصویر');
    }
  }

  // BACKEND: Agent 2 - Product Information Parsing with Species Compatibility
  static async productParsingAgent(
    extractedText: string,
    detectedSpecies: string,
    userPetSpecies: string,
    foodType: string
  ): Promise<{
    brand?: string;
    productName?: string;
    ingredients?: string[];
    nutritionalInfo?: Record<string, unknown>;
    targetSpecies?: string;
    lifestage?: string;
    foodType?: string;
    speciesCompatibility: {
      isCompatible: boolean;
      reason: string;
      score: number;
    };
  }> {
    try {
      logger.aiAnalysis('Agent 2 (Product Parsing): Starting analysis', {
      detectedSpecies,
      userPetSpecies
    });
      
      const openai = getOpenAIClient();
      
      // Species compatibility check
      const isCompatible = detectedSpecies === userPetSpecies || detectedSpecies === 'unknown';
      let compatibilityScore = 0;
      let compatibilityReason = '';
      
      if (detectedSpecies === 'unknown') {
        compatibilityScore = 50;
        compatibilityReason = 'نوع حیوان هدف مشخص نیست - نیاز به بررسی دقیق‌تر';
      } else if (isCompatible) {
        compatibilityScore = 100;
        compatibilityReason = `این محصول برای ${userPetSpecies === 'cat' ? 'گربه' : 'سگ'} مناسب است`;
      } else {
        compatibilityScore = 0;
        compatibilityReason = `خطر! این محصول برای ${detectedSpecies === 'cat' ? 'گربه' : 'سگ'} است اما حیوان شما ${userPetSpecies === 'cat' ? 'گربه' : 'سگ'} است`;
      }
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a pet food product parser. Parse the provided text and extract structured information.
            
            Extract:
            1. Brand name (look carefully for prominent brands like ROYAL CANIN, Hill's, Purina, etc.)
            2. Product name
            3. Ingredients list (array)
            4. Nutritional information (guaranteed analysis)
            5. Target species (cat/dog)
            6. Life stage (puppy, adult, senior, kitten, etc.)
            7. Food type (wet/dry) based on package type and moisture content
            
            BRAND DETECTION: Look carefully for brand names in the text. Common patterns:
            - "ROYAL CANIN" (often in all caps)
            - "Hill's" or "HILL'S"
            - Brand names are usually prominent and repeated
            - Don't confuse product lines with brand names
            
            Return JSON format:
            {
              "brand": "brand name",
              "productName": "product name",
              "ingredients": ["ingredient1", "ingredient2"],
              "nutritionalInfo": {
                "protein": "percentage",
                "fat": "percentage",
                "fiber": "percentage",
                "moisture": "percentage"
              },
              "targetSpecies": "cat|dog|unknown",
              "lifestage": "puppy|adult|senior|kitten|all",
              "foodType": "wet|dry|unknown"
            }`,
          },
          {
            role: 'user',
            content: `Parse this pet food information: ${extractedText}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      logger.aiAnalysis('Agent 2 (Product Parsing): Raw response received', {
        responseLength: content.length
      });
      
      const parsed = JSON.parse(content);
      const result = {
        ...parsed,
        foodType: parsed.foodType || foodType,
        speciesCompatibility: {
          isCompatible,
          reason: compatibilityReason,
          score: compatibilityScore,
        },
      };
      
      logger.aiAnalysis('Agent 2 (Product Parsing): Completed successfully', {
          productName: result.productName,
          brand: result.brand,
          category: result.category
        });
      return result;
    } catch (error) {
      console.error('❌ Agent 2 (Product Parsing) error:', error);
      throw new Error('خطا در تجزیه اطلاعات محصول');
    }
  }

  // BACKEND: Agent 3 - Enhanced Web Search with Persian Language Support
  static async webSearchAgent(
    productName: string,
    brand: string,
    detectedSpecies: 'cat' | 'dog' | 'unknown'
  ): Promise<{
    ingredients: string[];
    guaranteedAnalysis: Record<string, string>;
    reviews: { rating: number; summary: string }[];
    recalls: string[];
    additionalInfo: string;
    searchLanguage: 'english' | 'persian';
    searchSuccess: boolean;
  }> {
    try {
      logger.aiAnalysis('Agent 3 (Web Search): Starting enhanced search', {
        productName,
        brand,
        detectedSpecies
      });
      
      const openai = getOpenAIClient();
      
      // First attempt: English search using OpenAI web search
      let searchResult = await this.performWebSearch(openai, productName, brand, 'english', detectedSpecies);
      
      // If English search fails or returns minimal results, try Persian search
      if (!searchResult.searchSuccess) {
        logger.aiAnalysis('Agent 3 (Web Search): English search failed, trying Persian', {
          productName,
          brand
        });
        
        // Create Persian search query
        const persianSpecies = detectedSpecies === 'cat' ? 'گربه' : detectedSpecies === 'dog' ? 'سگ' : '';
        const persianQuery = `${brand} ${persianSpecies}`.trim();
        
        searchResult = await this.performWebSearch(openai, persianQuery, brand, 'persian', detectedSpecies);
      }
      
      logger.aiAnalysis('Agent 3 (Web Search): Search completed', {
        searchLanguage: searchResult.searchLanguage,
        searchSuccess: searchResult.searchSuccess,
        ingredientsFound: searchResult.ingredients.length
      });
      
      return searchResult;
    } catch (error) {
      logger.error('Agent 3 (Web Search) error:', { error: error instanceof Error ? error.message : String(error) });
      return {
        ingredients: [],
        guaranteedAnalysis: {},
        reviews: [],
        recalls: [],
        additionalInfo: `خطا در جستجوی اطلاعات محصول: ${productName}`,
        searchLanguage: 'english',
        searchSuccess: false,
      };
    }
  }

  // Helper method for performing web search
  private static async performWebSearch(
    openai: any,
    query: string,
    brand: string,
    language: 'english' | 'persian',
    detectedSpecies: 'cat' | 'dog' | 'unknown'
  ): Promise<{
    ingredients: string[];
    guaranteedAnalysis: Record<string, string>;
    reviews: { rating: number; summary: string }[];
    recalls: string[];
    additionalInfo: string;
    searchLanguage: 'english' | 'persian';
    searchSuccess: boolean;
  }> {
    try {
      // Use OpenAI's web search capability
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-search-preview', // Use the search-enabled model
        messages: [
          {
            role: 'system',
            content: `You are a pet food research specialist with web search capabilities. Search for accurate, real-world information about pet food products.
            
            CRITICAL JSON RESPONSE REQUIREMENT:
            - You MUST respond with VALID JSON ONLY
            - NO explanatory text before or after the JSON
            - NO markdown code blocks or formatting
            - ONLY return the raw JSON object
            
            Search Strategy:
            - Look for official product pages, ingredient lists, and nutritional information
            - Find customer reviews and ratings from pet stores and review sites
            - Check for any recalls or safety alerts
            - Verify information from multiple reliable sources
            
            Language Context: ${language === 'persian' ? 'This is an Iranian/Persian pet food product. Search using Persian terms and Iranian pet food retailers.' : 'Search using English terms and international pet food databases.'}
            
            CRITICAL: Extract REAL nutritional values, not placeholders. If you cannot find complete nutritional information, set searchSuccess to false.
            
            INGREDIENT EXTRACTION REQUIREMENTS:
            - Extract the COMPLETE ingredient list in order of weight (first ingredient = highest weight)
            - Include ALL ingredients, not just the first few
            - Look for ingredient lists on official product pages, retailer sites, and manufacturer websites
            - Minimum 8-15 ingredients for most commercial pet foods
            - Include preservatives, vitamins, minerals, and additives
            - If ingredient list is incomplete or has fewer than 5 ingredients, set searchSuccess to false
            
            RESPOND WITH THIS EXACT JSON FORMAT (NO OTHER TEXT):
            {
              "ingredients": ["deboned chicken", "brown rice flour", "chicken meal", "sweet potatoes", "peas", "chicken fat", "natural flavors", "dried beet pulp", "fish oil", "salt", "potassium chloride", "vitamin E supplement", "zinc proteinate", "mixed tocopherols"],
              "guaranteedAnalysis": {
                "protein": "28%",
                "fat": "16%",
                "fiber": "3.5%",
                "moisture": "10%",
                "ash": "7%",
                "carbohydrates": "35.5%",
                "calories": "3500 kcal/kg"
              },
              "reviews": [
                {"rating": 4.5, "summary": "real customer review summary"},
                {"rating": 3.8, "summary": "another real review"}
              ],
              "recalls": ["any known recalls or safety issues"],
              "additionalInfo": "comprehensive product information",
              "searchSuccess": true
            }
            
            Note: Calculate carbohydrates if not listed directly: 100 - protein - fat - fiber - moisture - ash`,
          },
          {
            role: 'user',
            content: language === 'persian' 
              ? `جستجو برای اطلاعات کامل محصول غذای حیوانات: ${query}. لطفاً لیست کامل ترکیبات (حداقل 8-15 ماده) را از سایت رسمی یا فروشگاه‌های معتبر پیدا کنید. همچنین تجزیه تضمینی با درصدهای واقعی و نظرات مشتریان. اگر لیست ترکیبات کامل نیست یا کمتر از 5 ماده دارد، searchSuccess را false قرار دهید. فقط JSON خالص برگردانید، بدون توضیح اضافی.`
              : `Search for complete information about pet food product: ${query} by ${brand}. Find the COMPLETE ingredients list (minimum 8-15 ingredients) from official product pages or retailer websites. Also find guaranteed analysis with real percentages and customer reviews. If ingredient list is incomplete or has fewer than 5 ingredients, set searchSuccess to false. Return ONLY valid JSON, no explanatory text.`,
          },
        ],
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content || '{}';
      logger.aiAnalysis(`Agent 3 (Web Search): ${language} search response received`, {
        responseLength: content.length,
        query
      });
      
      try {
        // Try to extract JSON from the content with multiple strategies
        let jsonContent = content.trim();
        
        // Strategy 1: Look for JSON code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        } else {
          // Strategy 2: Look for JSON object starting with { and ending with }
          const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            jsonContent = jsonObjectMatch[0];
          } else {
            // Strategy 3: Try to find JSON-like structure
            const lines = content.split('\n');
            const jsonLines = [];
            let inJson = false;
            for (const line of lines) {
              if (line.trim().startsWith('{')) {
                inJson = true;
              }
              if (inJson) {
                jsonLines.push(line);
              }
              if (line.trim().endsWith('}') && inJson) {
                break;
              }
            }
            if (jsonLines.length > 0) {
              jsonContent = jsonLines.join('\n');
            }
          }
        }
        
        const parsed = JSON.parse(jsonContent);
        
        // Validate search success based on content quality - require complete nutritional data and ingredients
        const hasIngredients = parsed.ingredients && parsed.ingredients.length >= 5;
        const hasCompleteIngredients = parsed.ingredients && parsed.ingredients.length >= 8; // Most commercial pet foods have 8+ ingredients
        const hasNutrition = parsed.guaranteedAnalysis && Object.keys(parsed.guaranteedAnalysis).length >= 3;
        
        // Check for essential nutritional values
        const hasProtein = parsed.guaranteedAnalysis?.protein && parsed.guaranteedAnalysis.protein !== '0%';
        const hasFat = parsed.guaranteedAnalysis?.fat && parsed.guaranteedAnalysis.fat !== '0%';
        const hasFiber = parsed.guaranteedAnalysis?.fiber && parsed.guaranteedAnalysis.fiber !== '0%';
        
        // Prefer complete ingredient lists but accept partial if nutritional data is complete
        const isComplete = hasIngredients && hasNutrition && hasProtein && hasFat && hasFiber;
        const searchSuccess = isComplete && (parsed.searchSuccess !== false);
        
        // Log ingredient extraction quality
        logger.aiAnalysis(`Agent 3 (Web Search): Ingredient extraction quality`, {
          ingredientCount: parsed.ingredients?.length || 0,
          hasCompleteIngredients,
          searchSuccess
        });
        
        return {
          ingredients: parsed.ingredients || [],
          guaranteedAnalysis: parsed.guaranteedAnalysis || {},
          reviews: parsed.reviews || [],
          recalls: parsed.recalls || [],
          additionalInfo: parsed.additionalInfo || (language === 'persian' ? `محصول: ${query}` : `Product: ${query} by ${brand}`),
          searchLanguage: language,
          searchSuccess,
        };
      } catch (parseError) {
        logger.aiAnalysis(`Agent 3 (Web Search): ${language} search parse failed`, {
          error: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
        
        return {
          ingredients: [],
          guaranteedAnalysis: {},
          reviews: [],
          recalls: [],
          additionalInfo: language === 'persian' ? `خطا در تجزیه نتایج جستجو: ${query}` : `Error parsing search results: ${query}`,
          searchLanguage: language,
          searchSuccess: false,
        };
      }
    } catch (error) {
      logger.aiAnalysis(`Agent 3 (Web Search): ${language} search failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      });
      
      return {
        ingredients: [],
        guaranteedAnalysis: {},
        reviews: [],
        recalls: [],
        additionalInfo: language === 'persian' ? `خطا در جستجوی ${query}` : `Search failed for ${query}`,
        searchLanguage: language,
        searchSuccess: false,
      };
    }
  }

  // BACKEND: Agent 5 - Final Assessment with Persian Summary
  static async finalAssessmentAgent(
    productData: Record<string, unknown>,
    petInfo: Record<string, unknown>,
    webData: Record<string, unknown>,
    analysisType: 'quick' | 'detailed'
  ): Promise<Record<string, unknown>> {
    try {
      logger.aiAnalysis('Agent 5 (Final Assessment): Starting comprehensive analysis', {
      hasProductData: !!productData,
      hasPetInfo: !!petInfo,
      hasWebData: !!webData,
      speciesCompatibility: productData?.speciesCompatibility
    });
      
      // Check for species compatibility first
      const speciesCompatibility = productData?.speciesCompatibility as any;
      if (speciesCompatibility && !speciesCompatibility.isCompatible) {
        logger.aiAnalysis('Species mismatch detected, returning score 0', {
          reason: speciesCompatibility.reason,
          score: speciesCompatibility.score
        });
        
        return {
          overallScore: 0,
          summary: `این غذا برای نوع حیوان خانگی شما مناسب نیست! ${speciesCompatibility.reason}`,
          speciesWarning: {
            isSpeciesMismatch: true,
            message: "غذای اشتباه برای نوع حیوان خانگی شما!",
            reason: speciesCompatibility.reason
          },
          nutritionalAnalysis: {
            protein: { value: "نامشخص", assessment: "غذا برای این حیوان مناسب نیست", score: 0 },
            fat: { value: "نامشخص", assessment: "غذا برای این حیوان مناسب نیست", score: 0 },
            fiber: { value: "نامشخص", assessment: "غذا برای این حیوان مناسب نیست", score: 0 },
            moisture: { value: "نامشخص", assessment: "غذا برای این حیوان مناسب نیست", score: 0 },
            carbohydrates: { value: "نامشخص", assessment: "غذا برای این حیوان مناسب نیست", score: 0 },
            calories: { value: "نامشخص", assessment: "غذا برای این حیوان مناسب نیست", score: 0 }
          },
          ingredientAnalysis: {
            mainIngredients: ["نامناسب برای این حیوان"],
            qualityScore: 0,
            concerns: ["غذای اشتباه برای نوع حیوان"],
            benefits: []
          },
          petSuitability: {
            isRecommended: false,
            compatibilityMessage: 'نامناسب برای حیوان خانگی شما',
            suitabilityScore: 0,
            reasons: [speciesCompatibility.reason],
            ageAppropriate: false,
            healthConsiderations: ["این غذا برای نوع حیوان خانگی شما طراحی نشده است"]
          },
          recommendations: {
            feedingAdvice: "از این غذا استفاده نکنید",
            alternatives: ["غذای مخصوص نوع حیوان خانگی خود را انتخاب کنید"],
            warnings: ["استفاده از این غذا می‌تواند برای حیوان خانگی شما مضر باشد"]
          },
          confidence: 1.0
        };
      }
      
      const systemPrompt = `You are Dr. PetFood AI, an expert veterinary nutritionist. Provide a comprehensive pet food analysis in Persian.
      
      Analysis Type: ${analysisType}
      Pet Information: ${JSON.stringify(petInfo)}
      Product Data: ${JSON.stringify(productData)}
      Web Research: ${JSON.stringify(webData)}
      
      CRITICAL NUTRITIONAL DATA REQUIREMENTS:
      1. ONLY use REAL nutritional values from guaranteedAnalysis or nutritionalInfo in the provided data
      2. If webData.guaranteedAnalysis exists, use those exact percentages - DO NOT modify or estimate
      3. If productData.nutritionalInfo exists, use those exact values
      4. For missing nutrients, return "نامشخص" (unknown) - NEVER estimate or hallucinate values
      5. Calculate carbohydrates ONLY if you have real protein, fat, fiber, and moisture values: 100 - protein - fat - fiber - moisture - ash (assume 7% ash if not provided)
      6. NEVER return placeholder values like "X%", "Y%", "Z%", "W%", "11.5%", "14%" unless they are actual values from the data
      7. Extract the actual product name and brand from the provided data
      8. Use ingredients from webData if available, prioritize webData ingredients over productData ingredients
      9. Consider the search language used (English vs Persian) in your analysis
      10. If webData.searchLanguage is 'persian', mention that this is an Iranian/Persian product
      
      PET COMPATIBILITY REQUIREMENTS:
      - Show simple YES/NO compatibility for the user's specific pet
      - Do NOT show detailed species breakdown (cats/dogs with caution)
      - Base compatibility on: species match, age appropriateness, health considerations
      - If food matches user's pet species and age, show "مناسب برای حیوان خانگی شما" (suitable for your pet)
      - If food doesn't match, show "نامناسب برای حیوان خانگی شما" (not suitable for your pet)
      
      INGREDIENT ANALYSIS REQUIREMENTS:
      - Analyze the COMPLETE ingredient list if available
      - Identify the first 5 ingredients (highest weight) and assess their quality
      - Look for meat sources, grain types, preservatives, and artificial additives
      - Assess ingredient quality: whole meats > meat meals > by-products
      - Flag concerning ingredients: artificial colors, excessive fillers, low-quality proteins
      - Provide specific ingredient benefits and concerns in Persian
      
      NUTRITIONAL ASSESSMENT GUIDELINES:
      - Protein: Dogs need 18-25%, Cats need 26-35%
      - Fat: Dogs need 8-15%, Cats need 9-15%
      - Fiber: Should be 2-5% for most pets
      - Moisture: Dry food 6-12%, Wet food 75-85%
      - Carbohydrates: Should be calculated and assessed (lower is generally better for cats)
      
      CRITICAL: Return ONLY valid JSON with this exact structure:
      {
        "overallScore": number (0-100),
        "summary": "خلاصه کامل به فارسی",
        "speciesWarning": {
          "isSpeciesMismatch": false,
          "message": "",
          "reason": ""
        },
        "nutritionalAnalysis": {
          "protein": {"value": "actual_percentage%", "assessment": "ارزیابی", "score": number},
          "fat": {"value": "actual_percentage%", "assessment": "ارزیابی", "score": number},
          "fiber": {"value": "actual_percentage%", "assessment": "ارزیابی", "score": number},
          "moisture": {"value": "actual_percentage%", "assessment": "ارزیابی", "score": number},
          "carbohydrates": {"value": "calculated_percentage%", "assessment": "ارزیابی", "score": number},
          "calories": {"value": "kcal/kg or kcal/cup", "assessment": "ارزیابی", "score": number}
        },
        "ingredientAnalysis": {
          "mainIngredients": ["مواد اصلی"],
          "qualityScore": number,
          "concerns": ["نگرانی‌ها"],
          "benefits": ["مزایا"]
        },
        "petSuitability": {
          "isRecommended": boolean,
          "compatibilityMessage": "مناسب برای حیوان خانگی شما" or "نامناسب برای حیوان خانگی شما",
          "suitabilityScore": number,
          "reasons": ["دلایل"],
          "ageAppropriate": boolean,
          "healthConsiderations": ["ملاحظات سلامتی"]
        },
        "recommendations": {
          "feedingAdvice": "توصیه تغذیه",
          "alternatives": ["جایگزین‌ها"],
          "warnings": ["هشدارها"]
        },
        "confidence": number (0-1)
      }`;

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
            content: `تحلیل کامل این غذای حیوان خانگی را ارائه دهید. همه متن‌ها باید به فارسی باشند.`,
          },
        ],
        max_tokens: analysisType === 'detailed' ? 2500 : 1500,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      logger.aiAnalysis('Agent 5 (Final Assessment): Raw response received', {
        responseLength: content.length
      });
      
      const result = JSON.parse(content);
      logger.aiAnalysis('Agent 5 (Final Assessment): Completed successfully', {
          overallRating: result.overallRating,
          safetyLevel: result.safetyLevel
        });
      return result;
    } catch (error) {
      console.error('❌ Agent 5 (Final Assessment) error:', error);
      // Return fallback analysis
      return {
        overallScore: 50,
        summary: 'تحلیل کامل امکان‌پذیر نبود. لطفاً دوباره تلاش کنید.',
        speciesWarning: {
          isSpeciesMismatch: false,
          message: '',
          reason: ''
        },
        nutritionalAnalysis: {
          protein: { value: 'نامشخص', assessment: 'نیاز به بررسی بیشتر', score: 50 },
          fat: { value: 'نامشخص', assessment: 'نیاز به بررسی بیشتر', score: 50 },
          fiber: { value: 'نامشخص', assessment: 'نیاز به بررسی بیشتر', score: 50 },
          moisture: { value: 'نامشخص', assessment: 'نیاز به بررسی بیشتر', score: 50 },
          carbohydrates: { value: 'نامشخص', assessment: 'نیاز به بررسی بیشتر', score: 50 },
          calories: { value: 'نامشخص', assessment: 'نیاز به بررسی بیشتر', score: 50 }
        },
        ingredientAnalysis: {
          mainIngredients: ['اطلاعات ناکافی'],
          qualityScore: 50,
          concerns: ['عدم دسترسی به اطلاعات کامل'],
          benefits: []
        },
        petSuitability: {
          isRecommended: false,
          compatibilityMessage: 'نامناسب برای حیوان خانگی شما',
          suitabilityScore: 50,
          reasons: ['نیاز به اطلاعات بیشتر'],
          ageAppropriate: false,
          healthConsiderations: ['مشورت با دامپزشک توصیه می‌شود']
        },
        recommendations: {
          feedingAdvice: 'قبل از استفاده با دامپزشک مشورت کنید',
          alternatives: [],
          warnings: ['اطلاعات ناکافی برای ارزیابی کامل']
        },
        confidence: 0.3
      };
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

    // BACKEND: Multi-agent analysis pipeline with caching
    logger.aiAnalysis('Starting Multi-Agent Analysis Pipeline with Smart Caching');
    
    let ocrResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let productData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    let webData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    let cachedProduct: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let productHash = '';
    let isFromCache = false;

    // Step 1: Agent 1 - OCR Processing (if image provided)
    if (inputMethod === 'camera' && inputData.imageBase64) {
      logger.aiAnalysis('Processing image with Agent 1 (OCR)');
      ocrResult = await FoodAnalysisAgents.ocrAgent(inputData.imageBase64);
      
      // Create hash for cache lookup
      if (ocrResult && ocrResult.extractedText) {
        productHash = createProductHash(ocrResult.extractedText);
        logger.aiAnalysis('Checking cache for product', {
        productHash: productHash.substring(0, 8) + '...'
      });
        
        // Check if product exists in cache
        cachedProduct = await checkProductCache(productHash);
        
        if (cachedProduct) {
          const validation = cachedProduct._cacheValidation;
          
          if (validation.isComplete) {
            logger.aiAnalysis('Product found in cache with complete data! Skipping OCR and Web Search', {
              brand: cachedProduct.brand,
              productName: cachedProduct.productName
            });
            isFromCache = true;
            
            // Use cached data
            productData = {
              brand: cachedProduct.brand,
              productName: cachedProduct.productName,
              flavor: cachedProduct.flavor,
              ingredients: cachedProduct.ingredients,
              nutritionalInfo: cachedProduct.nutritionalInfo,
              targetSpecies: cachedProduct.targetSpecies,
              lifestage: cachedProduct.lifestage,
              detectedSpecies: cachedProduct.detectedSpecies,
            };
          } else {
            logger.aiAnalysis('Product found in cache but data is incomplete - will perform web search', {
              brand: cachedProduct.brand,
              productName: cachedProduct.productName,
              missingFields: validation.missingFields
            });
            // Don't set isFromCache to true - we need to do web search
            // But we can still use the basic cached data as starting point
            productData = {
              brand: cachedProduct.brand,
              productName: cachedProduct.productName,
              flavor: cachedProduct.flavor,
              ingredients: cachedProduct.ingredients || [],
              nutritionalInfo: cachedProduct.nutritionalInfo || {},
              targetSpecies: cachedProduct.targetSpecies,
              lifestage: cachedProduct.lifestage,
              detectedSpecies: cachedProduct.detectedSpecies,
            };
          }
        }
      }
    } else if (inputMethod === 'camera' && inputData.imageUrl) {
      // Handle legacy imageUrl format
      logger.aiAnalysis('Processing image URL with Agent 1 (OCR)');
      // Convert URL to base64 if needed - for now, skip OCR
      ocrResult = {
        extractedText: '',
        detectedSpecies: 'unknown',
        productInfo: {},
      };
    } else if (inputMethod === 'text' && inputData.text) {
      logger.aiAnalysis('Processing text input');
      ocrResult = {
        extractedText: inputData.text,
        detectedSpecies: 'unknown',
        productInfo: {
          brand: inputData.brand,
          productName: inputData.productName,
        },
      };
      
      // Check cache for text input too
      productHash = createProductHash(inputData.text);
      cachedProduct = await checkProductCache(productHash);
      
      if (cachedProduct) {
        logger.aiAnalysis('Text input found in cache!');
        isFromCache = true;
        productData = {
          brand: cachedProduct.brand,
          productName: cachedProduct.productName,
          ingredients: cachedProduct.ingredients,
          nutritionalInfo: cachedProduct.nutritionalInfo,
          targetSpecies: cachedProduct.targetSpecies,
          lifestage: cachedProduct.lifestage,
          detectedSpecies: cachedProduct.detectedSpecies,
        };
      }
    } else if (inputMethod === 'barcode' && inputData.barcode) {
      logger.aiAnalysis('Processing barcode input');
      ocrResult = {
        extractedText: `Barcode: ${inputData.barcode}, Brand: ${inputData.brand || ''}, Product: ${inputData.productName || ''}`,
        detectedSpecies: 'unknown',
        productInfo: {
          brand: inputData.brand,
          productName: inputData.productName,
        },
      };
    }

    // Step 2: Agent 2 - Product Parsing with Species Compatibility
    if (!isFromCache && ocrResult && ocrResult.extractedText) {
      logger.aiAnalysis('Processing with Agent 2 (Product Parsing)');
      const userPetSpecies = petInfo?.species || 'unknown';
      productData = await FoodAnalysisAgents.productParsingAgent(
        ocrResult.extractedText,
        ocrResult.detectedSpecies,
        userPetSpecies,
        ocrResult.foodType || 'unknown'
      );
      
      // Merge OCR product info with parsed data
      productData = {
        ...productData,
        ...ocrResult.productInfo,
        detectedSpecies: ocrResult.detectedSpecies,
      };
      
      // Save new product to cache for future use
      if (productHash && ocrResult) {
        await saveProductToCache(productHash, ocrResult, productData);
      }
    } else if (isFromCache) {
      logger.aiAnalysis('Running species compatibility check for cached product');
      const userPetSpecies = petInfo?.species || 'unknown';
      
      // Only run species compatibility for cached products
      const compatibilityResult = await FoodAnalysisAgents.productParsingAgent(
        cachedProduct.extractedText,
        cachedProduct.detectedSpecies,
        userPetSpecies,
        cachedProduct.foodType || 'unknown'
      );
      
      // Merge compatibility results with cached data
      productData = {
        ...productData,
        speciesCompatibility: compatibilityResult.speciesCompatibility,
      };
    }

    // Step 3: Agent 3 - Web Search (for detailed analysis and if we have product data, or if cached data is incomplete)
    const shouldPerformWebSearch = (
      type === 'detailed' && 
      (productData?.brand || productData?.productName) && 
      (!isFromCache || (cachedProduct && !cachedProduct._cacheValidation?.isComplete))
    );
    
    if (shouldPerformWebSearch) {
      const searchReason = !isFromCache ? 'detailed analysis' : 'incomplete cached data';
      logger.aiAnalysis(`Processing with Agent 3 (Web Search) for ${searchReason}`, {
        brand: productData.brand,
        productName: productData.productName,
        missingFields: cachedProduct?._cacheValidation?.missingFields || []
      });
      const searchProduct = productData.productName || 'Pet Food';
      const searchBrand = productData.brand || 'Unknown Brand';
      const detectedSpecies = productData.detectedSpecies || ocrResult?.detectedSpecies || 'unknown';
      webData = await FoodAnalysisAgents.webSearchAgent(searchProduct, searchBrand, detectedSpecies);
      
      // If we had incomplete cached data, merge the web search results
      if (cachedProduct && !cachedProduct._cacheValidation?.isComplete) {
        // Merge ingredients if web search found better data
        if (webData.ingredients && webData.ingredients.length > 0) {
          productData.ingredients = webData.ingredients;
        }
        
        // Merge nutritional info if web search found better data
        if (webData.guaranteedAnalysis && Object.keys(webData.guaranteedAnalysis).length > 0) {
          productData.nutritionalInfo = {
            ...productData.nutritionalInfo,
            ...webData.guaranteedAnalysis
          };
        }
      }
    } else if (isFromCache) {
      logger.aiAnalysis('Skipping web search for cached product with complete data');
      webData = {
        ingredients: [],
        guaranteedAnalysis: {},
        reviews: [],
        recalls: [],
        additionalInfo: 'Data retrieved from cache - no web search performed',
        searchLanguage: 'english',
        searchSuccess: false,
      };
    }

    // Step 4: Agent 4 - Web Data Parsing (Persian Summary)
    let webSummary = '';
    if (webData && Object.keys(webData).length > 0) {
      logger.aiAnalysis('Processing with Agent 4 (Web Data Parsing)');
      // For now, we'll include this in the final assessment
      webSummary = 'Web data processed and ready for final assessment.';
    }

    // Step 5: Agent 5 - Final Assessment
    logger.aiAnalysis('Processing with Agent 5 (Final Assessment)');
    // AI Analysis Debug - Always enabled as requested
    logger.aiAnalysis('=== AI ANALYSIS DEBUG ===', {
      cacheStatus: isFromCache ? 'FROM_CACHE' : 'NEW_ANALYSIS',
      productHash: productHash ? productHash.substring(0, 12) + '...' : 'N/A',
      hasOcrResult: !!ocrResult,
      hasProductData: !!productData,
      hasPetInfo: !!petInfo,
      hasWebData: !!webData,
      webSummary
    });
    if (cachedProduct) {
      logger.aiAnalysis('Cached Product Info', {
        id: cachedProduct.id,
        brand: cachedProduct.brand,
        productName: cachedProduct.productName,
        scanCount: cachedProduct.scanCount,
        firstScanned: cachedProduct.firstScannedAt,
        lastScanned: cachedProduct.lastScannedAt,
      });
    }
    
    const analysisResult = await FoodAnalysisAgents.finalAssessmentAgent(
      productData,
      petInfo || {},
      webData,
      type
    );
    
    logger.aiAnalysis('AI Analysis Result Generated', {
      overallScore: analysisResult.overallScore,
      confidence: analysisResult.confidence,
      hasRecommendations: !!analysisResult.recommendations
    });
    logger.aiAnalysis('=== END AI ANALYSIS DEBUG ===');

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
