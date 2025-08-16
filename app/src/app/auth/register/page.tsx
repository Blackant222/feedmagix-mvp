'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PinAuthForm } from '@/components/pin-auth-form';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegistrationSuccess = () => {
    // Redirect to onboarding after successful registration
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-primary persian-title">
            خوش آمدید به فیدمجیکس
          </h1>
          <p className="text-text-secondary persian-body">
            برای شروع، حساب کاربری خود را ایجاد کنید
          </p>
        </div>
        
        <PinAuthForm onSuccess={handleRegistrationSuccess} />
        
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <span className="text-text-secondary persian-body">قبلاً حساب دارید؟</span>
            <Link 
              href="/auth/login" 
              className="text-primary-600 hover:text-primary-700 font-medium persian-body inline-flex items-center"
            >
              ورود
              <ArrowRight className="w-4 h-4 mr-1" />
            </Link>
          </div>
          
          <div className="pt-4">
            <Link 
              href="/" 
              className="text-text-secondary hover:text-text-primary persian-body inline-flex items-center"
            >
              بازگشت به صفحه اصلی
              <ArrowRight className="w-4 h-4 mr-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
