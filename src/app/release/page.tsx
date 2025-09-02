
'use client'

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getApprovedUnreleasedRequests } from "@/lib/data";
import type { BudgetRequest } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, ShieldAlert, FileText, Inbox } from "lucide-react";
import { ReleaseMemo } from "@/components/release/release-memo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

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

export default function ReleasePage() {
  const { user, loading: authLoading } = useAuth();
  const [allRequests, setAllRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [memosToGenerate, setMemosToGenerate] = useState<Record<string, BudgetRequest[]> | null>(null);

  const userRoles = user?.profile?.roles;
  const isAuthorized = userRoles?.includes('Releaser') || userRoles?.includes('Admin') || userRoles?.includes('Super Admin');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isAuthorized) {
      setLoading(true);
      unsubscribe = getApprovedUnreleasedRequests((fetchedRequests) => {
        setAllRequests(fetchedRequests);
        setLoading(false);
      });
    } else if (!authLoading) {
      setLoading(false);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthorized, authLoading]);

  const handleGenerateMemo = () => {
    const selectedRequests = allRequests.filter(req => selectedRequestIds.includes(req.id));
    const groupedByLembaga = groupRequestsByLembaga(selectedRequests);
    setMemosToGenerate(groupedByLembaga);
  };
  
  const handleSelectionChange = (requestId: string) => {
    setSelectedRequestIds(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(allRequests.map(req => req.id));
    } else {
      setSelectedRequestIds([]);
    }
  };

  if (authLoading || (loading && isAuthorized)) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Pencairan Dana</h1>
          <Skeleton className="h-10 w-48" />
        </div>
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
        <Button onClick={handleGenerateMemo} disabled={selectedRequestIds.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            Buat Memo untuk ({selectedRequestIds.length}) Permintaan Terpilih
        </Button>
      </div>

      <Card className="no-print">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12">
                        <Checkbox
                            checked={selectedRequestIds.length > 0 && selectedRequestIds.length === allRequests.length}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            aria-label="Pilih semua baris"
                        />
                    </TableHead>
                    <TableHead>Pemohon & Tanggal</TableHead>
                    <TableHead>Lembaga</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {allRequests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5}>
                            <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12 text-center">
                                <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-medium">Kotak Masuk Kosong</h3>
                                <p className="text-muted-foreground">
                                    Tidak ada permintaan yang disetujui dan menunggu untuk dicairkan saat ini.
                                </p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    allRequests.map(req => (
                        <TableRow key={req.id} data-state={selectedRequestIds.includes(req.id) ? "selected" : ""}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedRequestIds.includes(req.id)}
                                    onCheckedChange={() => handleSelectionChange(req.id)}
                                    aria-label={`Pilih baris ${req.id}`}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{req.requester.name}</div>
                                <div className="text-sm text-muted-foreground">{format(new Date(req.createdAt), 'dd MMM yyyy', { locale: id })}</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm font-medium">{req.institution}</div>
                                <div className="text-sm text-muted-foreground">{req.division}</div>
                            </TableCell>
                            <TableCell>
                                 <div className="font-medium">{req.items[0]?.description || 'N/A'}</div>
                                 <div className="text-sm text-muted-foreground line-clamp-1">{req.items.length > 1 ? `dan ${req.items.length - 1} item lainnya.` : (req.items[0]?.category || '')}</div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatRupiah(req.amount)}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {memosToGenerate && Object.entries(memosToGenerate).map(([lembaga, requests]) => (
         requests.length > 0 && (
            <div key={lembaga} className="memo-container print:mb-8 last:print:mb-0">
                <ReleaseMemo requests={requests} lembaga={lembaga} />
            </div>
         )
      ))}
    </div>
  );
}
