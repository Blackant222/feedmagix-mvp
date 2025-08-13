'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PetFormData {
  name: string;
  type: 'سگ' | 'گربه' | '';
  breed: string;
  age: string;
  weight: string;
  gender: 'نر' | 'ماده' | '';
  birthDate: string;
  microchipId: string;
  vetName: string;
  vetPhone: string;
  dietaryRestrictions: string[];
  medicalConditions: string[];
  allergies: string[];
  notes: string;
}

const initialFormData: PetFormData = {
  name: '',
  type: '',
  breed: '',
  age: '',
  weight: '',
  gender: '',
  birthDate: '',
  microchipId: '',
  vetName: '',
  vetPhone: '',
  dietaryRestrictions: [],
  medicalConditions: [],
  allergies: [],
  notes: '',
};

const commonDogBreeds = [
  'گلدن رتریور',
  'لابرادور',
  'ژرمن شپرد',
  'بیگل',
  'بولداگ فرانسوی',
  'پودل',
  'روتوایلر',
  'یورکشایر تریر',
  'داکسهوند',
  'سیبرین هاسکی',
];

const commonCatBreeds = [
  'پرشین',
  'مین کون',
  'سیامی',
  'بریتیش شورت هیر',
  'راگدال',
  'بنگال',
  'ابیسینین',
  'اسکاتیش فولد',
  'اسفینکس',
  'نروژی جنگلی',
];

const commonDietaryRestrictions = [
  'بدون گلوتن',
  'کم چربی',
  'بدون مرغ',
  'بدون گوشت قرمز',
  'بدون غلات',
  'حساسیت به ماهی',
  'بدون لبنیات',
  'رژیم کاهش وزن',
  'رژیم افزایش وزن',
];

const commonMedicalConditions = [
  'دیابت',
  'آرتریت',
  'مشکلات قلبی',
  'مشکلات کلیوی',
  'آلرژی پوستی',
  'مشکلات گوارشی',
  'مشکلات تیروئید',
  'صرع',
  'آسم',
];

const commonAllergies = [
  'گرده گل',
  'غبار',
  'کنه',
  'مواد شیمیایی',
  'عطر و ادکلن',
  'دود سیگار',
  'برخی غذاها',
  'داروها',
];

