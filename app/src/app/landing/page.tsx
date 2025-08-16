'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleVisibility = () => setIsVisible(true);

    window.addEventListener('scroll', handleScroll);
    setTimeout(handleVisibility, 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <MainLayout showNavigation={false}>
      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 w-32 h-32 bg-primary-500/10 rounded-full blur-xl animate-pulse"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          ></div>
          <div
            className="absolute top-40 right-20 w-24 h-24 bg-secondary-500/10 rounded-full blur-lg animate-bounce"
            style={{
              transform: `translateY(${scrollY * -0.05}px) rotate(${scrollY * 0.1}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
          ></div>
          <div
            className="absolute bottom-20 left-1/4 w-40 h-40 bg-success-500/10 rounded-full blur-2xl animate-pulse"
            style={{
              transform: `translateY(${scrollY * 0.08}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          ></div>
          <div
            className="absolute bottom-40 right-1/3 w-28 h-28 bg-primary-500/10 rounded-full blur-xl animate-bounce"
            style={{
              transform: `translateY(${scrollY * -0.12}px) rotate(${scrollY * -0.05}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
          ></div>

          {/* Additional floating elements */}
          <div
            className="absolute top-1/3 left-1/2 w-16 h-16 bg-warning-500/10 rounded-full blur-md animate-pulse"
            style={{
              transform: `translateY(${scrollY * 0.15}px) translateX(${Math.sin(scrollY * 0.01) * 20}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          ></div>
          <div
            className="absolute top-2/3 right-1/4 w-20 h-20 bg-info-500/10 rounded-full blur-lg animate-bounce"
            style={{
              transform: `translateY(${scrollY * -0.08}px) translateX(${Math.cos(scrollY * 0.01) * 15}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          ></div>
        </div>

        <div className="max-w-6xl mx-auto p-8 relative z-10">
          {/* Hero Section */}
          <div
            className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                <Image
                  src="/logo.png"
                  alt="FeedMagix Logo"
                  width={120}
                  height={120}
                  className="relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
            </div>

            <div className="mb-6">
              <Badge
                variant="secondary"
                className="mb-4 animate-pulse hover:animate-none transition-all duration-300 hover:scale-105"
              >
                ✨ بیایید و امتحان کنید!
              </Badge>
            </div>
            <h1 className="text-display-lg font-bold text-text-primary mb-6 persian-heading bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              به فیدمجیکس خوش آمدید
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto persian-body leading-relaxed">
              تحلیل هوشمند غذای حیوانات خانگی با قدرت هوش مصنوعی برای سلامت بهتر
              دوستان چهارپای شما
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <span className="relative z-10">شروع کنید</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto hover:scale-105 transition-all duration-300 hover:shadow-lg backdrop-blur-sm bg-white/10"
                >
                  بیشتر بدانید
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div
            id="features"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            <Card
              variant="glass"
              interactive
              className={`group hover:scale-105 transition-all duration-500 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <CardTitle className="group-hover:text-primary-600 transition-colors duration-300">
                  تحلیل هوشمند
                </CardTitle>
                <CardDescription>
                  تکنولوژی پیشرفته هوش مصنوعی برای تحلیل مواد تشکیل‌دهنده غذای
                  حیوانات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary persian-body">
                  سیستم هوش مصنوعی ما تحلیل تغذیه‌ای دقیق و توصیه‌های تخصصی برای
                  سلامت حیوان خانگی شما ارائه می‌دهد.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="glass"
              interactive
              className={`group hover:scale-105 transition-all duration-500 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '400ms' }}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <CardTitle className="group-hover:text-success-600 transition-colors duration-300">
                  بینش‌های سلامت
                </CardTitle>
                <CardDescription>
                  دریافت توصیه‌های شخصی‌سازی شده برای حیوان خانگی شما
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary persian-body">
                  مشاوره تخصصی بر اساس نژاد، سن و شرایط سلامتی حیوان خانگی شما
                  دریافت کنید.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="glass"
              interactive
              className={`group hover:scale-105 transition-all duration-500 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '600ms' }}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <CardTitle className="group-hover:text-secondary-600 transition-colors duration-300">
                  آسان در استفاده
                </CardTitle>
                <CardDescription>فرآیند ساده اسکن عکس</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary persian-body">
                  فقط از لیست مواد تشکیل‌دهنده عکس بگیرید و نتایج تحلیل فوری
                  دریافت کنید.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div
              className={`text-center group cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '800ms' }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                ۱۰۰+
              </div>
              <div className="text-text-secondary persian-body group-hover:text-primary-500 transition-colors duration-300 text-sm leading-relaxed">
                برند تحلیل شده
                <br />
                <span className="text-xs opacity-75">
                  (شامل تست‌های داخلی و نمونه‌های فرضی)
                </span>
              </div>
            </div>
            <div
              className={`text-center group cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '900ms' }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                ۳۰۰+
              </div>
              <div className="text-text-secondary persian-body group-hover:text-primary-500 transition-colors duration-300 text-sm leading-relaxed">
                کاربر منتظر
                <br />
                <span className="text-xs opacity-75">
                  (لیست علاقه‌مندان و ثبت‌نام اولیه)
                </span>
              </div>
            </div>
            <div
              className={`text-center group cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '1000ms' }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                ۹۰٪
              </div>
              <div className="text-text-secondary persian-body group-hover:text-primary-500 transition-colors duration-300 text-sm leading-relaxed">
                دقت تحلیل
                <br />
                <span className="text-xs opacity-75">
                  (بر اساس داده‌های آزمایشی و مدل AI اولیه)
                </span>
              </div>
            </div>
            <div
              className={`text-center group cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '1100ms' }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                ۲۴/۷
              </div>
              <div className="text-text-secondary persian-body group-hover:text-primary-500 transition-colors duration-300 text-sm leading-relaxed">
                پشتیبانی
                <br />
                <span className="text-xs opacity-75">
                  (پاسخ‌گویی سریع در ساعات کاری و فوریت‌ها)
                </span>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <Card
            variant="gradient"
            className={`text-center ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: '1200ms' }}
          >
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-black mb-4 persian-heading">
                آماده شروع هستید؟
              </h2>
              <p className="text-black/80 mb-8 persian-body max-w-2xl mx-auto">
                همین حالا شروع کنید و از تحلیل هوشمند غذای حیوان خانگی‌تان
                بهره‌مند شوید
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="persian-body group hover:scale-105 transition-all duration-300 hover:shadow-xl text-black"
                  onClick={() =>
                    window.open('https://feedmagix.petmagix.com', '_blank')
                  }
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    شروع کنید
                  </span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="persian-body border-black text-black hover:bg-black hover:text-white group hover:scale-105 transition-all duration-300 hover:shadow-xl"
                  onClick={() =>
                    window.open('https://feed.petmagix.com', '_blank')
                  }
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    مشاهده اپلیکیشن
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="relative z-10 bg-background-primary/80 backdrop-blur-sm border-t border-border-primary mt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src="/logo.png"
                    alt="FeedMagix Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <h3 className="text-xl font-bold text-text-primary persian-heading">
                    فیدمجیکس
                  </h3>
                </div>
                <p className="text-text-secondary persian-body mb-4 max-w-md">
                  پلتفرم هوشمند تحلیل غذای حیوانات خانگی با استفاده از تکنولوژی
                  پیشرفته هوش مصنوعی
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open('https://feedmagix.petmagix.com', '_blank')
                    }
                    className="hover:scale-110 transition-transform duration-300"
                  >
                    اپلیکیشن اصلی
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open('https://feed.petmagix.com', '_blank')
                    }
                    className="hover:scale-110 transition-transform duration-300"
                  >
                    نسخه جایگزین
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-4 persian-heading">
                  خدمات
                </h4>
                <ul className="space-y-2 text-text-secondary persian-body">
                  <li>
                    <a
                      href="#features"
                      className="hover:text-primary-600 transition-colors duration-300"
                    >
                      تحلیل هوشمند
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="hover:text-primary-600 transition-colors duration-300"
                    >
                      بینش‌های سلامت
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="hover:text-primary-600 transition-colors duration-300"
                    >
                      اسکن آسان
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-4 persian-heading">
                  شرکت
                </h4>
                <ul className="space-y-2 text-text-secondary persian-body">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary-600 transition-colors duration-300"
                    >
                      درباره ما
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary-600 transition-colors duration-300"
                    >
                      تماس با ما
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary-600 transition-colors duration-300"
                    >
                      حریم خصوصی
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border-primary mt-8 pt-8 text-center">
              <p className="text-text-secondary persian-body">
                © ۲۰۲۵ فیدمجیکس. تمامی حقوق محفوظ است.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
}
