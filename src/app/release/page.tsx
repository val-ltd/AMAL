
'use client'

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getApprovedUnreleasedRequests } from "@/lib/data";
import type { BudgetRequest, Department } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, ShieldAlert } from "lucide-react";
import { ReleaseMemo } from "@/components/release/release-memo";

// Helper to group requests by department
const groupRequestsByDepartment = (requests: BudgetRequest[]) => {
  return requests.reduce((acc, request) => {
    // Create a consistent key for grouping
    const key = request.department 
      ? [request.department.lembaga, request.department.divisi, request.department.bagian, request.department.unit].filter(Boolean).join(' / ')
      : `${request.institution} / ${request.division}`;
      
    if (!acc[key]) {
      acc[key] = {
        department: request.department || { lembaga: request.institution, divisi: request.division, id: 'legacy' },
        requests: []
      };
    }
    acc[key].requests.push(request);
    return acc;
  }, {} as Record<string, { department: Department, requests: BudgetRequest[] }>);
};

export default function ReleasePage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const userRoles = user?.profile?.roles;
  const isAuthorized = userRoles?.includes('Releaser') || userRoles?.includes('Admin') || userRoles?.includes('Super Admin');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isAuthorized) {
      setLoading(true);
      unsubscribe = getApprovedUnreleasedRequests((fetchedRequests) => {
        setRequests(fetchedRequests);
        setLoading(false);
      });
    } else if (!authLoading) {
      setLoading(false);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthorized, authLoading]);

  const groupedRequests = useMemo(() => groupRequestsByDepartment(requests), [requests]);

  if (authLoading || (loading && isAuthorized)) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Pencairan Dana</h1>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Akses Ditolak</AlertTitle>
            <AlertDescription>
                Anda tidak memiliki izin untuk melihat halaman ini. Hanya Releaser, Admin, dan Super Admin yang dapat mengakses.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-3xl font-bold tracking-tight">Pencairan Dana</h1>
      </div>
      
      {Object.keys(groupedRequests).length === 0 ? (
         <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-medium">Semua Permintaan Sudah Dicairkan</h3>
            <p className="text-muted-foreground">
                Tidak ada permintaan yang disetujui dan menunggu untuk dicairkan saat ini.
            </p>
        </div>
      ) : (
        Object.entries(groupedRequests).map(([key, group]) => (
            <ReleaseMemo key={key} department={group.department} requests={group.requests} />
        ))
      )}
    </div>
  );
}
