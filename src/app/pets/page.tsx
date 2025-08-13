'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
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
import { apiClient } from '@/lib/api-client';
import { useRequireAuth } from '@/contexts/auth-context';

interface Pet {
  id: string;
  name: string;
  type: 'سگ' | 'گربه';
  breed: string;
  age: number;
  weight: number;
  avatar: string;
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  lastFed: Date;
  totalScans: number;
  averageScore: number;
  dietaryRestrictions: string[];
}

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

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-success-600';
  if (score >= 70) return 'text-primary-600';
  if (score >= 60) return 'text-warning-600';
  return 'text-error-600';
};

export default function PetsPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'سگ' | 'گربه'>(
    'all'
  );

  // # FIX: Use correct API method to fetch pets
   useEffect(() => {
     const fetchPets = async () => {
       try {
         setLoading(true);
         const response = await apiClient.getPets();
         
         if (response.error) {
           if (response.error.code === 'unauthorized') {
             // Handle authentication error
             console.error('Authentication required');
             return;
           }
           throw new Error(response.error.message);
         }

         // Transform backend data to frontend format with null safety
         const backendPets = response.data;
         const transformedPets: Pet[] = (Array.isArray(backendPets) ? backendPets : []).map((pet) => ({
            id: pet.id,
            name: pet.name || 'نامشخص',
            type: (pet.type === 'سگ' || pet.type === 'گربه') ? pet.type : 'سگ',
            breed: pet.breed || 'نامشخص',
            age: pet.age || 0,
            weight: pet.weight || 0,
            avatar: pet.imageUrl || '',
            healthStatus: 'good' as const,
            lastFed: new Date(),
            totalScans: 0,
            averageScore: 75,
            dietaryRestrictions: pet.dietaryRestrictions || [],
          }));
         
         setPets(transformedPets);
       } catch (error) {
         console.error('Error fetching pets:', error);
         setPets([]); // Set empty array on error
       } finally {
         setLoading(false);
       }
     };
 
     if (isAuthenticated && !authLoading) {
       fetchPets();
     }
   }, [isAuthenticated, authLoading]);

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || pet.type === selectedType;
    return matchesSearch && matchesType;
  });

  // # FIX: Use correct API method to delete pet
   const handleDeletePet = async (petId: string) => {
     if (confirm('آیا مطمئن هستید که می‌خواهید این حیوان خانگی را حذف کنید؟')) {
       try {
         const response = await apiClient.deletePet(petId);
         if (response.error) {
           if (response.error.code === 'unauthorized') {
             alert('لطفاً وارد حساب کاربری خود شوید');
             return;
           }
           throw new Error(response.error.message);
         }
         // Update pets list after successful deletion
         setPets(prevPets => prevPets.filter((pet) => pet.id !== petId));
       } catch (error) {
         console.error('Error deleting pet:', error);
         alert('خطا در حذف حیوان خانگی');
       }
     }
   };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-h1 font-bold text-text-primary persian-heading">
                حیوانات خانگی من
              </h1>
              <p className="text-text-secondary persian-body mt-2">
                مدیریت و پیگیری حیوانات خانگی شما
              </p>
            </div>
            <Link href="/pets/add">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                افزودن حیوان جدید
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-600 mb-1 persian-numbers">
                  {pets.length}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  کل حیوانات
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success-600 mb-1 persian-numbers">
                  {pets.filter((p) => p.healthStatus === 'excellent').length}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  سلامت عالی
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary-600 mb-1 persian-numbers">
                  {pets.reduce((sum, pet) => sum + pet.totalScans, 0)}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  کل اسکن‌ها
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning-600 mb-1 persian-numbers">
                  {pets.length > 0 ? Math.round(
                    pets.reduce((sum, pet) => sum + pet.averageScore, 0) /
                      pets.length
                  ) : 0}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  میانگین امتیاز
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card variant="outlined">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="جستجو بر اساس نام یا نژاد..."
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
                <div className="flex gap-2">
                  <Button
                    variant={selectedType === 'all' ? 'primary' : 'outline'}
                    onClick={() => setSelectedType('all')}
                    size="sm"
                  >
                    همه
                  </Button>
                  <Button
                    variant={selectedType === 'سگ' ? 'primary' : 'outline'}
                    onClick={() => setSelectedType('سگ')}
                    size="sm"
                  >
                    سگ‌ها
                  </Button>
                  <Button
                    variant={selectedType === 'گربه' ? 'primary' : 'outline'}
                    onClick={() => setSelectedType('گربه')}
                    size="sm"
                  >
                    گربه‌ها
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pets Grid */}
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
          ) : filteredPets.length === 0 ? (
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-text-primary persian-body mb-2">
                  حیوانی یافت نشد
                </h3>
                <p className="text-text-secondary persian-body mb-4">
                  {searchQuery
                    ? 'جستجوی شما نتیجه‌ای نداشت'
                    : 'هنوز حیوان خانگی اضافه نکرده‌اید'}
                </p>
                {!searchQuery && (
                  <Link href="/pets/add">
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      اولین حیوان خانگی را اضافه کنید
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPets.map((pet) => (
                <Card
                  key={pet.id}
                  variant="elevated"
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-lg">
                            {pet.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg persian-body">
                            {pet.name}
                          </CardTitle>
                          <CardDescription className="persian-body">
                            {pet.type} • {pet.breed}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        {...getHealthStatusBadge(pet.healthStatus)}
                        size="sm"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Pet Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-tertiary persian-body">
                          سن:
                        </span>
                        <span className="text-text-primary font-medium mr-2 persian-numbers">
                          {pet.age} سال
                        </span>
                      </div>
                      <div>
                        <span className="text-text-tertiary persian-body">
                          وزن:
                        </span>
                        <span className="text-text-primary font-medium mr-2 persian-numbers">
                          {pet.weight} کیلو
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-background-secondary rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary persian-body">
                          آخرین وعده:
                        </span>
                        <span className="text-sm text-text-primary persian-body">
                          {formatTimeAgo(pet.lastFed)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary persian-body">
                          کل اسکن‌ها:
                        </span>
                        <span className="text-sm text-text-primary persian-numbers">
                          {pet.totalScans}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary persian-body">
                          میانگین امتیاز:
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium persian-numbers',
                            getScoreColor(pet.averageScore)
                          )}
                        >
                          {pet.averageScore}%
                        </span>
                      </div>
                    </div>

                    {/* Dietary Restrictions */}
                    {pet.dietaryRestrictions.length > 0 && (
                      <div>
                        <p className="text-sm text-text-tertiary persian-body mb-2">
                          محدودیت‌های غذایی:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pet.dietaryRestrictions.map((restriction, index) => (
                            <Badge key={index} variant="outline" size="sm">
                              {restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/pets/${pet.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
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
                          مشاهده
                        </Button>
                      </Link>
                      <Link href={`/pets/${pet.id}/edit`}>
                        <Button variant="ghost" size="sm">
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
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePet(pet.id)}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
