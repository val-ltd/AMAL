

'use client'

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getApprovedUnreleasedRequests, getFundAccounts, markRequestsAsReleased } from "@/lib/data";
import type { BudgetRequest, FundAccount } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Inbox, ShieldAlert, Printer, ArrowLeft, Loader2, DollarSign, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ReleaseMemo } from "@/components/release/release-memo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

const groupRequestsByFundSource = (requests: BudgetRequest[]) => {
  return requests.reduce((acc, request) => {
    const key = request.fundSourceId || 'Tidak Ditentukan';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(request);
    return acc;
  }, {} as Record<string, BudgetRequest[]>);
};


export default function ReleasePage() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [allRequests, setAllRequests] = useState<BudgetRequest[]>([]);
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  
  const [showPreview, setShowPreview] = useState(false);
  
  const userRoles = user?.profile?.roles;
  const isAuthorized = userRoles?.includes('Releaser') || userRoles?.includes('Admin') || userRoles?.includes('Super Admin');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isAuthorized) {
      setLoading(true);
      
      getFundAccounts().then(setFundAccounts);
      
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

  const handleOpenPrintPage = () => {
    if (selectedRequestIds.length > 0) {
      const selectedRequests = allRequests.filter(req => selectedRequestIds.includes(req.id));
      const fundSourceId = selectedRequests[0]?.fundSourceId; // Assume all selected are from the same source for one memo
      
      const queryParams = new URLSearchParams({
        fundAccountId: fundSourceId || '',
        requestIds: selectedRequestIds.join(','),
      }).toString();
      
      window.open(`/release/print?${queryParams}`, '_blank');
    }
  };

  const handleReleaseFunds = async () => {
    if (!user || !user.profile) {
        toast({ title: 'Error', description: 'Anda harus login untuk melakukan tindakan ini.', variant: 'destructive' });
        return;
    }
    
    setIsReleasing(true);
    const requestIds = selectedRequestIds;
        
    try {
        await markRequestsAsReleased(requestIds, { id: user.uid, name: user.displayName || 'Unknown Releaser' });
        toast({
            title: 'Dana Dicairkan',
            description: `${requestIds.length} permintaan telah ditandai sebagai dicairkan.`,
        });
        setSelectedRequestIds([]); // Clear selection
    } catch (error) {
        console.error("Failed to release funds:", error);
        toast({ title: 'Gagal Mencairkan Dana', description: 'Terjadi kesalahan.', variant: 'destructive' });
    } finally {
        setIsReleasing(false);
    }
  };
  
  const handleSelectionChange = (requestId: string) => {
    setSelectedRequestIds(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAllForSource = (fundSourceId: string, checked: boolean) => {
    const requestsForSource = allRequests.filter(req => (req.fundSourceId || 'Tidak Ditentukan') === fundSourceId);
    const requestIdsForSource = requestsForSource.map(req => req.id);

    if (checked) {
        setSelectedRequestIds(prev => [...new Set([...prev, ...requestIdsForSource])]);
    } else {
        setSelectedRequestIds(prev => prev.filter(id => !requestIdsForSource.includes(id)));
    }
  };
  
  const groupedRequests = groupRequestsByFundSource(allRequests);

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
  
  if (showPreview) {
    const selectedRequests = allRequests.filter(req => selectedRequestIds.includes(req.id));
    const groupedSelected = groupRequestsByFundSource(selectedRequests);
    
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-2 sm:p-8 print:bg-white">
            <div className="flex justify-between gap-2 mb-4 no-print">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Daftar
                </Button>
                <Button onClick={handleOpenPrintPage}>
                    <Printer className="mr-2 h-4 w-4" />
                    Buka Halaman Cetak ({Object.keys(groupedSelected).length} Memo)
                </Button>
            </div>
            {Object.entries(groupedSelected).map(([fundSourceId, reqs]) => {
                const fundAccount = fundAccounts.find(acc => acc.id === fundSourceId);
                if (!fundAccount || reqs.length === 0) return null;

                return (
                    <div key={fundSourceId} className="memo-wrapper bg-white my-8 page-break-before">
                        <ReleaseMemo requests={reqs} lembaga={reqs[0].institution} fundAccount={fundAccount} isPreview />
                    </div>
                )
            })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Pencairan Dana</h1>
        <div className="flex gap-2">
            <Button onClick={() => setShowPreview(true)} disabled={selectedRequestIds.length === 0} variant="outline" className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Pratinjau ({selectedRequestIds.length})
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={selectedRequestIds.length === 0 || isReleasing} className="flex-1">
                    {isReleasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                    Cairkan ({selectedRequestIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Pencairan Dana</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan menandai {selectedRequestIds.length} permintaan sebagai dicairkan. Tindakan ini akan mengubah status di database dan Google Sheet, serta mengirim notifikasi. Pastikan dana telah disiapkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReleaseFunds}>
                    Ya, Lanjutkan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      
        <div className="space-y-6">
            {Object.keys(groupedRequests).length > 0 ? (
                Object.entries(groupedRequests).map(([fundSourceId, requests]) => {
                    const fundAccount = fundAccounts.find(acc => acc.id === fundSourceId);
                    const allInGroupSelected = requests.every(req => selectedRequestIds.includes(req.id));
                    
                    return (
                        <Card key={fundSourceId}>
                            <CardHeader>
                               <div className="flex items-center gap-3">
                                <Wallet className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                    <CardTitle className="text-lg">{fundAccount?.accountName || 'Tidak Ditentukan'}</CardTitle>
                                    <CardDescription>{fundAccount?.accountNumber} - {fundAccount?.bankName}</CardDescription>
                                </div>
                               </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isMobile ? (
                                     <div className="p-4">
                                      <div className="border rounded-lg">
                                      {requests.map((req, index) => {
                                         const hasItems = Array.isArray(req.items) && req.items.length > 0;
                                         const description = hasItems ? req.items[0].description : (req as any).description;
                                         const itemCount = hasItems ? req.items.length : 0;
                                         return (
                                            <div key={req.id}>
                                                <div data-state={selectedRequestIds.includes(req.id) ? "selected" : ""} className="flex items-start gap-4 p-4 data-[state=selected]:bg-muted">
                                                    <Checkbox
                                                        checked={selectedRequestIds.includes(req.id)}
                                                        onCheckedChange={() => handleSelectionChange(req.id)}
                                                        aria-label={`Pilih baris ${req.id}`}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 space-y-1">
                                                        <div className="font-bold">{req.requester.name}</div>
                                                        <div className="text-sm text-muted-foreground">{description}{itemCount > 1 && ` & ${itemCount - 1} lainnya`}</div>
                                                        <div className="text-sm text-muted-foreground">{req.institution}</div>
                                                        <div className="text-base font-bold pt-1">{formatRupiah(req.amount)}</div>
                                                    </div>
                                                </div>
                                                {index < requests.length - 1 && <Separator />}
                                            </div>
                                         )
                                      })}
                                      </div>
                                    </div>
                                ) : (
                                    <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead className="w-12">
                                                  <Checkbox
                                                      checked={allInGroupSelected}
                                                      onCheckedChange={(checked) => handleSelectAllForSource(fundSourceId, !!checked)}
                                                      aria-label={`Pilih semua untuk ${fundAccount?.accountName}`}
                                                  />
                                              </TableHead>
                                              <TableHead>Pemohon & Tanggal</TableHead>
                                              <TableHead>Lembaga</TableHead>
                                              <TableHead>Deskripsi</TableHead>
                                              <TableHead className="text-right">Jumlah</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {requests.map(req => {
                                                const hasItems = Array.isArray(req.items) && req.items.length > 0;
                                                const description = hasItems ? req.items[0].description : (req as any).description;
                                                const category = hasItems ? req.items[0].category : (req as any).category;
                                                const itemCount = hasItems ? req.items.length : 0;
                                                
                                                return (
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
                                                           <div className="font-medium">{description || 'N/A'}</div>
                                                           <div className="text-sm text-muted-foreground line-clamp-1">{itemCount > 1 ? `dan ${itemCount - 1} item lainnya.` : (category || '')}</div>
                                                      </TableCell>
                                                      <TableCell className="text-right font-medium">{formatRupiah(req.amount)}</TableCell>
                                                  </TableRow>
                                                )
                                            })}
                                      </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    )
                })
            ) : (
                 <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12 text-center border-2 border-dashed">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-medium">Kotak Masuk Kosong</h3>
                    <p className="text-muted-foreground">
                        Tidak ada permintaan yang disetujui dan menunggu untuk dicairkan saat ini.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
}
