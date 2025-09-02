
'use client'

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getApprovedUnreleasedRequests, getFundAccounts, getFundAccount } from "@/lib/data";
import type { BudgetRequest, FundAccount } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, ShieldAlert, FileText, Inbox, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ReleaseMemo } from "@/components/release/release-memo";

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

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
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [selectedFundAccountId, setSelectedFundAccountId] = useState<string>('');
  
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<BudgetRequest[]>([]);
  const [selectedFundAccount, setSelectedFundAccount] = useState<FundAccount | null>(null);

  const userRoles = user?.profile?.roles;
  const isAuthorized = userRoles?.includes('Releaser') || userRoles?.includes('Admin') || userRoles?.includes('Super Admin');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isAuthorized) {
      setLoading(true);
      
      getFundAccounts().then(accounts => {
        setFundAccounts(accounts);
        if (accounts.length > 0) {
            setSelectedFundAccountId(accounts[0].id);
        }
      });
      
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

  const handlePreviewMemo = async () => {
    if (selectedRequestIds.length > 0 && selectedFundAccountId) {
      const requests = allRequests.filter(req => selectedRequestIds.includes(req.id));
      const account = await getFundAccount(selectedFundAccountId);
      setSelectedRequests(requests);
      setSelectedFundAccount(account);
      setShowPreview(true);
    }
  };

  const handleBackToList = () => {
    setShowPreview(false);
    setSelectedRequests([]);
    setSelectedFundAccount(null);
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

  if (showPreview) {
    const groupedRequests = groupRequestsByLembaga(selectedRequests);
    const memoCount = Object.keys(groupedRequests).length;

    return (
      <div className="bg-gray-200 -m-4 sm:-m-6 p-4 sm:p-8 print-container">
        <div className="flex justify-end gap-2 mb-4 no-print">
            <Button variant="outline" onClick={handleBackToList}>Kembali ke Daftar</Button>
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Halaman Ini ({memoCount} Memo)
            </Button>
        </div>
        <div className="space-y-8">
          {selectedFundAccount && Object.entries(groupedRequests).map(([lembaga, requests]) => (
            requests.length > 0 && (
                <div key={lembaga} className="bg-white shadow-lg page-break">
                  <ReleaseMemo requests={requests} lembaga={lembaga} fundAccount={selectedFundAccount} />
                </div>
            )
          ))}
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <h1 className="text-3xl font-bold tracking-tight">Pencairan Dana</h1>
        <div className="flex items-end gap-4 w-full sm:w-auto">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="fund-source">Sumber Dana</Label>
                <Select value={selectedFundAccountId} onValueChange={setSelectedFundAccountId}>
                    <SelectTrigger id="fund-source" className="min-w-[300px]">
                        <SelectValue placeholder="Pilih sumber dana..." />
                    </SelectTrigger>
                    <SelectContent>
                        {fundAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.accountName} ({account.accountNumber})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handlePreviewMemo} disabled={selectedRequestIds.length === 0 || !selectedFundAccountId}>
                <Printer className="mr-2 h-4 w-4" />
                Lihat Pratinjau Cetak ({selectedRequestIds.length})
            </Button>
        </div>
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
                    allRequests.map(req => {
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
                    })
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    