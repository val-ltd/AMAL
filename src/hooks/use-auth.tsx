
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

interface AppUser extends FirebaseUser {
    profile?: User;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isVerified: boolean | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    let unsubscribeSnapshot: Unsubscribe | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous snapshot listener if it exists
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use a snapshot listener for real-time profile updates (e.g., verification by admin)
        unsubscribeSnapshot = onSnapshot(userDocRef, async (userDoc) => {
          if (!userDoc.exists()) {
            try {
              const newUserProfile: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Anonymous User',
                email: firebaseUser.email!,
                avatarUrl: firebaseUser.photoURL || '',
                roles: ['Employee'],
                isVerified: false,
                isDeleted: false,
              };
              await setDoc(userDocRef, newUserProfile);
              setUser({ ...firebaseUser, profile: newUserProfile });
              setIsVerified(false);
            } catch (error) {
              console.error("Error creating user document:", error);
            }
          } else {
            const userProfile = userDoc.data() as User;
            setUser({ ...firebaseUser, profile: userProfile });
            setIsVerified(userProfile.isVerified ?? false);
          }
          setLoading(false);
        }, (error) => {
            console.error("Snapshot listener error:", error);
            setUser(null);
            setIsVerified(null);
            setLoading(false);
        });

      } else {
        setUser(null);
        setIsVerified(null);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
        }
    };
  }, []);


  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);


  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the user state update
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const value = { user, loading, signInWithGoogle, logout, isVerified };
  
  if (loading) {
      return (
          <div className="flex flex-col min-h-screen">
              <header className="sticky top-0 z-10 hidden items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:flex h-16">
                  <Skeleton className="h-8 w-32" />
                  <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-10 w-40" />
                  </div>
              </header>
              <main className="flex-1 p-4 sm:p-6">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/4" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
              </main>
          </div>
      );
  }

  // If user is logged in but not verified, show a warning page.
  // Exception for login page.
  if (user && !isVerified && pathname !== '/login') {
    return (
        <AuthContext.Provider value={value}>
            <AppShell>
                <div className="flex items-center justify-center h-full">
                    <Alert variant="destructive" className="max-w-lg">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Akun Belum Diverifikasi</AlertTitle>
                        <AlertDescription>
                            Akun Anda sedang menunggu verifikasi oleh administrator. Silakan hubungi admin untuk mengaktifkan akun Anda.
                        </AlertDescription>
                    </Alert>
                </div>
            </AppShell>
        </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
