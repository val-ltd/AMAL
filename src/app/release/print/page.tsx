
'use client';

import { Suspense } from "react";
import { ReleaseMemo } from "@/components/release/release-memo";
import { getFundAccount, getRequest } from "@/lib/data";
import { BudgetRequest, FundAccount } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const groupRequestsByLembaga = (requests: BudgetRequest[]) => {
  return requests.reduce((acc, request) => {
    const key = request.institution || 'Lainnya';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(request);
    return acc;
  }, {} as Record<string, BudgetRequest[]>);
};

function PrintPageContent() {
    const searchParams = useSearchParams();
    const [requests, setRequests] = useState<BudgetRequest[]>([]);
    const [fundAccount, setFundAccount] = useState<FundAccount | null>(null);
    const [loading, setLoading] = useState(true);

    const fundAccountId = searchParams.get('fundAccountId');
    const requestIdsParam = searchParams.get('requestIds');
    const requestIds = requestIdsParam ? requestIdsParam.split(',') : [];

    useEffect(() => {
        const fetchData = async () => {
            if (!fundAccountId || requestIds.length === 0) {
                setLoading(false);
                return;
            }
            try {
                const [account, ...fetchedRequests] = await Promise.all([
                    getFundAccount(fundAccountId),
                    ...requestIds.map(id => getRequest(id))
                ]);
                setFundAccount(account);
                setRequests(fetchedRequests.filter(Boolean) as BudgetRequest[]);
            } catch (err) {
                console.error("Failed to fetch print data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fundAccountId, requestIdsParam]); // Effect depends on the joined string of IDs

    if (loading) {
        return <PrintPageSkeleton />;
    }

    if (!fundAccount || requests.length === 0) {
        return <p className="text-center p-8">Gagal memuat data atau tidak ada data yang dipilih.</p>;
    }

    const groupedRequests = groupRequestsByLembaga(requests);
    const memoCount = Object.keys(groupedRequests).length;

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 sm:p-8 print:p-0 print-container">
            <div className="flex justify-end gap-2 mb-4 no-print">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Halaman Ini ({memoCount} Memo)
                </Button>
            </div>
            <div className="space-y-8 print:space-y-0">
                {Object.entries(groupedRequests).map(([lembaga, reqs]) => (
                    reqs.length > 0 && (
                        <div key={lembaga} className="memo-wrapper bg-white">
                            <ReleaseMemo requests={reqs} lembaga={lembaga} fundAccount={fundAccount} />
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<PrintPageSkeleton />}>
        <PrintPageContent />
    </Suspense>
  )
}

function PrintPageSkeleton() {
    return (
        <div className="p-8">
            <div className="flex justify-end mb-4">
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="bg-white p-8 space-y-6 shadow-md">
                <div className="flex justify-between items-center border-b-4 border-black pb-4">
                    <Skeleton className="h-20 w-20" />
                    <div className="text-center space-y-2">
                        <Skeleton className="h-6 w-96" />
                        <Skeleton className="h-5 w-72" />
                    </div>
                    <Skeleton className="h-12 w-32" />
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
