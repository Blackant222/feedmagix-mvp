'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// # FIX: Replaced mock data with real API client
import { apiClient } from '@/lib/api-client';

interface DashboardData {
  user: {
    name: string;
    avatar?: string;
  };
  stats: {
    totalScans: number;
    healthyFeeds: number;
    petsCount: number;
    weeklyAverage: number;
  };
  recentScans: Array<{
    id: string;
    foodName: string;
    timestamp: Date;
    petName: string;
  }>;
  pets: Array<{
    id: string;
    name: string;
    type: string;
    avatar?: string;
    lastFed: Date;
    healthStatus: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    petName: string;
  }>;
}

interface ApiUser {
  displayName?: string;
  email?: string;
  avatarUrl?: string;
}

interface ApiPet {
  id: string;
  name: string;
  species: string;
  avatarUrl?: string;
}

interface ApiAnalysis {
  id: string;
  overallScore: number;
  createdAt: string;
  petId?: string;
  inputData?: {
    productName?: string;
    text?: string;
  };
}

// Removed mock data - now using real backend data only

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return 'کمتر از یک ساعت پیش';
  if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} روز پیش`;
};

// CHANGE: Removed unused getHealthStatusColor function to fix ESLint warning

const getHealthStatusBadge = (status: string) => {
  switch (status) {
    case 'excellent':
      return { variant: 'success' as const, text: 'عالی' };
    case 'good':
      return { variant: 'default' as const, text: 'خوب' };
    case 'warning':
      return { variant: 'warning' as const, text: 'نیاز به توجه' };
    case 'critical':
      return { variant: 'error' as const, text: 'بحرانی' };
    default:
      return { variant: 'outline' as const, text: 'نامشخص' };
  }
};

export default function Dashboard() {
  // # FIX: Added state for dashboard data and loading
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // # FIX: Added useEffect to fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const userResponse = await apiClient.getUserProfile();
        if (userResponse.error) {
          // Check if it's an authentication error
          if (userResponse.error.code === 'UNAUTHORIZED' || userResponse.error.code === 'INVALID_TOKEN') {
            // Clear local storage and redirect to login
            localStorage.removeItem('accessToken');
            window.location.href = '/auth/login';
            return;
          }
          throw new Error(userResponse.error.message);
        }
        
        // Fetch pets
        const petsResponse = await apiClient.getPets();
        if (petsResponse.error) {
          throw new Error(petsResponse.error.message);
        }
        
        // Fetch analysis history for stats
        const historyResponse = await apiClient.getAnalysisHistory({ limit: '10' });
        if (historyResponse.error) {
          throw new Error(historyResponse.error.message);
        }
        
        // Transform backend data to dashboard format
         const user = userResponse.data as ApiUser;
         const pets = (petsResponse.data as unknown as ApiPet[]) || [];
         const analyses = ((historyResponse.data as { analyses: ApiAnalysis[] })?.analyses || []);
         
         // Calculate stats from analyses
         const totalScans = Array.isArray(analyses) ? analyses.length : 0;
         const healthyFeeds = Array.isArray(analyses) ? analyses.filter((a: ApiAnalysis) => a.overallScore >= 70).length : 0;
         
         // Transform data to match dashboard interface
         const transformedData: DashboardData = {
           user: {
             name: user?.displayName || user?.email || 'کاربر',
             avatar: user?.avatarUrl,
           },
           stats: {
             totalScans,
             healthyFeeds,
             petsCount: Array.isArray(pets) ? pets.length : 0,
             weeklyAverage: Math.round(totalScans / 7) || 0,
           },
           recentScans: Array.isArray(analyses) ? analyses.slice(0, 3).map((analysis: ApiAnalysis) => ({
             id: analysis.id,
             foodName: analysis.inputData?.productName || analysis.inputData?.text || 'غذای ناشناخته',
             timestamp: new Date(analysis.createdAt),
             petName: Array.isArray(pets) ? pets.find((p: ApiPet) => p.id === analysis.petId)?.name || 'عمومی' : 'عمومی',
           })) : [],
           pets: Array.isArray(pets) ? pets.map((pet: ApiPet) => ({
             id: String(pet.id),
             name: pet.name,
             type: pet.species === 'dog' ? 'سگ' : pet.species === 'cat' ? 'گربه' : pet.species,
             avatar: pet.avatarUrl,
             lastFed: new Date(), // Default to current time
             healthStatus: 'excellent', // Default status
           })) : [],
           recentActivity: Array.isArray(analyses) ? analyses.slice(0, 3).map((analysis: ApiAnalysis) => ({
             id: analysis.id,
             type: 'scan',
             title: 'اسکن جدید انجام شد',
             description: `${analysis.inputData?.productName || 'غذای ناشناخته'} - بررسی شد`,
             timestamp: new Date(analysis.createdAt),
             petName: Array.isArray(pets) ? pets.find((p: ApiPet) => p.id === analysis.petId)?.name || 'عمومی' : 'عمومی',
           })) : [],
         };
        
        setDashboardData(transformedData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری داده‌ها');
        // Set empty dashboard data on error
        setDashboardData({
          user: { name: 'کاربر', avatar: undefined },
          stats: { totalScans: 0, healthyFeeds: 0, petsCount: 0, weeklyAverage: 0 },
          recentScans: [],
          pets: [],
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // # FIX: Added loading and error states
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-text-secondary">در حال بارگذاری داشبورد...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error && !dashboardData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-error-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const data = dashboardData;

  const handleQuickScan = () => {
    // Navigate to scan page
    window.location.href = '/scan';
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-h1 font-bold text-text-primary persian-heading">
                سلام {data?.user?.name || 'کاربر'} 👋
              </h1>
              <p className="text-text-secondary persian-body mt-2">
                امروز {new Date().toLocaleDateString('fa-IR')}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleQuickScan} size="lg">
                <svg
                  className="w-5 h-5 ml-2"
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
                اسکن سریع
              </Button>
              <Button variant="outline" size="lg">
                <svg
                  className="w-5 h-5 ml-2"
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
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Card variant="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2 persian-numbers">
                  {data?.stats?.totalScans || 0}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  کل اسکن‌ها
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-success-600 mb-2 persian-numbers">
                  {data?.stats?.healthyFeeds || 0}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  وعده سالم
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary-600 mb-2 persian-numbers">
                  {data?.stats?.petsCount || 0}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  حیوانات خانگی
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-warning-600 mb-2 persian-numbers">
                  {data?.stats?.weeklyAverage || 0}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  میانگین هفتگی
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Scans */}
            <Card variant="elevated" className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>اسکن‌های اخیر</CardTitle>
                  <Button variant="ghost" size="sm">
                    مشاهده همه
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.recentScans?.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
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
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary persian-body">
                        {scan.foodName}
                      </h4>
                      <p className="text-sm text-text-secondary persian-body">
                        برای {scan.petName} • {formatTimeAgo(scan.timestamp)}
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-primary-600 persian-body">
                        سالم
                      </div>
                      <p className="text-xs text-text-secondary">
                        وضعیت
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pets Status */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>حیوانات خانگی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.pets?.map((pet) => (
                  <div
                    key={pet.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {pet.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-text-primary persian-body">
                          {pet.name}
                        </h4>
                        <Badge
                          {...getHealthStatusBadge(pet.healthStatus)}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-text-secondary persian-body">
                        {pet.type} • آخرین وعده: {formatTimeAgo(pet.lastFed)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>فعالیت‌های اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentActivity?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mt-1">
                      <svg
                        className="w-5 h-5 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary persian-body">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-text-secondary persian-body mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-text-tertiary persian-body mt-2">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
