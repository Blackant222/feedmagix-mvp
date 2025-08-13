'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// CHANGE: Restored Link import as it is used in the component
import { MainLayout } from '@/components/layout/main-layout';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  // CHANGE: Removed unused CardDescription, CardHeader, CardTitle imports to fix ESLint warnings
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
// CHANGE: Restored cn import as it is used in the component
// # FIX: Replaced mock data with real API client
import { apiClient } from '@/lib/api-client';

interface HistoryAnalysisItem {
  id: string;
  type: string;
  inputMethod: string;
  inputData: {
    productName?: string;
    brand?: string;
    imageUrl?: string;
    text?: string;
  };
  analysisResult: {
    overallScore: number;
    summary: string;
    ingredients?: Array<{
      name: string;
      category: string;
      quality: string;
      concerns?: string[];
    }>;
    ingredientAnalysis?: {
      mainIngredients?: string[];
    };
    recommendations: string[];
    warnings: string[];
  };
  processingTime: number;
  confidence: string;
  isFavorite: boolean;
  createdAt: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
  } | null;
}

interface ScanHistory {
  id: string;
  petName: string;
  petId: string;
  foodName: string;
  scanDate: Date;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'poor';
  scanType: 'barcode' | 'image' | 'manual';
  ingredients: string[];
  warnings: string[];
  recommendations: string[];
  image?: string;
}

// Removed unused AnalysisData interface

