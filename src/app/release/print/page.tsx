
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { getDocs, collection, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BudgetRequest, FundAccount } from '@/lib/types';
import { ReleaseMemo } from '@/components/release/release-memo';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown, Printer, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFundAccount } from '@/lib/data';

// Group requests by Lembaga
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
    const [groupedRequests, setGroupedRequests] = useState<Record<string, BudgetRequest[]> | null>(null);
    const [fundAccount, setFundAccount] = useState<FundAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            const idsParam = searchParams.get('ids');
            const fundSourceId = searchParams.get('fundSourceId');

            if (!idsParam) {
                setError('Tidak ada ID permintaan yang diberikan.');
                setLoading(false);
                return;
            }
            if (!fundSourceId) {
                setError('Tidak ada sumber dana yang dipilih.');
                setLoading(false);
                return;
            }

            const requestIds = idsParam.split(',');
            
            if (requestIds.length === 0) {
                 setError('Daftar ID permintaan kosong.');
                 setLoading(false);
                 return;
            }

            try {
                const [fundSource] = await Promise.all([getFundAccount(fundSourceId)]);
                
                if (!fundSource) {
                  setError('Sumber dana yang dipilih tidak ditemukan.');
                  setLoading(false);
                  return;
                }
                setFundAccount(fundSource);

                const requests: BudgetRequest[] = [];
                // Firestore 'in' query is limited to 30 elements. We need to batch the requests.
                const idBatches: string[][] = [];
                for (let i = 0; i < requestIds.length; i += 30) {
                    idBatches.push(requestIds.slice(i, i + 30));
                }

                for (const batch of idBatches) {
                    const q = query(collection(db, 'requests'), where(documentId(), 'in', batch));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        requests.push({
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
                            updatedAt: data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
                        } as BudgetRequest);
                    });
                }
                
                if(requests.length !== requestIds.length) {
                    console.warn("Could not find all requests. Found:", requests.length, "Expected:", requestIds.length);
                }
                
                if (requests.length === 0) {
                    setError('Tidak ada permintaan yang valid ditemukan untuk ID yang diberikan.');
                    setLoading(false);
                    return;
                }

                const grouped = groupRequestsByLembaga(requests);
                setGroupedRequests(grouped);
            } catch (err) {
                console.error(err);
                setError('Gagal mengambil data permintaan.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="p-8 space-y-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                 <Alert variant="destructive" className="max-w-lg">
                    <FileWarning className="h-4 w-4" />
                    <AlertTitle>Terjadi Kesalahan</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!groupedRequests || Object.keys(groupedRequests).length === 0 || !fundAccount) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Frown className="w-16 h-16 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">Tidak Ada Memo untuk Ditampilkan</h1>
                <p className="text-muted-foreground">Tidak dapat menghasilkan memo dari permintaan yang dipilih.</p>
            </div>
        )
    }
    
    const memoCount = Object.keys(groupedRequests).length;

    return (
      <div className="bg-gray-200 p-8">
        <div className="fixed top-4 right-4 no-print z-50">
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Halaman Ini ({memoCount} Memo)
            </Button>
        </div>
        <div className="space-y-8">
          {Object.entries(groupedRequests).map(([lembaga, requests]) => (
            requests.length > 0 && (
                <div key={lembaga} className="bg-white shadow-lg">
                  <ReleaseMemo requests={requests} lembaga={lembaga} fundAccount={fundAccount} />
                </div>
            )
          ))}
        </div>
      </div>
    );
}


export default function PrintReleasePage() {
    return (
        // Suspense is required to use useSearchParams()
        <Suspense fallback={<p className="p-8">Memuat...</p>}>
            <PrintPageContent />
        </Suspense>
    )
}
