'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  illustration: React.ReactNode;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'به FeedMagix خوش آمدید! 🐾',
    description: 'تحلیلگر هوشمند غذای حیوانات خانگی',
    features: [
      'تحلیل هوشمند مواد غذایی',
      'توصیه‌های شخصی‌سازی شده',
      'پیگیری سلامت حیوان خانگی',
    ],
    icon: (
      <svg
        className="w-12 h-12 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    illustration: (
      <div className="w-48 h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl mx-auto flex items-center justify-center">
        <div className="text-6xl">🐕</div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'اسکن آسان برچسب غذا',
    description: 'فقط عکس بگیرید، بقیه با ما!',
    features: [
      'تشخیص خودکار متن',
      'تحلیل مواد تشکیل‌دهنده',
      'بررسی ارزش غذایی',
    ],
    icon: (
      <svg
        className="w-12 h-12 text-secondary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    illustration: (
      <div className="w-48 h-48 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-3xl mx-auto flex items-center justify-center relative">
        <div className="w-32 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center">
          <div className="text-xs text-gray-600 text-center">
            <div className="font-bold">غذای خشک سگ</div>
            <div className="text-xs mt-1">پروتئین: ۲۵٪</div>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
          </svg>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'نتایج دقیق و قابل فهم',
    description: 'تحلیل کامل با امتیاز سلامت',
    features: ['امتیاز سلامت از ۱۰۰', 'مواد مفید و مضر', 'توصیه‌های بهبود'],
    icon: (
      <svg
        className="w-12 h-12 text-success-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    illustration: (
      <div className="w-48 h-48 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl mx-auto flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 persian-numbers">
              ۸۵
            </div>
            <div className="text-sm text-gray-600 persian-body">
              امتیاز سلامت
            </div>
            <div className="flex gap-1 mt-2 justify-center">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-success-400 rounded-full"
                ></div>
              ))}
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: 'اولین حیوان خانگی خود را اضافه کنید',
    description: 'برای شروع، پروفایل حیوان خانگی خود را بسازید',
    features: ['اطلاعات کامل حیوان', 'توصیه‌های شخصی', 'پیگیری تغذیه'],
    icon: (
      <svg
        className="w-12 h-12 text-warning-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    ),
    illustration: (
      <div className="w-48 h-48 bg-gradient-to-br from-warning-100 to-warning-200 rounded-3xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🐱</div>
          <div className="bg-white rounded-lg px-4 py-2 shadow-lg">
            <div className="text-sm font-medium text-gray-800 persian-body">
              میلو
            </div>
            <div className="text-xs text-gray-600 persian-body">سگ • ۳ سال</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const nextSlide = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skipOnboarding = () => {
    window.location.href = '/dashboard';
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    // Simulate completion process
    // Process onboarding completion
    window.location.href = '/pets/add';
  };

  const slide = onboardingSlides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background-primary to-secondary-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <Button variant="ghost" onClick={skipOnboarding}>
          رد کردن
        </Button>
        <div className="flex gap-2">
          {onboardingSlides.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentSlide
                  ? 'bg-primary-500'
                  : 'bg-background-tertiary'
              )}
            />
          ))}
        </div>
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="glass" className="backdrop-blur-lg">
            <CardContent className="p-8 text-center space-y-8">
              {/* Illustration */}
              <div className="mb-6">{slide.illustration}</div>

              {/* Icon */}
              <div className="flex justify-center">{slide.icon}</div>

              {/* Title and Description */}
              <div className="space-y-3">
                <h1 className="text-h2 font-bold text-text-primary persian-heading">
                  {slide.title}
                </h1>
                <p className="text-text-secondary persian-body">
                  {slide.description}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {slide.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-right"
                  >
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-primary-600"
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
                    </div>
                    <span className="text-sm text-text-secondary persian-body">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="bg-background-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  style={{
                    width: `${((currentSlide + 1) / onboardingSlides.length) * 100}%`,
                  }}
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className={cn(
                    'transition-opacity',
                    currentSlide === 0
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-100'
                  )}
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

                <Badge variant="outline" size="sm" className="persian-numbers">
                  {currentSlide + 1} از {onboardingSlides.length}
                </Badge>

                <Button
                  onClick={nextSlide}
                  disabled={isCompleting}
                  loading={isCompleting}
                  size="lg"
                >
                  {currentSlide === onboardingSlides.length - 1
                    ? 'شروع کنید'
                    : 'بعدی'}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-xs text-text-tertiary persian-body">
          می‌توانید این آموزش را در تنظیمات مجدداً مشاهده کنید
        </p>
      </div>
    </div>
  );
}
