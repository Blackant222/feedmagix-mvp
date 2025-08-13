'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
// # FIX: Replaced mock data with real API client
import { apiClient } from '@/lib/api-client';

interface ScanResult {
  id: string;
  type: 'image';
  productName: string;
  brand?: string;
  ingredients: string[];
  nutritionalInfo: {
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    calories: number;
  };
  safetyScore: number;
  warnings: string[];
  recommendations: string[];
  petCompatibility: {
    dogs: 'safe' | 'caution' | 'dangerous';
    cats: 'safe' | 'caution' | 'dangerous';
  };
  timestamp: Date;
}

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [pets, setPets] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [, setLoadingPets] = useState(true);

  // Fetch pets from API
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoadingPets(true);
        const response = await apiClient.getPets();
        if (response.error) {
          console.error('Error fetching pets:', response.error);
          return;
        }
        
        const backendPets = response.data || [];
        const transformedPets = [
          { id: 'all', name: 'همه حیوانات', type: 'all' },
          ...(backendPets as unknown as Array<{ id: string; name: string; type?: string; species?: string }>).map((pet) => ({
            id: pet.id,
            name: pet.name,
            type: pet.type || pet.species || 'unknown'
          }))
        ];
        setPets(transformedPets);
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoadingPets(false);
      }
    };
    
    fetchPets();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('دسترسی به دوربین امکان‌پذیر نیست');
      setIsScanning(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Convert image to base64 for API
  const convertImageToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeImage = useCallback(async (imageData?: Blob | string) => {
    setIsAnalyzing(true);
    stopCamera();

    try {
      // Get the first real pet if 'all' is selected
      const realPets = pets.filter(p => p.id !== 'all');
      const petId = selectedPet === 'all' ? realPets[0]?.id : selectedPet;
      
      if (!petId || petId === 'all') {
        throw new Error('لطفاً یک حیوان خانگی انتخاب کنید');
      }

      let imageBase64 = '';
      if (imageData instanceof Blob) {
        imageBase64 = await convertImageToBase64(imageData);
      }

      const analysisRequest = {
        petId,
        type: 'detailed' as const,
        inputMethod: 'camera' as const,
        inputData: {
          imageBase64,
          productName: '',
          brand: ''
        },
      };
       
      const response = await apiClient.analyzeFood(analysisRequest);
       
      if (response.error) {
        throw new Error(response.error.message);
      }
       
      const result = response.data as unknown as { analysis?: { analysisResult?: Record<string, unknown>; inputData?: Record<string, unknown> } };
      console.log('Frontend received analysis result:', JSON.stringify(result, null, 2));
      
      // The API returns { analysis: savedAnalysis } where savedAnalysis.analysisResult contains the AI output
      const aiResult = result?.analysis?.analysisResult as Record<string, unknown> || {};
      console.log('AI Result extracted:', JSON.stringify(aiResult, null, 2));

      const scanResult: ScanResult = {
        id: Date.now().toString(),
        type: 'image',
        productName: (aiResult?.productName as string) || (result?.analysis?.inputData?.productName as string) || 'محصول ناشناخته',
        brand: (aiResult?.brand as string) || (result?.analysis?.inputData?.brand as string) || 'برند ناشناخته',
        ingredients: (aiResult?.ingredients as string[]) || [],
        nutritionalInfo: {
          protein: ((aiResult?.nutritionalAnalysis as Record<string, unknown>)?.protein as number) || ((aiResult?.nutrition as Record<string, unknown>)?.protein as number) || 0,
          fat: ((aiResult?.nutritionalAnalysis as Record<string, unknown>)?.fat as number) || ((aiResult?.nutrition as Record<string, unknown>)?.fat as number) || 0,
          carbs: ((aiResult?.nutritionalAnalysis as Record<string, unknown>)?.carbohydrates as number) || ((aiResult?.nutrition as Record<string, unknown>)?.carbs as number) || 0,
          fiber: ((aiResult?.nutritionalAnalysis as Record<string, unknown>)?.fiber as number) || ((aiResult?.nutrition as Record<string, unknown>)?.fiber as number) || 0,
          calories: ((aiResult?.nutritionalAnalysis as Record<string, unknown>)?.calories as number) || ((aiResult?.nutrition as Record<string, unknown>)?.calories as number) || 0,
        },
        safetyScore: (aiResult?.overallScore as number) || (aiResult?.score as number) || 0,
        warnings: (aiResult?.warnings as string[]) || [],
        recommendations: (aiResult?.recommendations as string[]) || [],
        petCompatibility: {
          dogs: ((aiResult?.petCompatibility as Record<string, unknown>)?.dogs as 'safe' | 'caution' | 'dangerous') || (aiResult?.suitability ? 'safe' : 'caution'),
          cats: ((aiResult?.petCompatibility as Record<string, unknown>)?.cats as 'safe' | 'caution' | 'dangerous') || (aiResult?.suitability ? 'safe' : 'caution'),
        },
        timestamp: new Date(),
      };

      setScanResult(scanResult);
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('خطا در تحلیل تصویر: ' + (error instanceof Error ? error.message : 'خطای نامشخص'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [stopCamera, selectedPet, pets]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    // Convert to blob and analyze
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          await analyzeImage(blob);
        }
      },
      'image/jpeg',
      0.8
    );
  }, [analyzeImage]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await analyzeImage(file);
      }
    },
    [analyzeImage]
  );

  const resetScan = () => {
    setScanResult(null);
    setIsAnalyzing(false);
    stopCamera();
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-success-600';
    if (score >= 60) return 'text-warning-600';
    return 'text-error-600';
  };

  const getSafetyBadge = (score: number) => {
    if (score >= 80) return { variant: 'success' as const, text: 'امن' };
    if (score >= 60) return { variant: 'warning' as const, text: 'احتیاط' };
    return { variant: 'error' as const, text: 'خطرناک' };
  };

  const getCompatibilityBadge = (status: 'safe' | 'caution' | 'dangerous') => {
    switch (status) {
      case 'safe':
        return { variant: 'success' as const, text: 'امن' };
      case 'caution':
        return { variant: 'warning' as const, text: 'احتیاط' };
      case 'dangerous':
        return { variant: 'error' as const, text: 'خطرناک' };
    }
  };

  if (scanResult) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-h1 font-bold text-text-primary persian-heading">
                  نتیجه تحلیل
                </h1>
                <p className="text-text-secondary persian-body mt-1">
                  تحلیل کامل محصول غذایی
                </p>
              </div>
              <Button variant="outline" onClick={resetScan}>
                اسکن جدید
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Product Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl persian-heading">
                          {scanResult.productName}
                        </CardTitle>
                        {scanResult.brand && (
                          <CardDescription className="persian-body">
                            برند: {scanResult.brand}
                          </CardDescription>
                        )}
                      </div>
                      <Badge {...getSafetyBadge(scanResult.safetyScore)}>
                        {getSafetyBadge(scanResult.safetyScore).text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-center">
                        <div
                          className={cn(
                            'text-3xl font-bold',
                            getSafetyColor(scanResult.safetyScore)
                          )}
                        >
                          {scanResult.safetyScore}
                        </div>
                        <div className="text-sm text-text-secondary persian-body">
                          امتیاز امنیت
                        </div>
                      </div>
                      <div className="flex-1 bg-background-secondary rounded-full h-3">
                        <div
                          className={cn(
                            'h-3 rounded-full transition-all duration-500',
                            scanResult.safetyScore >= 80
                              ? 'bg-success-500'
                              : scanResult.safetyScore >= 60
                                ? 'bg-warning-500'
                                : 'bg-error-500'
                          )}
                          style={{ width: `${scanResult.safetyScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-text-primary persian-body mb-3">
                          اطلاعات تغذیه‌ای (در 100 گرم)
                        </h3>
                        <div className="space-y-2">
                          {[
                            {
                              label: 'پروتئین',
                              value: `${scanResult.nutritionalInfo.protein}%`,
                              color: 'bg-blue-500',
                            },
                            {
                              label: 'چربی',
                              value: `${scanResult.nutritionalInfo.fat}%`,
                              color: 'bg-yellow-500',
                            },
                            {
                              label: 'کربوهیدرات',
                              value: `${scanResult.nutritionalInfo.carbs}%`,
                              color: 'bg-green-500',
                            },
                            {
                              label: 'فیبر',
                              value: `${scanResult.nutritionalInfo.fiber}%`,
                              color: 'bg-purple-500',
                            },
                            {
                              label: 'کالری',
                              value: `${scanResult.nutritionalInfo.calories}`,
                              color: 'bg-red-500',
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    'w-3 h-3 rounded-full',
                                    item.color
                                  )}
                                />
                                <span className="text-sm text-text-secondary persian-body">
                                  {item.label}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-text-primary persian-body">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-text-primary persian-body mb-3">
                          سازگاری با حیوانات
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary persian-body">
                              سگ‌ها
                            </span>
                            <Badge
                              {...getCompatibilityBadge(
                                scanResult.petCompatibility.dogs
                              )}
                            >
                              {
                                getCompatibilityBadge(
                                  scanResult.petCompatibility.dogs
                                ).text
                              }
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary persian-body">
                              گربه‌ها
                            </span>
                            <Badge
                              {...getCompatibilityBadge(
                                scanResult.petCompatibility.cats
                              )}
                            >
                              {
                                getCompatibilityBadge(
                                  scanResult.petCompatibility.cats
                                ).text
                              }
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ingredients */}
                <Card variant="outlined">
                  <CardHeader>
                    <CardTitle className="text-lg persian-body">
                      ترکیبات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.ingredients.map((ingredient, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="persian-body"
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Warnings & Recommendations */}
              <div className="space-y-6">
                {scanResult.warnings.length > 0 && (
                  <Card variant="outlined">
                    <CardHeader>
                      <CardTitle className="text-lg persian-body text-warning-600">
                        ⚠️ هشدارها
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {scanResult.warnings.map((warning, index) => (
                          <li
                            key={index}
                            className="text-sm text-text-secondary persian-body"
                          >
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card variant="outlined">
                  <CardHeader>
                    <CardTitle className="text-lg persian-body text-success-600">
                      💡 توصیه‌ها
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scanResult.recommendations.map(
                        (recommendation, index) => (
                          <li
                            key={index}
                            className="text-sm text-text-secondary persian-body"
                          >
                            • {recommendation}
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Button className="w-full">ذخیره در تاریخچه</Button>
                  <Button variant="outline" className="w-full">
                    اشتراک‌گذاری نتیجه
                  </Button>
                </div>
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
              اسکن غذا
            </h1>
            <p className="text-text-secondary persian-body mt-2">
              غذای حیوان خانگی خود را اسکن کنید و تحلیل کامل دریافت کنید
            </p>
          </div>

          {/* Pet Selection */}
          <Card variant="outlined" className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-text-primary persian-body">
                  تحلیل برای:
                </span>
                <div className="flex gap-2">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm transition-colors persian-body',
                        selectedPet === pet.id
                          ? 'bg-primary-100 text-primary-700 border border-primary-200'
                          : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
                      )}
                    >
                      {pet.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scan Mode Selection */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card
              variant={scanMode === 'camera' ? 'elevated' : 'outlined'}
              className={cn(
                'cursor-pointer transition-all',
                scanMode === 'camera' && 'ring-2 ring-primary-200'
              )}
              onClick={() => setScanMode('camera')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-primary-600"
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
                <h3 className="font-medium text-text-primary persian-body mb-1">
                  عکس‌برداری
                </h3>
                <p className="text-sm text-text-secondary persian-body">
                  از محصول عکس بگیرید
                </p>
              </CardContent>
            </Card>

            <Card
              variant={scanMode === 'upload' ? 'elevated' : 'outlined'}
              className={cn(
                'cursor-pointer transition-all',
                scanMode === 'upload' && 'ring-2 ring-primary-200'
              )}
              onClick={() => setScanMode('upload')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-text-primary persian-body mb-1">
                  آپلود تصویر
                </h3>
                <p className="text-sm text-text-secondary persian-body">
                  تصویر از گالری انتخاب کنید
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Scan Interface */}
          <Card variant="elevated">
            <CardContent className="p-6">
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary-600 animate-spin"
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
                  </div>
                  <h3 className="text-lg font-medium text-text-primary persian-heading mb-2">
                    در حال تحلیل...
                  </h3>
                  <p className="text-text-secondary persian-body">
                    لطفاً صبر کنید، تحلیل محصول در حال انجام است
                  </p>
                </div>
              ) : scanMode === 'camera' ? (
                <div className="text-center">
                  {isScanning ? (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md mx-auto rounded-lg"
                      />
                      <div className="flex gap-3 justify-center">
                        <Button onClick={captureImage} size="lg">
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
                          </svg>
                          عکس‌برداری
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          لغو
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12">
                      <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-text-primary persian-heading mb-2">
                        دوربین را روشن کنید
                      </h3>
                      <p className="text-text-secondary persian-body mb-6">
                        برای شروع عکس‌برداری از محصول، دوربین را فعال کنید
                      </p>
                      <Button onClick={startCamera} size="lg">
                        روشن کردن دوربین
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-text-primary persian-heading mb-2">
                    انتخاب تصویر
                  </h3>
                  <p className="text-text-secondary persian-body mb-6">
                    تصویر محصول را از گالری انتخاب کنید
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                  >
                    انتخاب تصویر
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
