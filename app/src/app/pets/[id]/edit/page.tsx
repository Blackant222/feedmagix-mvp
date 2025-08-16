'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';


interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  imageUrl?: string;
  dietaryRestrictions?: string[];
  healthConditions?: string[];
  createdAt: string;
  updatedAt: string;
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
];



export default function EditPetPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  const petId = params.id as string;

  const fetchPet = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPet(petId);
      if (response.error) {
        toast({
          title: 'خطا',
          description: 'خطا در بارگذاری اطلاعات حیوان خانگی',
          variant: 'default',
        });
        return;
      }
      if (response.data) {
        setPet(response.data);
        // Pre-fill form data with current pet data
        setFormData({
          name: response.data.name || '',
          type: response.data.type as 'سگ' | 'گربه' | '',
          breed: response.data.breed || '',
          age: response.data.age?.toString() || '',
          weight: response.data.weight?.toString() || '',
          gender: '',
          birthDate: '',
          microchipId: '',
          vetName: '',
          vetPhone: '',
          dietaryRestrictions: response.data.dietaryRestrictions || [],
          medicalConditions: response.data.healthConditions || [],
          allergies: [],
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error fetching pet:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات حیوان خانگی',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  }, [petId, toast]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchPet();
  }, [user, petId, fetchPet, router]);

  const handleEdit = () => {
    // Refresh form data with current pet data when opening modal
    if (pet) {
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
    }
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این حیوان خانگی اطمینان دارید؟')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await apiClient.deletePet(petId);
      if (response.error) {
        toast({
          title: 'خطا',
          description: 'خطا در حذف حیوان خانگی',
          variant: 'default',
        });
        return;
      }
      
      toast({
        title: 'موفق',
        description: 'حیوان خانگی با موفقیت حذف شد',
        variant: 'default',
      });
      
      router.push('/pets');
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف حیوان خانگی',
        variant: 'default',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    router.push('/pets');
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

      const response = await apiClient.updatePet(petId, updateData);
      
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
      fetchPet(); // Refresh pet data
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



  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!pet) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Card variant="outlined">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-bold text-text-primary persian-heading mb-4">
                  حیوان خانگی یافت نشد
                </h2>
                <p className="text-text-secondary persian-body mb-6">
                  حیوان خانگی مورد نظر یافت نشد یا ممکن است حذف شده باشد.
                </p>
                <Button onClick={handleBack} className="text-black bg-white border border-gray-300 hover:bg-gray-50">
                  بازگشت به لیست حیوانات خانگی
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack} className="text-black">
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
                بازگشت
              </Button>
              <h1 className="text-2xl font-bold text-text-primary persian-heading">
                {pet.name}
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleEdit} className="text-black bg-white border border-gray-300 hover:bg-gray-50">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                ویرایش
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                className="text-black bg-white border border-gray-300 hover:bg-gray-50"
              >
                {deleting ? (
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
                    در حال حذف...
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    حذف
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pet Image */}
            <div className="lg:col-span-1">
              <Card variant="outlined">
                <CardContent className="p-6">
                  <div className="aspect-square bg-background-secondary rounded-lg flex items-center justify-center mb-4">
                    {pet.imageUrl ? (
                      <Image
                        src={pet.imageUrl}
                        alt={pet.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <svg
                          className="w-16 h-16 text-text-tertiary mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-text-tertiary persian-body text-sm">
                          تصویری موجود نیست
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-text-primary persian-heading mb-1">
                      {pet.name}
                    </h2>
                    <p className="text-text-secondary persian-body">
                      {pet.type} • {pet.breed}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pet Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle className="persian-heading">اطلاعات پایه</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {pet.age && (
                      <div>
                        <p className="text-sm text-text-tertiary persian-body">سن</p>
                        <p className="font-medium text-text-primary persian-numbers">
                          {pet.age} سال
                        </p>
                      </div>
                    )}
                    {pet.weight && (
                      <div>
                        <p className="text-sm text-text-tertiary persian-body">وزن</p>
                        <p className="font-medium text-text-primary persian-numbers">
                          {pet.weight} کیلوگرم
                        </p>
                      </div>
                    )}
                    {pet.breed && (
                      <div>
                        <p className="text-sm text-text-tertiary persian-body">نژاد</p>
                        <p className="font-medium text-text-primary persian-body">
                          {pet.breed}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Health Information */}
              {((pet.dietaryRestrictions && pet.dietaryRestrictions.length > 0) ||
                (pet.healthConditions && pet.healthConditions.length > 0)) && (
                <Card variant="outlined">
                  <CardHeader>
                    <CardTitle className="persian-heading">اطلاعات سلامت</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pet.dietaryRestrictions && pet.dietaryRestrictions.length > 0 && (
                      <div>
                        <p className="text-sm text-text-tertiary persian-body mb-2">
                          محدودیت‌های غذایی
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {pet.dietaryRestrictions.map((restriction, index) => (
                            <Badge key={index} variant="outline">
                              {restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {pet.healthConditions && pet.healthConditions.length > 0 && (
                      <div>
                        <p className="text-sm text-text-tertiary persian-body mb-2">
                          وضعیت‌های سلامتی
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {pet.healthConditions.map((condition, index) => (
                            <Badge key={index} variant="warning">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="persian-heading">ویرایش اطلاعات {pet.name}</DialogTitle>
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
                  {formData.type && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(formData.type === 'سگ' ? commonDogBreeds : commonCatBreeds).map((breed) => (
                        <Button
                          key={breed}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, breed }))}
                          className="text-xs text-black"
                        >
                          {breed}
                        </Button>
                      ))}
                    </div>
                  )}
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
              <Button type="submit" variant="primary" disabled={saving} className="text-black bg-white border border-gray-300 hover:bg-gray-50">
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}