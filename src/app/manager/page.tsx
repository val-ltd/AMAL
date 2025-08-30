
'use client'

import RequestList from "@/components/request-list";
import { getPendingRequests } from "@/lib/data";
import { BudgetRequest } from "@/lib/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading && user) {
        setLoading(true);
        const unsubscribe = getPendingRequests((fetchedRequests) => {
            setRequests(fetchedRequests);
            setLoading(false);
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }
  }, [user, authLoading]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan Tertunda</h1>
      </div>

      {loading ? <RequestListSkeleton /> : <RequestList requests={requests} isManagerView />}
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
