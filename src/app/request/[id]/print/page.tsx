
'use client';

import { Suspense } from "react";
import { ReleaseMemo } from "@/components/release/release-memo";
import { getFundAccount, getRequest } from "@/lib/data";
import { BudgetRequest, FundAccount } from "@/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function PrintPageContent() {
    const params = useParams();
    const requestId = params.id as string;
    
    const [request, setRequest] = useState<BudgetRequest | null>(null);
    const [fundAccount, setFundAccount] = useState<FundAccount | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!requestId) {
                setLoading(false);
                return;
            }
            try {
                const fetchedRequest = await getRequest(requestId);
                if (fetchedRequest && fetchedRequest.fundSourceId) {
                    const fetchedFundAccount = await getFundAccount(fetchedRequest.fundSourceId);
                    setRequest(fetchedRequest);
                    setFundAccount(fetchedFundAccount);
                } else if (fetchedRequest) {
                    setRequest(fetchedRequest);
                    console.warn("Request is missing fundSourceId");
                }
            } catch (err) {
                console.error("Failed to fetch print data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [requestId]);

    if (loading) {
        return <PrintPageSkeleton />;
    }

    if (!request || !fundAccount) {
        return <p className="text-center p-8">Gagal memuat data atau data tidak lengkap untuk mencetak memo.</p>;
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-800 print-container">
            <div className="flex justify-end gap-2 p-4 no-print fixed top-2 right-2">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Memo
                </Button>
            </div>
            <div className="space-y-8 print:space-y-0">
                <div className="memo-wrapper bg-white">
                    <ReleaseMemo requests={[request]} lembaga={request.institution} fundAccount={fundAccount} />
                </div>
            </div>
        </div>
    );
}

export default function PrintRequestPage() {
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
