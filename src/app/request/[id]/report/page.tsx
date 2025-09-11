
'use client';

import { getRequest } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { ReportForm } from "@/components/report-form";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import type { BudgetRequest } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function ReportPage() {
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const [request, setRequest] = useState<BudgetRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const id = params.id as string;

    useEffect(() => {
        if (id) {
            getRequest(id).then(fetchedRequest => {
                if (!fetchedRequest) {
                    notFound();
                    return;
                }
                setRequest(fetchedRequest);
                
                if (user && !authLoading) {
                    if (fetchedRequest.requester.id === user.uid) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                    }
                }
                setLoading(false);
            });
        }
    }, [id, user, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!request) {
        return notFound();
    }
    
    if (!isAuthorized) {
        return (
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Akses Ditolak</AlertTitle>
                <AlertDescription>
                    Anda tidak memiliki izin untuk membuat laporan untuk permintaan ini. Hanya pemohon yang dapat membuat laporan.
                </AlertDescription>
            </Alert>
        )
    }

    if (request.status !== 'released') {
        return (
            <div className="flex items-center justify-center h-full text-center">
                <Alert>
                    <AlertTitle>Laporan Belum Tersedia</AlertTitle>
                    <AlertDescription>
                        Hanya permintaan yang sudah dicairkan yang dapat dibuatkan laporannya.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <ReportForm request={request} />
    )
}
