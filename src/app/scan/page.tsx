'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { AuthGuard } from '@/components/auth/auth-guard';
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
import html2canvas from 'html2canvas';

interface ScanResult {
  id: string;
  type: 'image';
  productName: string;
  brand?: string;
  summary?: string;
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
  const resultsRef = useRef<HTMLDivElement>(null);

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
        productName: (() => {
          // Extract product name from summary if available
          const summary = aiResult?.summary as string;
          if (summary && summary.includes('Royal Canin')) {
            // Extract product name from summary
            const match = summary.match(/غذای\s+([^\s]+(?:\s+[^\s]+)*?)\s+برای/);
            if (match) return match[1];
          }
          
          // Check multiple possible locations for product name
          if (aiResult?.productName) return aiResult.productName as string;
          if (result?.analysis?.inputData?.productName) return result.analysis.inputData.productName as string;
          
          // Check OCR productInfo
          const ocrResult = aiResult?.ocrResult as Record<string, unknown>;
          if (ocrResult?.productInfo) {
            const productInfo = ocrResult.productInfo as Record<string, unknown>;
            if (productInfo.productName) return productInfo.productName as string;
          }
          
          // Check if product name is in the summary text
          if (summary) {
            const productMatch = summary.match(/([A-Za-z\s]+(?:Veterinary|Diet|Pro|Premium)[A-Za-z\s]*)/i);
            if (productMatch) return productMatch[1].trim();
          }
          
          return 'محصول ناشناخته';
        })(),
        brand: (() => {
          // Extract brand from summary if available
          const summary = aiResult?.summary as string;
          if (summary) {
            if (summary.includes('Royal Canin')) return 'Royal Canin';
            if (summary.includes('Hill\'s')) return 'Hill\'s';
            if (summary.includes('Purina')) return 'Purina';
            if (summary.includes('Whiskas')) return 'Whiskas';
            if (summary.includes('Pedigree')) return 'Pedigree';
          }
          
          // Check multiple possible locations for brand
          if (aiResult?.brand) return aiResult.brand as string;
          if (result?.analysis?.inputData?.brand) return result.analysis.inputData.brand as string;
          
          // Check OCR productInfo
          const ocrResult = aiResult?.ocrResult as Record<string, unknown>;
          if (ocrResult?.productInfo) {
            const productInfo = ocrResult.productInfo as Record<string, unknown>;
            if (productInfo.brand) return productInfo.brand as string;
          }
          
          return 'برند ناشناخته';
        })(),
        summary: aiResult?.summary as string || undefined,
        ingredients: (() => {
          // Check multiple possible locations for ingredients
          if (Array.isArray(aiResult?.ingredients)) {
            return aiResult.ingredients as string[];
          }
          // Check ingredientAnalysis.mainIngredients
          const ingredientAnalysis = aiResult?.ingredientAnalysis as Record<string, unknown>;
          if (ingredientAnalysis?.mainIngredients && Array.isArray(ingredientAnalysis.mainIngredients)) {
            return ingredientAnalysis.mainIngredients as string[];
          }
          // Check webData.ingredients
          const webData = aiResult?.webData as Record<string, unknown>;
          if (webData?.ingredients && Array.isArray(webData.ingredients)) {
            return webData.ingredients as string[];
          }
          return [];
        })(),
        nutritionalInfo: (() => {
          const nutritionalAnalysis = aiResult?.nutritionalAnalysis as Record<string, unknown>;
          
          // Helper function to extract percentage value
          const extractPercentage = (data: Record<string, unknown> | undefined): number => {
            if (data && typeof data.value === 'string') {
              const value = data.value;
              // Skip placeholder values like X%, Y%, Z%, W%
              if (value.match(/^[A-Z]%$/)) {
                return 0;
              }
              const numericValue = parseFloat(value.replace('%', '').replace('٪', ''));
              return isNaN(numericValue) ? 0 : numericValue;
            }
            return 0;
          };
          
          // Extract nutritional values
          const protein = extractPercentage(nutritionalAnalysis?.protein as Record<string, unknown>);
          const fat = extractPercentage(nutritionalAnalysis?.fat as Record<string, unknown>);
          const fiber = extractPercentage(nutritionalAnalysis?.fiber as Record<string, unknown>);
          const moisture = extractPercentage(nutritionalAnalysis?.moisture as Record<string, unknown>);
          
          // Calculate carbohydrates using the formula: Carbs (%) = 100 − (Protein% + Fat% + Moisture% + Ash% + Fiber%)
          // Assuming ash is typically 5-8% for pet food if not provided
          const ash = 6; // Default ash percentage
          const carbs = Math.max(0, 100 - (protein + fat + moisture + ash + fiber));
          
          // Extract calories
          const caloriesData = nutritionalAnalysis?.calories as Record<string, unknown>;
          let calories = 0;
          if (caloriesData && typeof caloriesData.value === 'string') {
            calories = parseFloat(caloriesData.value.replace(/[^0-9.]/g, '')) || 0;
          }
          
          return {
            protein,
            fat,
            carbs,
            fiber,
            calories,
          };
        })(),
        safetyScore: (aiResult?.overallScore as number) || (aiResult?.score as number) || 0,
        warnings: (() => {
          const warnings = aiResult?.warnings as string[] | undefined;
          if (Array.isArray(warnings)) {
            return warnings;
          }
          // Check if warnings are in recommendations object
          const recs = aiResult?.recommendations as Record<string, unknown> | undefined;
          if (recs && typeof recs === 'object' && Array.isArray(recs.warnings)) {
            return recs.warnings as string[];
          }
          // Check ingredient analysis concerns
          const ingredientAnalysis = aiResult?.ingredientAnalysis as Record<string, unknown> | undefined;
          if (ingredientAnalysis && Array.isArray(ingredientAnalysis.concerns)) {
            return ingredientAnalysis.concerns as string[];
          }
          return [];
        })(),
        recommendations: (() => {
          const recs = aiResult?.recommendations as string[] | Record<string, unknown> | undefined;
          if (Array.isArray(recs)) {
            return recs;
          }
          if (recs && typeof recs === 'object') {
            const recommendations: string[] = [];
            if (recs.feedingAdvice && typeof recs.feedingAdvice === 'string') {
              recommendations.push(recs.feedingAdvice);
            }
            if (recs.alternatives && Array.isArray(recs.alternatives)) {
              recommendations.push(...recs.alternatives.map((alt: string) => `جایگزین: ${alt}`));
            }
            if (recs.warnings && Array.isArray(recs.warnings)) {
              recommendations.push(...recs.warnings.map((warn: string) => `⚠️ ${warn}`));
            }
            return recommendations;
          }
          return [];
        })(),
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
    setIsScanning(false);
  };

  // Save scan to history
  const saveToHistory = async () => {
    if (!scanResult) return;
    
    try {
      // Create a proper save request to the backend
      const saveData = {
        type: 'detailed' as const,
        inputMethod: 'camera' as const,
        inputData: {
          productName: scanResult.productName,
          brand: scanResult.brand || '',
          text: `Product: ${scanResult.productName}\nIngredients: ${scanResult.ingredients.join(', ')}`
        },
        analysisResult: {
          overallScore: scanResult.safetyScore,
          summary: scanResult.summary,
          ingredients: scanResult.ingredients,
          warnings: scanResult.warnings,
          recommendations: scanResult.recommendations,
          nutritionalInfo: scanResult.nutritionalInfo,
          petCompatibility: scanResult.petCompatibility
        }
      };

      const response = await apiClient.saveAnalysisToHistory(saveData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      alert('نتیجه با موفقیت در تاریخچه ذخیره شد!');
    } catch (error) {
      console.error('Error saving to history:', error);
      alert('خطا در ذخیره‌سازی در تاریخچه');
    }
  };

  // Share scan result
  const shareResult = async () => {
    if (!scanResult) return;
    
    try {
      // Take screenshot of results
      let screenshotBlob: Blob | null = null;
      if (resultsRef.current) {
        try {
          const canvas = await html2canvas(resultsRef.current, {
             background: '#ffffff',
             useCORS: true,
             allowTaint: true
           });
          
          screenshotBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob!);
            }, 'image/png', 0.9);
          });
        } catch (screenshotError) {
          console.warn('Screenshot failed:', screenshotError);
        }
      }
      
      const shareData = {
        title: `تحلیل غذای ${scanResult.productName}`,
        text: `امتیاز ایمنی: ${scanResult.safetyScore}/100\n${scanResult.summary || 'تحلیل کامل محصول غذایی'}`,
        url: window.location.href,
        ...(screenshotBlob && { files: [new File([screenshotBlob], 'scan-result.png', { type: 'image/png' })] })
      };
      
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard or download screenshot
        if (screenshotBlob) {
          const url = URL.createObjectURL(screenshotBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `تحلیل-غذا-${scanResult.productName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('تصویر نتیجه دانلود شد!');
        } else {
          const textToShare = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
          await navigator.clipboard.writeText(textToShare);
          alert('نتیجه در کلیپ‌بورد کپی شد!');
        }
      }
    } catch (error) {
      console.error('Error sharing result:', error);
      alert('خطا در اشتراک‌گذاری نتیجه');
    }
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
      <AuthGuard>
        <MainLayout>
        <div className="min-h-screen bg-background-primary p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto" ref={resultsRef}>
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

                    {/* AI Summary Section */}
                    {scanResult.summary && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-text-primary persian-heading mb-3">
                          خلاصه تحلیل هوش مصنوعی
                        </h3>
                        <div className="bg-background-secondary rounded-lg p-4">
                          <p className="text-text-secondary persian-body leading-relaxed">
                            {scanResult.summary}
                          </p>
                        </div>
                      </div>
                    )}

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
                  <Button className="w-full" onClick={saveToHistory}>
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
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    ذخیره در تاریخچه
                  </Button>
                  <Button variant="outline" className="w-full" onClick={shareResult}>
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    اشتراک‌گذاری نتیجه
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
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
    </AuthGuard>
  );
}
