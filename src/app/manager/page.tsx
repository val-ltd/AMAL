
'use client'

import RequestList from "@/components/request-list";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BudgetRequest } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userRoles = user?.profile?.roles;
  const isAuthorized = userRoles?.includes('Manager') || userRoles?.includes('Admin') || userRoles?.includes('Super Admin');

  useEffect(() => {
    let unsubscribe: () => void;
    if (!authLoading && user && isAuthorized) {
        setLoading(true);
        const q = query(
            collection(db, 'requests'),
            where('supervisor.id', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRequests: BudgetRequest[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedRequests.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
                } as BudgetRequest);
            });
            setRequests(fetchedRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching manager requests:", error);
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
  }, [user, authLoading, isAuthorized]);

  const filteredRequests = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending');
    const approved = requests.filter(r => r.status === 'approved' || r.status === 'released' || r.status === 'completed');
    const rejected = requests.filter(r => r.status === 'rejected');
    return { pending, approved, rejected };
  }, [requests]);

  if (authLoading || (loading && isAuthorized)) {
     return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold tracking-tight">Persetujuan</h1>
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
        <h1 className="text-3xl font-bold tracking-tight">Daftar Pengajuan</h1>
      </div>

       <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Menunggu ({filteredRequests.pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Disetujui ({filteredRequests.approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak ({filteredRequests.rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <RequestList requests={filteredRequests.pending} isManagerView />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <RequestList requests={filteredRequests.approved} isManagerView />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <RequestList requests={filteredRequests.rejected} isManagerView />
        </TabsContent>
      </Tabs>
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
