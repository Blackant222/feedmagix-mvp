// BACKEND: Individual pet management endpoint
// Implements the /api/pets/[id] route for specific pet operations

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { pets } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Individual Pet Management Handler
 * Handles GET, PUT, DELETE operations for specific pets
 * Ensures user can only access their own pets
 */

const updatePetSchema = z.object({
  name: z
    .string()
    .min(1, 'نام حیوان خانگی الزامی است')
    .max(100, 'نام نباید بیش از ۱۰۰ کاراکتر باشد')
    .optional(),
  type: z
    .string()
    .min(1, 'نوع حیوان الزامی است')
    .max(50, 'نوع حیوان نامعتبر')
    .optional(),
  breed: z.string().max(100, 'نژاد نباید بیش از ۱۰۰ کاراکتر باشد').optional(),
  age: z
    .number()
    .int()
    .min(0, 'سن نمی‌تواند منفی باشد')
    .max(600, 'سن نامعتبر')
    .optional(),
  weight: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'وزن باید عدد معتبر باشد')
    .optional(),
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

// BACKEND: Helper function to authenticate and get user
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { error: 'unauthorized', message: 'توکن احراز هویت یافت نشد' };
  }

  const user = await validateSession(token);
  if (!user) {
    return { error: 'invalid_session', message: 'جلسه نامعتبر یا منقضی شده' };
  }

  return { user };
}

// BACKEND: Get specific pet by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await authenticateUser(request);
    if ('error' in auth) {
      return NextResponse.json(auth, { status: 401 });
    }

    const petId = id;

    // BACKEND: Get pet and verify ownership
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.userId, auth.user.userId)))
      .limit(1);

    if (!pet) {
      return NextResponse.json(
        {
          error: 'pet_not_found',
          message: 'حیوان خانگی یافت نشد',
        },
        { status: 404 }
      );
    }

    // Map database fields to frontend expected format
    const mappedPet = {
      id: pet.id,
      name: pet.name,
      type: pet.species, // Map species to type for frontend compatibility
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight ? parseFloat(pet.weight) : undefined,
      imageUrl: pet.avatarUrl,
      dietaryRestrictions: pet.dietaryRestrictions || [],
      healthConditions: pet.healthConditions || [],
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: mappedPet,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get pet error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Update specific pet by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await authenticateUser(request);
    if ('error' in auth) {
      return NextResponse.json(auth, { status: 401 });
    }

    const { user } = auth;
    const petId = id;

    const body = await request.json();

    // BACKEND: Validate request body
    const validationResult = updatePetSchema.safeParse(body);
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

    // Map frontend fields to database fields
    const dbUpdateData: any = { ...updateData };
    if (updateData.type) {
      dbUpdateData.species = updateData.type;
      delete dbUpdateData.type;
    }

    // BACKEND: Check if pet exists and user owns it
    const [existingPet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.userId, user.userId)))
      .limit(1);

    if (!existingPet) {
      return NextResponse.json(
        {
          error: 'pet_not_found',
          message: 'حیوان خانگی یافت نشد',
        },
        { status: 404 }
      );
    }

    // BACKEND: Update pet
    const [updatedPet] = await db
      .update(pets)
      .set({
        ...dbUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(pets.id, petId))
      .returning();

    // Map database fields to frontend expected format
    const mappedPet = {
      id: updatedPet.id,
      name: updatedPet.name,
      type: updatedPet.species, // Map species to type for frontend compatibility
      breed: updatedPet.breed,
      age: updatedPet.age,
      weight: updatedPet.weight ? parseFloat(updatedPet.weight) : undefined,
      imageUrl: updatedPet.avatarUrl,
      dietaryRestrictions: updatedPet.dietaryRestrictions || [],
      healthConditions: updatedPet.healthConditions || [],
      createdAt: updatedPet.createdAt.toISOString(),
      updatedAt: updatedPet.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: 'اطلاعات حیوان خانگی با موفقیت به‌روزرسانی شد',
        data: mappedPet,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update pet error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}

// BACKEND: Delete specific pet by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await authenticateUser(request);
    if ('error' in auth) {
      return NextResponse.json(auth, { status: 401 });
    }

    const { user } = auth;
    const petId = id;

    // BACKEND: Check if pet exists and user owns it
    const [existingPet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.userId, user.userId)))
      .limit(1);

    if (!existingPet) {
      return NextResponse.json(
        {
          error: 'pet_not_found',
          message: 'حیوان خانگی یافت نشد',
        },
        { status: 404 }
      );
    }

    // BACKEND: Soft delete by setting isActive to false
    await db
      .update(pets)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(pets.id, petId));

    return NextResponse.json(
      {
        success: true,
        message: 'حیوان خانگی با موفقیت حذف شد',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete pet error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'خطای داخلی سرور',
      },
      { status: 500 }
    );
  }
}
