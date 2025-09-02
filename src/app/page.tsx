
'use client'

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { getMyRequests } from "@/lib/data"
import RequestList from "@/components/request-list"
import { useEffect, useState, useMemo } from "react"
import { BudgetRequest } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import StatusBadge from "@/components/status-badge"

export default function EmployeeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;
    if (!authLoading && user) {
      setLoading(true);
      unsubscribe = getMyRequests((fetchedRequests) => {
        setRequests(fetchedRequests);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
        setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading]);
  
  const groupedRequests = useMemo(() => {
    return requests.reduce((acc, request) => {
      const status = request.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(request);
      return acc;
    }, {} as Record<BudgetRequest['status'], BudgetRequest[]>);
  }, [requests]);

  const accordionItems = [
    { status: 'pending', title: 'Tertunda' },
    { status: 'approved', title: 'Disetujui' },
    { status: 'rejected', title: 'Ditolak' },
    { status: 'released', title: 'Dicairkan' },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      {loading ? (
        <HeaderSkeleton />
      ) : (
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Permintaan Saya</h1>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/request/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Permintaan Baru
            </Link>
          </Button>
        </div>
      )}

      {loading ? (
        <RequestListSkeleton /> 
      ) : (
        <Accordion type="multiple" defaultValue={['pending', 'approved']} className="w-full space-y-4">
          {accordionItems.map(item => {
            const requestsForStatus = groupedRequests[item.status] || [];
            return (
              <AccordionItem value={item.status} key={item.status} className="border-none">
                <AccordionTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg shadow-sm hover:no-underline">
                  <div className="flex items-center gap-3">
                     <StatusBadge status={item.status} />
                     <span className="font-semibold">{item.title}</span>
                     <span className="text-sm text-muted-foreground">({requestsForStatus.length} permintaan)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  {requestsForStatus.length > 0 ? (
                    <RequestList requests={requestsForStatus} />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">Tidak ada permintaan dengan status ini.</div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  )
}

function HeaderSkeleton() {
    return (
        <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-36 hidden sm:inline-flex" />
        </div>
    )
}

function RequestListSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    )
}