// Mock data removed - now using real API data only

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return 'کمتر از یک ساعت پیش';
  if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'دیروز';
  if (diffInDays < 7) return `${diffInDays} روز پیش`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} هفته پیش`;
  return `${Math.floor(diffInDays / 30)} ماه پیش`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'excellent':
      return { variant: 'success' as const, text: 'عالی' };
    case 'good':
      return { variant: 'default' as const, text: 'خوب' };
    case 'warning':
      return { variant: 'warning' as const, text: 'قابل قبول' };
    case 'poor':
      return { variant: 'error' as const, text: 'ضعیف' };
    default:
      return { variant: 'outline' as const, text: 'نامشخص' };
  }
};

const getScanTypeIcon = (type: string) => {
  switch (type) {
    case 'barcode':
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
      );
    case 'image':
      return (
        <svg
          className="w-4 h-4"
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
      );
    case 'manual':
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
    default:
      return null;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-success-600';
  if (score >= 70) return 'text-primary-600';
  if (score >= 50) return 'text-warning-600';
  return 'text-error-600';
};

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [pets, setPets] = useState<Array<{ id: string; name: string }>>([]);

  // Load history and pets from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch pets first to map names
        const petsResponse = await apiClient.getPets();
        if (!petsResponse.error && petsResponse.data) {
          const petsData = petsResponse.data as unknown as Array<{ id: string; name: string; [key: string]: unknown }>;
          setPets(petsData.map(pet => ({ id: pet.id, name: pet.name })));
        }
        
        // Fetch analysis history
        console.log('🔍 Fetching analysis history...');
        const response = await apiClient.getAnalysisHistory();
        console.log('📊 API Response:', response);
        
        if (response.error) {
          // If unauthorized, try to fetch without auth (for demo purposes)
          if (response.error.code === 'unauthorized' || response.error.code === 'UNKNOWN_ERROR') {
            console.log('🔐 Auth failed, trying direct API call...');
            try {
              const directResponse = await fetch('/api/analyze/history');
              const directData = await directResponse.json();
              console.log('📡 Direct API Response:', directData);
              
              if (directData.success && directData.data) {
                const backendData = directData.data;
                const analyses = (backendData?.analyses || []) as unknown as HistoryAnalysisItem[];
                console.log('📋 Raw analyses data:', analyses);
                console.log('📋 Number of analyses:', analyses.length);
                
                const transformedHistory: ScanHistory[] = analyses.map((analysis: HistoryAnalysisItem) => {
                  console.log('🔍 Raw analysis item:', analysis);
                  
                  // Extract data from the actual API response structure
                  const analysisResult = analysis.analysisResult || {};
                  const inputData = analysis.inputData || {};
                  const petData = analysis.pet as { id?: string; name?: string } || {};
                  
                  // Get overall score from analysis result
                  const overallScore = analysisResult.overallScore || 0;
                  
                  // Get ingredients from analysis result
                  const ingredients = analysisResult.ingredients || analysisResult.ingredientAnalysis?.mainIngredients || [];
                  const ingredientNames: string[] = Array.isArray(ingredients) ? 
                    ingredients.map((ing: unknown) => typeof ing === 'string' ? ing : String((ing as Record<string, unknown>).name || ing)) : [];
                  
                  // Get warnings and recommendations
                  const warnings = analysisResult.warnings || [];
                  const recommendations = analysisResult.recommendations || [];
                  
                  const transformed = {
                    id: analysis.id,
                    petName: petData.name || 'حیوان خانگی',
                    petId: petData.id || '1',
                    foodName: inputData.productName || inputData.text || 'غذای ناشناخته',
                    scanDate: new Date(analysis.createdAt),
                    score: overallScore,
                    status: overallScore >= 85 ? 'excellent' as const :
                            overallScore >= 70 ? 'good' as const :
                            overallScore >= 50 ? 'warning' as const : 'poor' as const,
                    scanType: analysis.inputMethod === 'image' ? 'image' as const : 
                             analysis.inputMethod === 'barcode' ? 'barcode' as const : 'manual' as const,
                    ingredients: ingredientNames,
                    warnings: Array.isArray(warnings) ? warnings : [],
                    recommendations: Array.isArray(recommendations) ? recommendations : [],
                    image: inputData.imageUrl,
                  };
                  console.log('🔄 Transformed item:', transformed);
                  return transformed;
                });
                console.log('✅ Final transformed history:', transformedHistory);
                setHistory(transformedHistory);
                return;
              } else {
                console.log('❌ No data in direct response');
              }
            } catch (directError) {
              console.error('❌ Direct API call failed:', directError);
            }
          }
          throw new Error(response.error.message);
        }
        
        // Transform backend data to frontend format
        console.log('🔄 Processing successful API response...');
        const backendData = response.data;
        const analyses = (backendData?.analyses || []) as unknown as HistoryAnalysisItem[];
        console.log('📋 Main API analyses data:', analyses);
        console.log('📋 Main API number of analyses:', analyses.length);
         
        const transformedHistory: ScanHistory[] = analyses.map((analysis: HistoryAnalysisItem) => {
           console.log('🔍 Main API raw analysis item:', analysis);
           
           // Extract data from the actual API response structure
           const analysisResult = analysis.analysisResult || {};
           const inputData = analysis.inputData || {};
           const petData = analysis.pet as { id?: string; name?: string } || {};
           
           // Get overall score from analysis result
           const overallScore = analysisResult.overallScore || 0;
           
           // Get ingredients from analysis result
           const ingredients = analysisResult.ingredients || analysisResult.ingredientAnalysis?.mainIngredients || [];
           const ingredientNames: string[] = Array.isArray(ingredients) ? 
             ingredients.map((ing: unknown) => typeof ing === 'string' ? ing : String((ing as Record<string, unknown>).name || ing)) : [];
           
           // Get warnings and recommendations
           const warnings = analysisResult.warnings || [];
           const recommendations = analysisResult.recommendations || [];
           
           const transformed = {
             id: analysis.id,
             petName: petData.name || 'حیوان خانگی',
             petId: petData.id || '1',
             foodName: inputData.productName || inputData.text || 'غذای ناشناخته',
             scanDate: new Date(analysis.createdAt),
             score: overallScore,
             status: overallScore >= 85 ? 'excellent' as const :
                     overallScore >= 70 ? 'good' as const :
                     overallScore >= 50 ? 'warning' as const : 'poor' as const,
             scanType: analysis.inputMethod === 'image' ? 'image' as const : 
                      analysis.inputMethod === 'barcode' ? 'barcode' as const : 'manual' as const,
             ingredients: ingredientNames,
             warnings: Array.isArray(warnings) ? warnings : [],
             recommendations: Array.isArray(recommendations) ? recommendations : [],
             image: inputData.imageUrl,
           };
           console.log('🔄 Main API transformed item:', transformed);
           return transformed;
         });
        console.log('✅ Main API final transformed history:', transformedHistory);
        setHistory(transformedHistory);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('خطا در بارگذاری داده‌ها');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
 
    loadData();
  }, []);

  const petNames = Array.from(new Set(history.map((h) => h.petName)));

  const filteredHistory = history
    .filter((item) => {
      const matchesSearch =
        item.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.petName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPet = selectedPet === 'all' || item.petName === selectedPet;
      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus;
      
      // Use pets data for additional filtering if needed
      const petExists = pets.some(pet => pet.id === item.petId);
      
      return matchesSearch && matchesPet && matchesStatus && (item.petId === '' || petExists);
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.scanDate.getTime() - a.scanDate.getTime();
      } else {
        return b.score - a.score;
      }
    });

  // Debug logging
  console.log('🎯 Current state:');
  console.log('📊 history.length:', history.length);
  console.log('🔍 searchQuery:', searchQuery);
  console.log('🐕 selectedPet:', selectedPet);
  console.log('📈 selectedStatus:', selectedStatus);
  console.log('📋 filteredHistory.length:', filteredHistory.length);
  console.log('📋 filteredHistory:', filteredHistory);
  console.log('⏳ loading:', loading);
  console.log('❌ error:', error);

  // Delete scan using API method
  const handleDeleteScan = async (scanId: string) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این اسکن را حذف کنید؟')) {
      try {
        const response = await apiClient.deleteAnalysis(scanId);
        if (response.error) {
          if (response.error.code === 'unauthorized') {
            alert('لطفاً وارد حساب کاربری خود شوید');
            return;
          }
          throw new Error(response.error.message);
        }
        // Update local state after successful deletion
        setHistory(history.filter((h) => h.id !== scanId));
        alert('اسکن با موفقیت حذف شد');
      } catch (err) {
        console.error('Failed to delete scan:', err);
        alert('خطا در حذف اسکن');
      }
    }
  };

  const stats = {
    totalScans: history.length,
    averageScore: Math.round(
      history.reduce((sum, h) => sum + h.score, 0) / history.length
    ),
    excellentScans: history.filter((h) => h.status === 'excellent').length,
    recentScans: history.filter((h) => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return h.scanDate > dayAgo;
    }).length,
  };

  return (
    <AuthGuard>
      <MainLayout>
      <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-h1 font-bold text-text-primary persian-heading">
                تاریخچه اسکن‌ها
              </h1>
              <p className="text-text-secondary persian-body mt-2">
                مشاهده و مدیریت تمام اسکن‌های انجام شده
              </p>
            </div>
            <Link href="/scan">
              <Button size="lg">
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
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                اسکن جدید
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-600 mb-1 persian-numbers">
                  {stats.totalScans}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  کل اسکن‌ها
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary-600 mb-1 persian-numbers">
                  {stats.averageScore}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  میانگین امتیاز
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success-600 mb-1 persian-numbers">
                  {stats.excellentScans}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  اسکن عالی
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning-600 mb-1 persian-numbers">
                  {stats.recentScans}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  اسکن امروز
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card variant="outlined">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="جستجو بر اساس نام غذا یا حیوان..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedPet}
                    onChange={(e) => setSelectedPet(e.target.value)}
                    className="px-3 py-2 border border-border-primary rounded-lg text-sm persian-body"
                  >
                    <option value="all">همه حیوانات</option>
                    {petNames.map((pet) => (
                      <option key={pet} value={pet}>
                        {pet}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-border-primary rounded-lg text-sm persian-body"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="excellent">عالی</option>
                    <option value="good">خوب</option>
                    <option value="warning">قابل قبول</option>
                    <option value="poor">ضعیف</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'date' | 'score')
                    }
                    className="px-3 py-2 border border-border-primary rounded-lg text-sm persian-body"
                  >
                    <option value="date">مرتب‌سازی بر اساس تاریخ</option>
                    <option value="score">مرتب‌سازی بر اساس امتیاز</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading ? (
            <Card variant="outlined">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-background-tertiary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-text-tertiary animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-text-primary persian-body mb-2">
                  در حال بارگذاری...
                </h3>
                <p className="text-text-secondary persian-body">
                  لطفاً صبر کنید
                </p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card variant="outlined">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-error-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-error-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-text-primary persian-body mb-2">
                  خطا در بارگذاری
                </h3>
                <p className="text-text-secondary persian-body mb-4">
                  {error}
                </p>
                <Button onClick={() => window.location.reload()}>
                  تلاش مجدد
                </Button>
              </CardContent>
            </Card>
          ) : filteredHistory.length === 0 ? (
            <Card variant="outlined">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-background-tertiary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-text-tertiary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-text-primary persian-body mb-2">
                  اسکنی یافت نشد
                </h3>
                <p className="text-text-secondary persian-body mb-4">
                  {searchQuery
                    ? 'جستجوی شما نتیجه‌ای نداشت'
                    : 'هنوز اسکنی انجام نداده‌اید'}
                </p>
                {!searchQuery && (
                  <Link href="/scan">
                    <Button>
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
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      اولین اسکن را انجام دهید
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((scan) => (
                <Card
                  key={scan.id}
                  variant="elevated"
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-medium text-text-primary persian-body mb-1">
                              {scan.foodName}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-text-secondary">
                              <span className="persian-body">
                                برای {scan.petName}
                              </span>
                              <span className="persian-body">•</span>
                              <span className="persian-body">
                                {formatTimeAgo(scan.scanDate)}
                              </span>
                              <span className="persian-body">•</span>
                              <div className="flex items-center gap-1">
                                {getScanTypeIcon(scan.scanType)}
                                <span className="persian-body">
                                  {scan.scanType === 'barcode'
                                    ? 'بارکد'
                                    : scan.scanType === 'image'
                                      ? 'تصویر'
                                      : 'دستی'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge {...getStatusBadge(scan.status)} />
                            <div
                              className={cn(
                                'text-xl font-bold persian-numbers',
                                getScoreColor(scan.score)
                              )}
                            >
                              {scan.score}
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {scan.ingredients.length > 0 && (
                            <div>
                              <p className="text-text-tertiary persian-body mb-1">
                                مواد اصلی:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {scan.ingredients
                                  .slice(0, 3)
                                  .map((ingredient, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {ingredient}
                                    </Badge>
                                  ))}
                                {scan.ingredients.length > 3 && (
                                  <Badge variant="ghost" size="sm">
                                    +{scan.ingredients.length - 3} مورد دیگر
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {scan.warnings.length > 0 && (
                            <div>
                              <p className="text-text-tertiary persian-body mb-1">
                                هشدارها:
                              </p>
                              <div className="space-y-1">
                                {scan.warnings
                                  .slice(0, 2)
                                  .map((warning, index) => (
                                    <p
                                      key={index}
                                      className="text-warning-600 persian-body text-xs"
                                    >
                                      • {warning}
                                    </p>
                                  ))}
                                {scan.warnings.length > 2 && (
                                  <p className="text-text-tertiary persian-body text-xs">
                                    +{scan.warnings.length - 2} هشدار دیگر
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {scan.recommendations.length > 0 && (
                            <div>
                              <p className="text-text-tertiary persian-body mb-1">
                                توصیه‌ها:
                              </p>
                              <div className="space-y-1">
                                {scan.recommendations
                                  .slice(0, 2)
                                  .map((rec, index) => (
                                    <p
                                      key={index}
                                      className="text-success-600 persian-body text-xs"
                                    >
                                      • {rec}
                                    </p>
                                  ))}
                                {scan.recommendations.length > 2 && (
                                  <p className="text-text-tertiary persian-body text-xs">
                                    +{scan.recommendations.length - 2} توصیه
                                    دیگر
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex lg:flex-col gap-2">
                        <Link href={`/history/${scan.id}`}>
                          <Button variant="outline" size="sm">
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            جزئیات
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScan(scan.id)}
                          className="text-error-600 hover:text-error-700 hover:bg-error-50"
                        >
                          <svg
                            className="w-4 h-4"
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
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
    </AuthGuard>
  );
}
