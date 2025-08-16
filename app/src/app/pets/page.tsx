'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import Image from 'next/image';

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
  dietaryRestrictions: string[];
  healthConditions: string[];
}

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



export default function PetsPage() {
  const { isAuthenticated, isLoading: authLoading, user, refreshSession } = useAuth();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'سگ' | 'گربه'>(
    'all'
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PetFormData>({
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
  });

  // Production-level fetch pets with comprehensive error handling
  const fetchPets = useCallback(async (forceRefresh = false) => {
    // Early return if not authenticated and not loading
    if (!authLoading && !isAuthenticated) {
      setAuthError('لطفاً وارد حساب کاربری خود شوید');
      setLoading(false);
      return;
    }

    // Wait for auth to complete if still loading
    if (authLoading) {
      return;
    }

    const startTime = Date.now();
    
    try {
      setLoading(true);
      setAuthError(null);
      
      // Validate user session before making API call
      if (!user?.id) {
        throw new Error('کاربر احراز هویت نشده است');
      }

      // Check if access token exists
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('توکن دسترسی یافت نشد');
      }
      
      const response = await apiClient.getPets();
      
      // Handle API errors with specific error codes
      if (response.error) {
        if (response.error.code === 'unauthorized' || response.error.code === 'invalid_token') {
          // Try to refresh session once
          if (!forceRefresh && retryCount < 1) {
            setRetryCount(prev => prev + 1);
            await refreshSession();
            return fetchPets(true);
          }
          throw new Error('جلسه کاری منقضی شده است. لطفاً دوباره وارد شوید');
        }
        
        if (response.error.code === 'forbidden') {
          throw new Error('شما مجوز دسترسی به این اطلاعات را ندارید');
        }
        
        if (response.error.code === 'rate_limit') {
          throw new Error('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید');
        }
        
        throw new Error(response.error.message || 'خطا در دریافت اطلاعات حیوانات');
      }

      // Validate response data structure
      if (!response.data) {
        throw new Error('پاسخ سرور نامعتبر است');
      }

      // Extract and validate pets data
      const backendPets = Array.isArray(response.data) ? response.data : (response as any).data || [];
      
      if (!Array.isArray(backendPets)) {
        throw new Error('فرمت داده‌های دریافتی نامعتبر است');
      }

      // Transform and validate pets data
      const transformedPets: Pet[] = backendPets.map((pet: any) => {
        // Validate required fields
        if (!pet.id || !pet.name) {
          console.warn('Pet missing required fields:', pet);
          return null;
        }
        
        const petType: 'سگ' | 'گربه' = pet.type === 'cat' ? 'گربه' : pet.type === 'dog' ? 'سگ' : 'گربه';
        return {
          id: pet.id,
          name: pet.name,
          type: petType,
          breed: pet.breed || 'نامشخص',
          age: Math.max(0, pet.age || 0),
          weight: Math.max(0, typeof pet.weight === 'string' ? parseFloat(pet.weight) || 0 : pet.weight || 0),
          avatar: pet.imageUrl || '/placeholder-pet.jpg',
          healthStatus: 'good' as const,
          lastFed: new Date(),
          dietaryRestrictions: Array.isArray(pet.dietaryRestrictions) ? pet.dietaryRestrictions : [],
          healthConditions: Array.isArray(pet.healthConditions) ? pet.healthConditions : [],
        };
      }).filter(Boolean) as Pet[];

      // Production log: Pet data loaded successfully
      logger.businessEvent('pets_loaded', {
        petCount: transformedPets.length,
        loadTime: Date.now() - startTime
      }, user?.id);
      
      setPets(transformedPets);
       setRetryCount(0); // Reset retry count on success
      
      // Show success message for manual refresh
      if (forceRefresh) {
        toast({
          title: 'اطلاعات به‌روزرسانی شد',
          description: `${transformedPets.length} حیوان خانگی یافت شد`,
          variant: 'default',
        });
      }
      
    } catch (error) {
      // Production error logging
      logger.error('Failed to fetch pets data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount,
        forceRefresh
      }, user?.id);
      
      const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات حیوانات';
      
      setAuthError(errorMessage);
      
      // Show different toast messages based on error type
      if (errorMessage.includes('احراز هویت') || errorMessage.includes('توکن') || errorMessage.includes('جلسه')) {
        toast({
          title: 'خطا در احراز هویت',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'خطا در دریافت اطلاعات',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, user, retryCount, refreshSession, toast]);

  // Run fetchPets immediately on mount
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);



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

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || '',
      type: pet.type as 'سگ' | 'گربه' | '',
      breed: pet.breed || '',
      age: pet.age?.toString() || '',
      weight: pet.weight?.toString() || '',
      gender: '',
      birthDate: '',
      microchipId: '',
      vetName: '',
      vetPhone: '',
      dietaryRestrictions: pet.dietaryRestrictions || [],
      medicalConditions: pet.healthConditions || [],
      allergies: [],
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام حیوان خانگی الزامی است',
        variant: 'default',
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: 'خطا',
        description: 'نوع حیوان خانگی الزامی است',
        variant: 'default',
      });
      return;
    }

    if (!editingPet) return;

    try {
      setSaving(true);
      
      const updateData = {
        name: formData.name.trim(),
        type: formData.type,
        breed: formData.breed.trim() || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dietaryRestrictions: formData.dietaryRestrictions,
        healthConditions: formData.medicalConditions,
        imageUrl: undefined,
      };

      const response = await apiClient.updatePet(editingPet.id, updateData);
      
      if (response.error) {
        toast({
          title: 'خطا',
          description: typeof response.error === 'string' ? response.error : 'خطا در به‌روزرسانی حیوان خانگی',
          variant: 'default',
        });
        return;
      }

      toast({
        title: 'موفق',
        description: 'اطلاعات حیوان خانگی با موفقیت به‌روزرسانی شد',
        variant: 'default',
      });

      setIsEditModalOpen(false);
      // Refresh pets list
      const fetchPets = async () => {
        try {
          setLoading(true);
          const response = await apiClient.getPets();
          
          if (response.error) {
            if (response.error.code === 'unauthorized') {
              console.error('Authentication required');
              return;
            }
            throw new Error(response.error.message);
          }

          const backendPets = response.data;
          const transformedPets: Pet[] = (Array.isArray(backendPets) ? backendPets : []).map((pet: any) => {
            // Map English type to Persian type
            let petType: 'سگ' | 'گربه' = 'سگ'; // default to dog
            if (pet.type === 'cat' || pet.type === 'گربه') {
              petType = 'گربه';
            } else if (pet.type === 'dog' || pet.type === 'سگ') {
              petType = 'سگ';
            }
            
            return {
              id: pet.id,
              name: pet.name || 'نامشخص',
              type: petType,
              breed: pet.breed || 'نامشخص',
              age: pet.age || 0,
              weight: pet.weight || 0,
              avatar: pet.imageUrl || '',
              healthStatus: 'good' as const,
              lastFed: new Date(),
              dietaryRestrictions: pet.dietaryRestrictions || [],
              healthConditions: pet.healthConditions || [],
            };
          });
          
          setPets(transformedPets);
        } catch (error) {
          console.error('Error fetching pets:', error);
          setPets([]);
        } finally {
          setLoading(false);
        }
      };
      fetchPets();
    } catch (error) {
      console.error('Error updating pet:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی حیوان خانگی',
        variant: 'default',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const toggleMedicalCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.includes(condition)
        ? prev.medicalConditions.filter(c => c !== condition)
        : [...prev.medicalConditions, condition]
    }));
  };

  const commonDietaryRestrictions = [
    'بدون گلوتن',
    'بدون غلات',
    'کم چربی',
    'پروتئین محدود',
    'بدون مرغ',
    'بدون گوشت قرمز',
    'ضد حساسیت'
  ];

  const commonMedicalConditions = [
    'دیابت',
    'بیماری کلیه',
    'بیماری قلبی',
    'آرتریت',
    'حساسیت غذایی',
    'اضافه وزن',
    'مشکلات گوارشی'
  ];

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
                  {pets.filter((p) => p.type === 'سگ').length}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  سگ‌ها
                </p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning-600 mb-1 persian-numbers">
                  {pets.filter((p) => p.type === 'گربه').length}
                </div>
                <p className="text-sm text-text-secondary persian-body">
                  گربه‌ها
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditPet(pet)}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        ویرایش
                      </Button>
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

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="persian-heading">
                ویرایش اطلاعات {editingPet?.name}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold persian-heading">اطلاعات پایه</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="persian-body">نام حیوان خانگی *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="نام حیوان خانگی را وارد کنید"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="persian-body">نوع حیوان خانگی *</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={formData.type === 'سگ' ? 'primary' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, type: 'سگ' }))}
                        className="flex-1 text-black"
                      >
                        سگ
                      </Button>
                      <Button
                        type="button"
                        variant={formData.type === 'گربه' ? 'primary' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, type: 'گربه' }))}
                        className="flex-1 text-black"
                      >
                        گربه
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="breed" className="persian-body">نژاد</Label>
                    <Input
                      id="breed"
                      value={formData.breed}
                      onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                      placeholder="نژاد حیوان خانگی"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="age" className="persian-body">سن (سال)</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="سن"
                      min="0"
                      max="30"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight" className="persian-body">وزن (کیلوگرم)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="وزن"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold persian-heading">محدودیت‌های غذایی</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonDietaryRestrictions.map((restriction) => (
                    <Button
                      key={restriction}
                      type="button"
                      variant={formData.dietaryRestrictions.includes(restriction) ? 'primary' : 'outline'}
                      onClick={() => toggleDietaryRestriction(restriction)}
                      className="text-sm justify-start text-black"
                    >
                      {restriction}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold persian-heading">وضعیت‌های پزشکی</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonMedicalConditions.map((condition) => (
                    <Button
                      key={condition}
                      type="button"
                      variant={formData.medicalConditions.includes(condition) ? 'primary' : 'outline'}
                      onClick={() => toggleMedicalCondition(condition)}
                      className="text-sm justify-start text-black"
                    >
                      {condition}
                    </Button>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="text-black"
                >
                  انصراف
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={saving} 
                  className="text-black bg-white border border-gray-300 hover:bg-gray-50"
                >
                  {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </MainLayout>
    );
  }
