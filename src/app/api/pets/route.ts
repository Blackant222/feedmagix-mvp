// BACKEND: Pet management endpoint
// Implements the /api/pets route for pet CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { petCreationSchema } from '@/lib/validation';
import { db } from '@/lib/db';
import { pets } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Pet Management Handler
 * Handles CRUD operations for user pets with authentication
 * Follows the API specification for pet management
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createPetSchema = z.object({
  name: z
    .string()
    .min(1, 'نام حیوان خانگی الزامی است')
    .max(100, 'نام نباید بیش از ۱۰۰ کاراکتر باشد'),
  species: z
    .string()
    .min(1, 'نوع حیوان الزامی است')
    .max(50, 'نوع حیوان نامعتبر'),
  breed: z.string().max(100, 'نژاد نباید بیش از ۱۰۰ کاراکتر باشد').optional(),
  age: z
    .number()
    .int()
    .min(0, 'سن نمی‌تواند منفی باشد')
    .max(600, 'سن نامعتبر')
    .optional(), // age in months
  weight: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'وزن باید عدد معتبر باشد')
    .optional(), // decimal as string
  activityLevel: z
    .enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: 'سطح فعالیت نامعتبر' }),
    })
    .optional(),
  healthConditions: z
    .array(z.string())
    .max(20, 'حداکثر ۲۰ بیماری مجاز است')
    .optional(),
  allergies: z.array(z.string()).max(20, 'حداکثر ۲۰ آلرژی مجاز است').optional(),
  currentFood: z
    .string()
    .max(500, 'نام غذای فعلی نباید بیش از ۵۰۰ کاراکتر باشد')
    .optional(),
  feedingSchedule: z
    .object({
      timesPerDay: z.number().int().min(1).max(10),
      amount: z.string().max(100),
      notes: z.string().max(500).optional(),
    })
    .optional(),
  avatarUrl: z.string().url('آدرس تصویر نامعتبر').optional(),
});



// BACKEND: Get all pets for authenticated user
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

    // BACKEND: Validate session
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

    // BACKEND: Get user's pets from database
    const userPets = await db
      .select()
      .from(pets)
      .where(eq(pets.userId, user.user.id))
      .orderBy(pets.createdAt);

    // Transform species to type for frontend compatibility
    const transformedPets = userPets.map(pet => ({
      ...pet,
      type: pet.species,
      species: undefined
    }));

    return NextResponse.json(transformedPets, { status: 200 });
  } catch (error) {
    console.error('Get pets error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Create new pet for authenticated user
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

    // BACKEND: Validate session
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
    const validationResult = petCreationSchema.safeParse(body);
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

    const petData = validationResult.data;

    // BACKEND: Check pet limit (max 10 pets per user)
    const existingPets = await db
      .select({ count: pets.id })
      .from(pets)
      .where(eq(pets.userId, user.user.id));

    if (existingPets.length >= 10) {
      return NextResponse.json(
        {
          error: 'pet_limit_exceeded',
          message: 'حداکثر ۱۰ حیوان خانگی مجاز است',
        },
        { status: 400 }
      );
    }

    // BACKEND: Create new pet with proper type conversion
    const insertData: typeof pets.$inferInsert = {
      name: petData.name,
      species: petData.type, // Use type field from validation schema
      userId: user.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optional fields if they exist
    if (petData.breed) insertData.breed = petData.breed;
    if (petData.age !== undefined) insertData.age = petData.age;
    if (petData.weight) insertData.weight = petData.weight.toString();
    if (petData.activityLevel) insertData.activityLevel = petData.activityLevel;
    if (petData.healthConditions) insertData.healthConditions = petData.healthConditions;
    if (petData.allergies) insertData.allergies = petData.allergies;
    if (petData.dietaryRestrictions) insertData.dietaryRestrictions = petData.dietaryRestrictions;
    if (petData.currentFood) insertData.currentFood = petData.currentFood;
    if (petData.feedingSchedule) insertData.feedingSchedule = petData.feedingSchedule;
    if (petData.avatarUrl) insertData.avatarUrl = petData.avatarUrl;

    const [newPet] = await db
      .insert(pets)
      .values(insertData)
      .returning();

    // Transform species to type for frontend compatibility
    const transformedPet = {
      ...newPet,
      type: newPet.species,
      species: undefined
    };

    return NextResponse.json(
      {
        success: true,
        message: 'حیوان خانگی با موفقیت اضافه شد',
        pet: transformedPet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create pet error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}
