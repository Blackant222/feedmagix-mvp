'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  // CHANGE: Removed unused CardDescription import to fix ESLint warning
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
// # FIX: Replaced mock data with real API client
import { apiClient } from '@/lib/api-client';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  notifications: {
    feedingReminders: boolean;
    scanResults: boolean;
    healthAlerts: boolean;
    weeklyReports: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  preferences: {
    language: 'fa' | 'en';
    theme: 'light' | 'dark' | 'auto';
    defaultScanType: 'barcode' | 'image' | 'auto';
    autoSave: boolean;
    shareData: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
    analytics: boolean;
    crashReports: boolean;
  };
}

// # FIX: Removed initialSettings - will load from API instead

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'notifications' | 'preferences' | 'privacy' | 'about'
  >('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // # FIX: Load settings from API on component mount
   useEffect(() => {
     // Default settings fallback
     const defaultSettings: UserSettings = {
       profile: {
         name: 'کاربر',
         email: '',
         phone: '',
       },
       notifications: {
         feedingReminders: true,
         scanResults: true,
         healthAlerts: true,
         weeklyReports: false,
         emailNotifications: true,
         pushNotifications: true,
       },
       preferences: {
         language: 'fa',
         theme: 'auto',
         defaultScanType: 'auto',
         autoSave: true,
         shareData: false,
       },
       privacy: {
         profileVisibility: 'private',
         dataSharing: false,
         analytics: true,
         crashReports: true,
       },
     };

     const loadSettings = async () => {
       try {
         const response = await apiClient.getUserProfile();
         if (response.error) {
           throw new Error(response.error.message);
         }
         // Transform user profile to settings format
         const userProfile = response.data;
         const userSettings: UserSettings = {
           profile: {
             name: userProfile?.displayName || defaultSettings.profile.name,
             email: userProfile?.email || defaultSettings.profile.email,
             phone: userProfile?.phone || defaultSettings.profile.phone,
           },
           notifications: defaultSettings.notifications,
           preferences: defaultSettings.preferences,
           privacy: defaultSettings.privacy,
         };
         setSettings(userSettings);
         setError(null);
      } catch (error) {
        console.error('Error loading settings:', error);
        setError(error instanceof Error ? error.message : 'خطا در بارگذاری تنظیمات');
        setSettings(defaultSettings);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = <T extends keyof UserSettings>(
    section: T,
    key: keyof UserSettings[T],
    value: UserSettings[T][keyof UserSettings[T]]
  ) => {
    if (!settings) return;
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsLoading(true);
    setError(null);
    try {
      // # FIX: Use real API call instead of mock
       const response = await apiClient.updateUserProfile({
         displayName: settings.profile.name,
         email: settings.profile.email,
         phone: settings.profile.phone,
       });
       if (response.error) {
         throw new Error(response.error.message);
       }
      setShowSuccess(true);
      // Auto-hide success message after 3 seconds
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟')) {
      // Handle logout
      // Logging out user
    }
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'آیا مطمئن هستید که می‌خواهید حساب کاربری خود را حذف کنید؟ این عمل غیرقابل بازگشت است.'
      )
    ) {
      // Handle account deletion
      // Deleting user account
    }
  };

  const tabs = [
    { id: 'profile', label: 'پروفایل', icon: '👤' },
    { id: 'notifications', label: 'اعلان‌ها', icon: '🔔' },
    { id: 'preferences', label: 'تنظیمات', icon: '⚙️' },
    { id: 'privacy', label: 'حریم خصوصی', icon: '🔒' },
    { id: 'about', label: 'درباره', icon: 'ℹ️' },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          اطلاعات شخصی
        </h2>
        <p className="text-text-secondary persian-body">
          اطلاعات حساب کاربری خود را مدیریت کنید
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-xl">
            {settings?.profile?.name?.charAt(0) || 'ک'}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-text-primary persian-body">
            {settings?.profile?.name || 'کاربر'}
          </h3>
          <p className="text-sm text-text-secondary persian-body">
            {settings?.profile?.email || 'ایمیل تنظیم نشده'}
          </p>
        </div>
        <Button variant="outline" size="sm">
          تغییر تصویر
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          label="نام و نام خانوادگی"
          value={settings?.profile?.name || ''}
          onChange={(e) => updateSetting('profile', 'name', e.target.value)}
        />
        <Input
          label="ایمیل"
          type="email"
          value={settings?.profile?.email || ''}
          onChange={(e) => updateSetting('profile', 'email', e.target.value)}
        />
        <Input
          label="شماره تلفن"
          type="tel"
          value={settings?.profile?.phone || ''}
          onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
        />
      </div>

      <div className="pt-4 border-t border-border-primary">
        <h3 className="font-medium text-text-primary persian-body mb-4">
          امنیت حساب
        </h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
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
                d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2m0 0V3a2 2 0 00-2-2H9a2 2 0 00-2 2v0a2 2 0 00-2 2v2m2-2a2 2 0 012-2h4a2 2 0 012 2v0"
              />
            </svg>
            تغییر رمز عبور
          </Button>
          <Button variant="outline" className="w-full justify-start">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            مدیریت کلیدهای امنیتی
          </Button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          تنظیمات اعلان‌ها
        </h2>
        <p className="text-text-secondary persian-body">
          نوع اعلان‌هایی که می‌خواهید دریافت کنید را انتخاب کنید
        </p>
      </div>

      <div className="space-y-4">
        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-lg persian-body">
              اعلان‌های اپلیکیشن
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: 'feedingReminders',
                label: 'یادآوری وعده‌های غذایی',
                desc: 'یادآوری زمان غذا دادن به حیوانات',
              },
              {
                key: 'scanResults',
                label: 'نتایج اسکن',
                desc: 'اعلان پس از تکمیل تحلیل غذا',
              },
              {
                key: 'healthAlerts',
                label: 'هشدارهای سلامتی',
                desc: 'اعلان در صورت تشخیص مشکل سلامتی',
              },
              {
                key: 'weeklyReports',
                label: 'گزارش‌های هفتگی',
                desc: 'خلاصه فعالیت‌های هفته',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-text-primary persian-body">
                    {item.label}
                  </p>
                  <p className="text-sm text-text-secondary persian-body">
                    {item.desc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={
                      settings?.notifications?.[item.key as keyof typeof settings.notifications] || false
                    }
                    onChange={(e) =>
                       updateSetting(
                         'notifications',
                         item.key as keyof UserSettings['notifications'],
                         e.target.checked
                       )
                     }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-lg persian-body">
              روش‌های ارسال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: 'pushNotifications',
                label: 'اعلان‌های فوری',
                desc: 'اعلان‌های داخل اپلیکیشن',
              },
              {
                key: 'emailNotifications',
                label: 'اعلان‌های ایمیل',
                desc: 'ارسال اعلان‌ها به ایمیل',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-text-primary persian-body">
                    {item.label}
                  </p>
                  <p className="text-sm text-text-secondary persian-body">
                    {item.desc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={
                      settings?.notifications?.[item.key as keyof typeof settings.notifications] || false
                    }
                    onChange={(e) =>
                       updateSetting(
                         'notifications',
                         item.key as keyof UserSettings['notifications'],
                         e.target.checked
                       )
                     }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          تنظیمات عمومی
        </h2>
        <p className="text-text-secondary persian-body">
          تنظیمات عمومی اپلیکیشن را شخصی‌سازی کنید
        </p>
      </div>

      <div className="space-y-4">
        <Card variant="outlined">
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary persian-body mb-2">
                زبان اپلیکیشن
              </label>
              <select
                value={settings?.preferences?.language || 'fa'}
                onChange={(e) =>
                  updateSetting(
                    'preferences',
                    'language',
                    e.target.value as 'fa' | 'en'
                  )
                }
                className="w-full px-3 py-2 border border-border-primary rounded-lg text-sm persian-body"
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary persian-body mb-2">
                تم ظاهری
              </label>
              <select
                value={settings?.preferences?.theme || 'auto'}
                onChange={(e) =>
                  updateSetting(
                    'preferences',
                    'theme',
                    e.target.value as 'light' | 'dark' | 'auto'
                  )
                }
                className="w-full px-3 py-2 border border-border-primary rounded-lg text-sm persian-body"
              >
                <option value="light">روشن</option>
                <option value="dark">تیره</option>
                <option value="auto">خودکار (بر اساس سیستم)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary persian-body mb-2">
                نوع اسکن پیش‌فرض
              </label>
              <select
                value={settings?.preferences?.defaultScanType || 'auto'}
                onChange={(e) =>
                  updateSetting(
                    'preferences',
                    'defaultScanType',
                    e.target.value as 'barcode' | 'image' | 'auto'
                  )
                }
                className="w-full px-3 py-2 border border-border-primary rounded-lg text-sm persian-body"
              >
                <option value="auto">تشخیص خودکار</option>
                <option value="barcode">اسکن بارکد</option>
                <option value="image">اسکن تصویر</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent className="p-4 space-y-4">
            {[
              {
                key: 'autoSave',
                label: 'ذخیره خودکار',
                desc: 'ذخیره خودکار نتایج اسکن',
              },
              {
                key: 'shareData',
                label: 'اشتراک‌گذاری داده‌ها',
                desc: 'اشتراک‌گذاری داده‌ها برای بهبود سرویس',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-text-primary persian-body">
                    {item.label}
                  </p>
                  <p className="text-sm text-text-secondary persian-body">
                    {item.desc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={
                      (settings?.preferences?.[item.key as keyof typeof settings.preferences] as boolean) || false
                    }
                    onChange={(e) =>
                       updateSetting(
                         'preferences',
                         item.key as keyof UserSettings['preferences'],
                         e.target.checked
                       )
                     }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          حریم خصوصی و امنیت
        </h2>
        <p className="text-text-secondary persian-body">
          تنظیمات حریم خصوصی و امنیت خود را مدیریت کنید
        </p>
      </div>

      <div className="space-y-4">
        <Card variant="outlined">
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary persian-body mb-2">
                نمایش پروفایل
              </label>
              <select
                value={settings?.privacy?.profileVisibility || 'private'}
                onChange={(e) =>
                  updateSetting(
                    'privacy',
                    'profileVisibility',
                    e.target.value as 'public' | 'private'
                  )
                }
                className="w-full px-3 py-2 border border-border-primary rounded-lg text-sm persian-body"
              >
                <option value="private">خصوصی</option>
                <option value="public">عمومی</option>
              </select>
            </div>

            {[
              {
                key: 'dataSharing',
                label: 'اشتراک‌گذاری داده‌ها',
                desc: 'اجازه استفاده از داده‌ها برای تحقیق',
              },
              {
                key: 'analytics',
                label: 'تجزیه و تحلیل',
                desc: 'ارسال داده‌های ناشناس برای بهبود اپ',
              },
              {
                key: 'crashReports',
                label: 'گزارش خرابی',
                desc: 'ارسال گزارش خرابی‌ها',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-text-primary persian-body">
                    {item.label}
                  </p>
                  <p className="text-sm text-text-secondary persian-body">
                    {item.desc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={
                      (settings?.privacy?.[item.key as keyof typeof settings.privacy] as boolean) || false
                    }
                    onChange={(e) =>
                       updateSetting(
                         'privacy',
                         item.key as keyof UserSettings['privacy'],
                         e.target.checked
                       )
                     }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-lg persian-body text-error-600">
              منطقه خطر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-error-600 border-error-200 hover:bg-error-50"
              onClick={handleLogout}
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              خروج از حساب کاربری
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-error-600 border-error-200 hover:bg-error-50"
              onClick={handleDeleteAccount}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              حذف حساب کاربری
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary persian-heading mb-2">
          درباره FeedMagix
        </h2>
        <p className="text-text-secondary persian-body">
          اطلاعات اپلیکیشن و پشتیبانی
        </p>
      </div>

      <Card variant="outlined">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <h3 className="text-lg font-bold text-text-primary persian-heading mb-2">
            FeedMagix
          </h3>
          <p className="text-text-secondary persian-body mb-4">
            تحلیل هوشمند غذای حیوانات خانگی
          </p>
          <Badge variant="outline">نسخه 1.0.0</Badge>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          شرایط استفاده
        </Button>
        <Button variant="outline" className="w-full justify-start">
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          سیاست حریم خصوصی
        </Button>
        <Button variant="outline" className="w-full justify-start">
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
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z"
            />
          </svg>
          پشتیبانی و راهنما
        </Button>
        <Button variant="outline" className="w-full justify-start">
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
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          ارسال بازخورد
        </Button>
      </div>
    </div>
  );

  // # FIX: Show loading state while fetching settings
  if (isInitialLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-secondary persian-body">در حال بارگذاری تنظیمات...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!settings) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-error-600 persian-body mb-4">خطا در بارگذاری تنظیمات</p>
                <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-h1 font-bold text-text-primary persian-heading">
              تنظیمات
            </h1>
            <p className="text-text-secondary persian-body mt-2">
              تنظیمات حساب کاربری و اپلیکیشن خود را مدیریت کنید
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card variant="outlined">
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        // CHANGE: Replaced 'any' type with proper type assertion for tab.id
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors persian-body',
                          activeTab === tab.id
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'text-text-secondary hover:bg-background-secondary'
                        )}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <Card variant="elevated">
                <CardContent className="p-6">
                  {activeTab === 'profile' && renderProfileTab()}
                  {activeTab === 'notifications' && renderNotificationsTab()}
                  {activeTab === 'preferences' && renderPreferencesTab()}
                  {activeTab === 'privacy' && renderPrivacyTab()}
                  {activeTab === 'about' && renderAboutTab()}

                  {activeTab !== 'about' && (
                    <div className="flex justify-end pt-6 border-t border-border-primary">
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="min-w-[120px]"
                      >
                        {isLoading ? (
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
                            ذخیره تغییرات
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {showSuccess && (
                <div className="fixed bottom-4 right-4 bg-success-600 text-white px-4 py-2 rounded-lg shadow-lg persian-body">
                  تغییرات با موفقیت ذخیره شد
                </div>
              )}
              {error && (
                <div className="fixed bottom-4 right-4 bg-error-600 text-white px-4 py-2 rounded-lg shadow-lg persian-body">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
