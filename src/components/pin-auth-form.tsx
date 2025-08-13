'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone } from 'lucide-react';

interface PinAuthFormProps {
  onSuccess?: () => void;
}

export function PinAuthForm({ onSuccess }: PinAuthFormProps) {
  const { loginWithPin, registerWithPin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');
  
  // Register form state
  const [registerIdentifier, setRegisterIdentifier] = useState('');
  const [registerPin, setRegisterPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');

  const validateIdentifier = (identifier: string, type: 'email' | 'phone'): boolean => {
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(identifier);
    } else {
      const phoneRegex = /^[\+]?[1-9][\d]{0,14}$/;
      return phoneRegex.test(identifier.replace(/\s/g, ''));
    }
  };

  const validatePin = (pin: string): boolean => {
    return /^\d{4,8}$/.test(pin);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateIdentifier(loginIdentifier, identifierType)) {
      setError(identifierType === 'email' ? 'ایمیل نامعتبر است' : 'شماره تلفن نامعتبر است');
      return;
    }

    if (!validatePin(loginPin)) {
      setError('رمز عبور باید بین ۴ تا ۸ رقم باشد');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithPin(loginIdentifier, loginPin);
      if (result.success) {
        setSuccess('ورود با موفقیت انجام شد');
        onSuccess?.();
      } else {
        setError(result.error || 'خطا در ورود');
      }
    } catch {
      setError('خطا در ورود');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateIdentifier(registerIdentifier, identifierType)) {
      setError(identifierType === 'email' ? 'ایمیل نامعتبر است' : 'شماره تلفن نامعتبر است');
      return;
    }

    if (!validatePin(registerPin)) {
      setError('رمز عبور باید بین ۴ تا ۸ رقم باشد');
      return;
    }

    if (registerPin !== confirmPin) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerWithPin(registerIdentifier, registerPin, displayName, city);
      if (result.success) {
        setSuccess('ثبت‌نام با موفقیت انجام شد. در حال انتقال...');
        // Clear register form
        setRegisterIdentifier('');
        setRegisterPin('');
        setConfirmPin('');
        setDisplayName('');
        setCity('');
        // Call onSuccess callback to redirect
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1000); // Small delay to show success message
        }
      } else {
        setError(result.error || 'خطا در ثبت‌نام');
      }
    } catch {
      setError('خطا در ثبت‌نام');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" dir="rtl">
      <CardHeader>
        <CardTitle className="text-center">ورود / ثبت‌نام</CardTitle>
        <CardDescription className="text-center">
          با ایمیل یا شماره تلفن و رمز عبور وارد شوید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">ورود</TabsTrigger>
            <TabsTrigger value="register">ثبت‌نام</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-type">نوع شناسه</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={identifierType === 'email' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setIdentifierType('email')}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 ml-2" />
                    ایمیل
                  </Button>
                  <Button
                    type="button"
                    variant={identifierType === 'phone' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setIdentifierType('phone')}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    تلفن
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-identifier">
                  {identifierType === 'email' ? 'ایمیل' : 'شماره تلفن'}
                </Label>
                <Input
                  id="login-identifier"
                  type={identifierType === 'email' ? 'email' : 'tel'}
                  placeholder={identifierType === 'email' ? 'example@email.com' : '+98 912 345 6789'}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-pin">رمز عبور (۴-۸ رقم)</Label>
                <Input
                  id="login-pin"
                  type="password"
                  placeholder="۱۲۳۴"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  required
                  maxLength={8}
                  dir="ltr"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                ورود
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-type">نوع شناسه</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={identifierType === 'email' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setIdentifierType('email')}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 ml-2" />
                    ایمیل
                  </Button>
                  <Button
                    type="button"
                    variant={identifierType === 'phone' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setIdentifierType('phone')}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    تلفن
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-identifier">
                  {identifierType === 'email' ? 'ایمیل' : 'شماره تلفن'}
                </Label>
                <Input
                  id="register-identifier"
                  type={identifierType === 'email' ? 'email' : 'tel'}
                  placeholder={identifierType === 'email' ? 'example@email.com' : '+98 912 345 6789'}
                  value={registerIdentifier}
                  onChange={(e) => setRegisterIdentifier(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display-name">نام نمایشی (اختیاری)</Label>
                <Input
                  id="display-name"
                  type="text"
                  placeholder="نام شما"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">شهر (اختیاری)</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="تهران"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-pin">رمز عبور (۴-۸ رقم)</Label>
                <Input
                  id="register-pin"
                  type="password"
                  placeholder="۱۲۳۴"
                  value={registerPin}
                  onChange={(e) => setRegisterPin(e.target.value)}
                  required
                  maxLength={8}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">تکرار رمز عبور</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  placeholder="۱۲۳۴"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  required
                  maxLength={8}
                  dir="ltr"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                ثبت‌نام
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mt-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}