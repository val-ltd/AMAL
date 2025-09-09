
'use client';

import type { BudgetRequest, FundAccount } from '@/lib/types';
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
import { Printer } from 'lucide-react';
import { ReleaseMemo } from '../release/release-memo';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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
      return <Skeleton className="w-full h-[500px]" />;
    }
    if (fundAccount && request.requesterProfile) {
      return (
          <ReleaseMemo
              requests={[request]}
              lembaga={request.institution}
              fundAccount={fundAccount}
              isPreview={true}
          />
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detail Permintaan Anggaran</DialogTitle>
          <DialogDescription>
            Tinjau detail permintaan. Anda dapat mencetak memo jika telah disetujui.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2 border-y py-4">
            {renderContent()}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
            {canPrint && fundAccount && (
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Cetak Memo</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
