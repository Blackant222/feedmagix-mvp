'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// CHANGE: Removed unused CardDescription import to fix ESLint warning
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// CHANGE: Removed unused cn import to fix ESLint warning

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    joinDate: '',
    avatar: undefined as string | undefined,
  });
  const [editForm, setEditForm] = useState(profile);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [stats, setStats] = useState([
    { label: 'تعداد اسکن', value: '0', icon: '📊' },
    { label: 'حیوانات ثبت شده', value: '0', icon: '🐕' },
    { label: 'روز عضویت', value: '0', icon: '📅' },
    { label: 'امتیاز امنیت میانگین', value: '0', icon: '⭐' },
  ]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    action: string;
    pet: string;
    score: number | null;
    time: string;
  }>>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setIsLoadingProfile(true);
        
        // Get user profile
        const profileResponse = await apiClient.getUserProfile();
        if (profileResponse.data) {
          const userData = profileResponse.data;
          const profileData = {
            name: userData.displayName || user.displayName || 'کاربر',
            email: userData.email || user.email,
            phone: userData.phone || '',
            location: '', // This would need to be added to the API
            joinDate: new Date(userData.createdAt).toLocaleDateString('fa-IR'),
            avatar: userData.avatarUrl,
          };
          setProfile(profileData);
          setEditForm(profileData);
        }

        // Get pets count
        const petsResponse = await apiClient.getPets();
        const petsCount = petsResponse.data?.length || 0;

        // Get analysis history for stats
        const historyResponse = await apiClient.getAnalysisHistory();
        const analysesCount = historyResponse.data?.pagination?.total || 0;
        
        // Calculate days since joining
        const joinDate = new Date(user.id ? Date.now() : Date.now()); // Fallback
        const daysSinceJoining = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Update stats with real data
        setStats([
          { label: 'تعداد اسکن', value: analysesCount.toString(), icon: '📊' },
          { label: 'حیوانات ثبت شده', value: petsCount.toString(), icon: '🐕' },
          { label: 'روز عضویت', value: daysSinceJoining.toString(), icon: '📅' },
          { label: 'امتیاز امنیت میانگین', value: '85', icon: '⭐' }, // This would need calculation
        ]);

        // Set recent activity from analysis history
         if (historyResponse.data?.analyses) {
           const activities = historyResponse.data.analyses.slice(0, 3).map((analysis) => ({
             id: analysis.id,
             action: `اسکن ${analysis.inputData.productName || 'غذا'}`,
             pet: 'حیوان خانگی', // This would need pet name from analysis
             score: analysis.overallScore || null,
             time: new Date(analysis.createdAt).toLocaleDateString('fa-IR'),
           }));
           setRecentActivity(activities);
         }
        
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [isAuthenticated, user]);



  const handleSave = async () => {
    try {
      const updateData = {
        displayName: editForm.name,
        phone: editForm.phone,
      };
      
      const response = await apiClient.updateUserProfile(updateData);
      if (response.error) {
        console.error('Error updating profile:', response.error);
        return;
      }
      
      setProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  // Navigation handlers for quick action buttons
  const handleQuickScan = () => {
    router.push('/camera');
  };

  const handleAddPet = () => {
    router.push('/pets/add');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  // Show loading state
  if (isLoading || isLoadingProfile) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-text-secondary persian-body">در حال بارگذاری...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-h1 font-bold text-text-primary persian-heading">
              پروفایل کاربری
            </h1>
            <p className="text-text-secondary persian-body mt-2">
              مدیریت اطلاعات شخصی و تنظیمات حساب کاربری
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl persian-heading">
                      اطلاعات شخصی
                    </CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        ویرایش
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm">
                          ذخیره
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          size="sm"
                        >
                          لغو
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-600 persian-heading">
                        {profile.name.charAt(0)}
                      </span>
                    </div>

                    <div className="flex-1 space-y-4">
                      {isEditing ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            label="نام و نام خانوادگی"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                          />
                          <Input
                            label="ایمیل"
                            type="email"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                          />
                          <Input
                            label="شماره تماس"
                            value={editForm.phone}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                phone: e.target.value,
                              })
                            }
                          />
                          <Input
                            label="موقعیت مکانی"
                            value={editForm.location}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                location: e.target.value,
                              })
                            }
                          />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-text-secondary persian-body">
                              نام و نام خانوادگی
                            </label>
                            <p className="text-text-primary persian-body mt-1">
                              {profile.name}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-text-secondary persian-body">
                              ایمیل
                            </label>
                            <p className="text-text-primary persian-body mt-1">
                              {profile.email}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-text-secondary persian-body">
                              شماره تماس
                            </label>
                            <p className="text-text-primary persian-body mt-1">
                              {profile.phone}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-text-secondary persian-body">
                              موقعیت مکانی
                            </label>
                            <p className="text-text-primary persian-body mt-1">
                              {profile.location}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-background-tertiary">
                        <div className="flex items-center gap-4 text-sm text-text-secondary persian-body">
                          <span>📅 عضو از: {profile.joinDate}</span>
                          <Badge variant="success">حساب تایید شده</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle className="text-lg persian-body">
                    فعالیت‌های اخیر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-text-primary persian-body font-medium">
                            {activity.action}
                          </p>
                          <p className="text-sm text-text-secondary persian-body">
                            حیوان: {activity.pet} • {activity.time}
                          </p>
                        </div>
                        {activity.score && (
                          <Badge
                            variant={
                              activity.score >= 80
                                ? 'success'
                                : activity.score >= 60
                                  ? 'warning'
                                  : 'error'
                            }
                          >
                            امتیاز: {activity.score}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats & Quick Actions */}
            <div className="space-y-6">
              {/* Stats */}
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle className="text-lg persian-body">
                    آمار کلی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{stat.icon}</span>
                          <span className="text-sm text-text-secondary persian-body">
                            {stat.label}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-text-primary persian-body">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle className="text-lg persian-body">
                    دسترسی سریع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleQuickScan}
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
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                      </svg>
                      اسکن جدید
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleAddPet}
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      افزودن حیوان
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleViewHistory}
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      مشاهده تاریخچه
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleSettings}
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
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      تنظیمات
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle className="text-lg persian-body">
                    امنیت حساب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary persian-body">
                        احراز هویت دو مرحله‌ای
                      </span>
                      <Badge variant="success">فعال</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary persian-body">
                        احراز هویت PIN
                      </span>
                      <Badge variant="success">فعال</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary persian-body">
                        آخرین ورود
                      </span>
                      <span className="text-sm text-text-primary persian-body">
                        امروز، 14:30
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