export default function AddPetPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState<PetFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // CHANGE: Replaced 'any' type with proper union type for type safety
  const updateFormData = (
    field: keyof PetFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleArrayItem = (field: keyof PetFormData, item: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    updateFormData(field, newArray);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'نام حیوان الزامی است';
      if (!formData.type) newErrors.type = 'نوع حیوان الزامی است';
      if (!formData.breed.trim()) newErrors.breed = 'نژاد حیوان الزامی است';
    }

    if (step === 2) {
      if (!formData.age.trim()) newErrors.age = 'سن حیوان الزامی است';
      if (!formData.weight.trim()) newErrors.weight = 'وزن حیوان الزامی است';
      if (!formData.gender) newErrors.gender = 'جنسیت حیوان الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      // Map form data to API format
      const petData = {
        name: formData.name,
        type: formData.type === 'سگ' ? 'dog' : formData.type === 'گربه' ? 'cat' : 'other',
        breed: formData.breed || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dietaryRestrictions: formData.dietaryRestrictions.length > 0 ? formData.dietaryRestrictions : undefined,
        healthConditions: formData.medicalConditions.length > 0 ? formData.medicalConditions : undefined,
      };

      const response = await apiClient.createPet(petData);
      
      if (response.error) {
        if (response.error.code === 'unauthorized') {
          // Session expired, redirect to login
          router.push('/auth/login');
          return;
        }
        throw new Error(response.error.message || 'خطا در افزودن حیوان خانگی');
      }

      // Success - redirect to pets page
      router.push('/pets');
    } catch (error) {
      console.error('Error adding pet:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'خطا در افزودن حیوان خانگی' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              step <= currentStep
                ? 'bg-primary-600 text-white'
                : 'bg-background-tertiary text-text-tertiary'
            )}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-2',
                step < currentStep ? 'bg-primary-600' : 'bg-background-tertiary'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          اطلاعات پایه
        </h2>
        <p className="text-text-secondary persian-body">
          اطلاعات اصلی حیوان خانگی خود را وارد کنید
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="نام حیوان خانگی"
          placeholder="مثال: میلو"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          errorText={errors.name}
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-primary persian-body mb-2">
            نوع حیوان <span className="text-error-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={formData.type === 'سگ' ? 'primary' : 'outline'}
              onClick={() => updateFormData('type', 'سگ')}
              className="h-12"
            >
              <svg
                className="w-5 h-5 ml-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              سگ
            </Button>
            <Button
              type="button"
              variant={formData.type === 'گربه' ? 'primary' : 'outline'}
              onClick={() => updateFormData('type', 'گربه')}
              className="h-12"
            >
              <svg
                className="w-5 h-5 ml-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              گربه
            </Button>
          </div>
          {errors.type && (
            <p className="text-error-600 text-sm mt-1 persian-body">
              {errors.type}
            </p>
          )}
        </div>

        <div>
          <Input
            label="نژاد"
            placeholder="نژاد حیوان خانگی خود را وارد کنید"
            value={formData.breed}
            onChange={(e) => updateFormData('breed', e.target.value)}
            errorText={errors.breed}
            required
          />
          {formData.type && (
            <div className="mt-2">
              <p className="text-sm text-text-tertiary persian-body mb-2">
                نژادهای رایج:
              </p>
              <div className="flex flex-wrap gap-2">
                {(formData.type === 'سگ'
                  ? commonDogBreeds
                  : commonCatBreeds
                ).map((breed) => (
                  <Badge
                    key={breed}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary-50"
                    onClick={() => updateFormData('breed', breed)}
                  >
                    {breed}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          مشخصات فیزیکی
        </h2>
        <p className="text-text-secondary persian-body">
          اطلاعات فیزیکی و سنی حیوان خانگی خود را وارد کنید
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="سن (سال)"
            placeholder="3"
            value={formData.age}
            onChange={(e) => updateFormData('age', e.target.value)}
            errorText={errors.age}
            required
            type="number"
          />
          <Input
            label="وزن (کیلوگرم)"
            placeholder="25"
            value={formData.weight}
            onChange={(e) => updateFormData('weight', e.target.value)}
            errorText={errors.weight}
            required
            type="number"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary persian-body mb-2">
            جنسیت <span className="text-error-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={formData.gender === 'نر' ? 'primary' : 'outline'}
              onClick={() => updateFormData('gender', 'نر')}
              className="h-12"
            >
              نر
            </Button>
            <Button
              type="button"
              variant={formData.gender === 'ماده' ? 'primary' : 'outline'}
              onClick={() => updateFormData('gender', 'ماده')}
              className="h-12"
            >
              ماده
            </Button>
          </div>
          {errors.gender && (
            <p className="text-error-600 text-sm mt-1 persian-body">
              {errors.gender}
            </p>
          )}
        </div>

        <Input
          label="تاریخ تولد (اختیاری)"
          placeholder="1400/01/01"
          value={formData.birthDate}
          onChange={(e) => updateFormData('birthDate', e.target.value)}
          type="date"
        />

        <Input
          label="شماره میکروچیپ (اختیاری)"
          placeholder="123456789012345"
          value={formData.microchipId}
          onChange={(e) => updateFormData('microchipId', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          اطلاعات پزشکی
        </h2>
        <p className="text-text-secondary persian-body">
          اطلاعات پزشکی و دامپزشک حیوان خانگی خود را وارد کنید
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="نام دامپزشک (اختیاری)"
            placeholder="دکتر احمدی"
            value={formData.vetName}
            onChange={(e) => updateFormData('vetName', e.target.value)}
          />
          <Input
            label="تلفن دامپزشک (اختیاری)"
            placeholder="09123456789"
            value={formData.vetPhone}
            onChange={(e) => updateFormData('vetPhone', e.target.value)}
            type="tel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary persian-body mb-3">
            محدودیت‌های غذایی
          </label>
          <div className="flex flex-wrap gap-2">
            {commonDietaryRestrictions.map((restriction) => (
              <Badge
                key={restriction}
                variant={
                  formData.dietaryRestrictions.includes(restriction)
                    ? 'default'
                    : 'outline'
                }
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:scale-105',
                  formData.dietaryRestrictions.includes(restriction)
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                    : 'bg-white text-text-primary border-border-medium hover:bg-primary-50 hover:border-primary-300'
                )}
                onClick={() =>
                  toggleArrayItem('dietaryRestrictions', restriction)
                }
              >
                {restriction}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary persian-body mb-3">
            بیماری‌های مزمن
          </label>
          <div className="flex flex-wrap gap-2">
            {commonMedicalConditions.map((condition) => (
              <Badge
                key={condition}
                variant={
                  formData.medicalConditions.includes(condition)
                    ? 'warning'
                    : 'outline'
                }
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:scale-105',
                  formData.medicalConditions.includes(condition)
                    ? 'bg-warning-600 text-white border-warning-600 shadow-md'
                    : 'bg-white text-text-primary border-border-medium hover:bg-warning-50 hover:border-warning-300'
                )}
                onClick={() => toggleArrayItem('medicalConditions', condition)}
              >
                {condition}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary persian-body mb-3">
            آلرژی‌ها
          </label>
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map((allergy) => (
              <Badge
                key={allergy}
                variant={
                  formData.allergies.includes(allergy) ? 'error' : 'outline'
                }
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:scale-105',
                  formData.allergies.includes(allergy)
                    ? 'bg-error-600 text-white border-error-600 shadow-md'
                    : 'bg-white text-text-primary border-border-medium hover:bg-error-50 hover:border-error-300'
                )}
                onClick={() => toggleArrayItem('allergies', allergy)}
              >
                {allergy}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          بررسی نهایی
        </h2>
        <p className="text-text-secondary persian-body">
          اطلاعات وارد شده را بررسی کنید و در صورت صحت، حیوان خانگی خود را اضافه
          کنید
        </p>
      </div>

      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="persian-body">خلاصه اطلاعات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-tertiary persian-body">نام:</span>
              <span className="text-text-primary font-medium mr-2 persian-body">
                {formData.name}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary persian-body">نوع:</span>
              <span className="text-text-primary font-medium mr-2 persian-body">
                {formData.type}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary persian-body">نژاد:</span>
              <span className="text-text-primary font-medium mr-2 persian-body">
                {formData.breed}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary persian-body">سن:</span>
              <span className="text-text-primary font-medium mr-2 persian-numbers">
                {formData.age} سال
              </span>
            </div>
            <div>
              <span className="text-text-tertiary persian-body">وزن:</span>
              <span className="text-text-primary font-medium mr-2 persian-numbers">
                {formData.weight} کیلو
              </span>
            </div>
            <div>
              <span className="text-text-tertiary persian-body">جنسیت:</span>
              <span className="text-text-primary font-medium mr-2 persian-body">
                {formData.gender}
              </span>
            </div>
          </div>

          {formData.dietaryRestrictions.length > 0 && (
            <div>
              <p className="text-sm text-text-tertiary persian-body mb-2">
                محدودیت‌های غذایی:
              </p>
              <div className="flex flex-wrap gap-1">
                {formData.dietaryRestrictions.map((restriction, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {restriction}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {formData.medicalConditions.length > 0 && (
            <div>
              <p className="text-sm text-text-tertiary persian-body mb-2">
                بیماری‌های مزمن:
              </p>
              <div className="flex flex-wrap gap-1">
                {formData.medicalConditions.map((condition, index) => (
                  <Badge key={index} variant="warning" size="sm">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {formData.allergies.length > 0 && (
            <div>
              <p className="text-sm text-text-tertiary persian-body mb-2">
                آلرژی‌ها:
              </p>
              <div className="flex flex-wrap gap-1">
                {formData.allergies.map((allergy, index) => (
                  <Badge key={index} variant="error" size="sm">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-text-primary persian-body">
          یادداشت‌های اضافی (اختیاری)
        </label>
        <textarea
          className="w-full p-3 border border-border-primary rounded-lg resize-none h-24 text-right persian-body"
          placeholder="هر اطلاعات اضافی که فکر می‌کنید مهم است..."
          value={formData.notes}
          onChange={(e) => updateFormData('notes', e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-center persian-heading">
                افزودن حیوان خانگی جدید
              </CardTitle>
              <CardDescription className="text-center persian-body">
                اطلاعات حیوان خانگی خود را در چند مرحله وارد کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {renderStepIndicator()}

              <div className="min-h-[400px]">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </div>

              <div className="flex justify-between pt-6 border-t border-border-primary">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  قبلی
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={handleNext}>
                    بعدی
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4 ml-2"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        افزودن حیوان خانگی
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm persian-body">{errors.submit}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
