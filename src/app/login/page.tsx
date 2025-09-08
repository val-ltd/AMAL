
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { signInWithGoogle, loading, user, isVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && isVerified) {
      router.push('/');
    }
  }, [loading, user, isVerified, router]);

  // Prevent flicker of the login form while redirecting
  if (loading || (user && isVerified)) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle>Selamat Datang Kembali</CardTitle>
          <CardDescription>Masuk untuk mengakses dasbor Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signInWithGoogle} className="w-full" disabled={loading}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.4 76.4c-24.1-23.4-58.2-37.5-96.5-37.5-69.1 0-125.4 56.2-125.4 125.4s56.3 125.4 125.4 125.4c77.7 0 113.8-51.4 118.8-78.5H248V261.8h239.2z"></path>
            </svg>
            Masuk dengan Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
