
'use client'

import RequestList from "@/components/request-list";
import { getPendingRequests } from "@/lib/data";
import { BudgetRequest } from "@/lib/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function ManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userRole = user?.profile?.role;
  const isAuthorized = userRole === 'Manager' || userRole === 'Admin' || userRole === 'Super Admin';

  useEffect(() => {
    if (!authLoading && user && isAuthorized) {
        setLoading(true);
        const unsubscribe = getPendingRequests((fetchedRequests) => {
            setRequests(fetchedRequests);
            setLoading(false);
        });
        // Cleanup subscription on component unmount
        return () => unsubscribe();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, isAuthorized]);

  if (authLoading || loading) {
     return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold tracking-tight">Persetujuan Tertunda</h1>
            <RequestListSkeleton />
        </div>
     )
  }

  if (!isAuthorized) {
    return (
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Akses Ditolak</AlertTitle>
            <AlertDescription>
                Anda tidak memiliki izin untuk melihat halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan Tertunda</h1>
      </div>
      <RequestList requests={requests} isManagerView />
    </div>
  );
}

function RequestListSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
        </div>
    )
}
