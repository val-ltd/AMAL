
'use client';

import type { BudgetRequest, FundAccount, ExpenseReceipt } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { getFundAccount, getUser } from '@/lib/data';
import { Printer, File as FileIcon } from 'lucide-react';
import { ReleaseMemo } from '../release/release-memo';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn, formatRupiah } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface ViewRequestDialogProps {
  request: BudgetRequest;
  triggerButton?: React.ReactNode;
}

export function ViewRequestDialog({ request: initialRequest, triggerButton }: ViewRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [fundAccount, setFundAccount] = useState<FundAccount | null>(null);
  const [request, setRequest] = useState(initialRequest);
  const [loadingMemo, setLoadingMemo] = useState(false);
  const { toast } = useToast();
  
  const canPrint = request.status === 'approved' || request.status === 'released' || request.status === 'completed';

  useEffect(() => {
    if (open) {
      setLoadingMemo(true);
      const fetchData = async () => {
        try {
          const fundAccountPromise = request.fundSourceId ? getFundAccount(request.fundSourceId) : Promise.resolve(null);
          const requesterProfilePromise = getUser(request.requester.id);

          const [account, requesterProfile] = await Promise.all([fundAccountPromise, requesterProfilePromise]);
          
          setFundAccount(account);

          if (requesterProfile) {
            setRequest(prev => ({ ...prev, requesterProfile }));
          }

        } catch (error) {
            console.error("Failed to fetch memo data:", error);
            toast({ title: 'Error', description: 'Gagal memuat data memo.', variant: 'destructive'});
        } finally {
            setLoadingMemo(false);
        }
      };
      fetchData();
    }
  }, [open, request.fundSourceId, request.requester.id, toast]);


  const handlePrint = () => {
    window.open(`/request/${request.id}/print`, '_blank');
  };

  const Trigger = () => {
    if (triggerButton) {
        return <div onClick={() => setOpen(true)}>{triggerButton}</div>
    }
    return (
        <Button onClick={() => setOpen(true)}>Lihat Detail</Button>
    );
  }

  const renderContent = () => {
    if (loadingMemo) {
      return <Skeleton className="w-full h-full min-h-[500px]" />;
    }
    
    // For completed requests, show the report details
    if (request.status === 'completed' && request.report) {
        return (
            <div className='space-y-4'>
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Pertanggungjawaban</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Jumlah Pengeluaran</span>
                            <span className="font-bold">{formatRupiah(request.report.spentAmount)}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Sisa Dana</span>
                            <span className="font-bold">{formatRupiah(request.amount - request.report.spentAmount)}</span>
                        </div>
                        {request.report.notes && (
                            <div>
                                <p className="text-sm font-medium">Catatan:</p>
                                <p className="text-sm text-muted-foreground italic">"{request.report.notes}"</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {request.report.receipts.map((receipt, index) => (
                    <Card key={index}>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-base">Bukti {index + 1}</CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <a href={receipt.attachment.url} target="_blank" rel="noopener noreferrer">
                                    <FileIcon className="mr-2 h-4 w-4" />
                                    Lihat Lampiran
                                </a>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Uraian</TableHead>
                                        <TableHead className="text-center">Jml</TableHead>
                                        <TableHead>Satuan</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receipt.items.map((item, itemIndex) => (
                                        <TableRow key={itemIndex}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-center">{item.qty}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    // For other statuses, show the memo
    if (fundAccount && request.requesterProfile) {
      return (
          <div className="canvas-a4">
            <ReleaseMemo
                requests={[request]}
                lembaga={request.institution}
                fundAccount={fundAccount}
                isPreview={true}
            />
          </div>
      );
    }
    
    // Fallback for requests without a fund account or still loading
    return (
      <div className="space-y-6 p-4">
        <div className="text-center">
            <h3 className="font-bold text-lg">{request.subject}</h3>
            <p className="text-sm text-muted-foreground">{request.budgetPeriod}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="text-muted-foreground">Pemohon</p>
                <p className="font-medium">{request.requester.name}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Departemen</p>
                <p className="font-medium">{request.institution} / {request.division}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Tanggal Dibuat</p>
                <p className="font-medium">{format(new Date(request.createdAt), 'PPpp', { locale: id })}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Atasan</p>
                <p className="font-medium">{request.supervisor?.name || 'N/A'}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{request.status}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Jumlah</p>
                <p className="font-medium">Rp {request.amount.toLocaleString('id-ID')}</p>
            </div>
        </div>
         <p className="text-sm">
            <span className="text-muted-foreground">Komentar Manajer:</span>
            <span className="italic"> {request.managerComment || 'Tidak ada komentar.'}</span>
        </p>
         <p className="text-red-500 text-center text-sm">
            Tampilan memo tidak tersedia karena data tidak lengkap.
         </p>
      </div>
    );
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Trigger />
      <DialogContent className={cn("max-w-4xl h-full flex flex-col sm:h-auto sm:max-h-[95vh] dialog-content-max-width")}>
        <DialogHeader>
          <DialogTitle>Detail Permintaan Anggaran</DialogTitle>
          <DialogDescription>
            Tinjau detail permintaan. Anda dapat mencetak memo jika telah disetujui.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 bg-muted/50 p-0 sm:p-4 rounded-md">
            {renderContent()}
        </ScrollArea>
        
        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
            {canPrint && fundAccount && (
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Cetak Memo</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
