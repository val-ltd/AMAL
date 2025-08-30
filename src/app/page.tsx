
'use client'

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { getMyRequests } from "@/lib/data"
import RequestList from "@/components/request-list"
import { useEffect, useState } from "react"
import { BudgetRequest } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      const unsubscribe = getMyRequests((fetchedRequests) => {
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
        <h1 className="text-3xl font-bold tracking-tight">Permintaan Saya</h1>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/request/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Permintaan Baru
          </Link>
        </Button>
      </div>

      {loading ? <RequestListSkeleton /> : <RequestList requests={requests} />}
    </div>
  )
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
