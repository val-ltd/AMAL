
'use client';

import type { BudgetRequest, FundAccount } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getFundAccount, updateRequest } from '@/lib/data';
import { Loader2, ThumbsDown, ThumbsUp, Printer } from 'lucide-react';
import { ReleaseMemo } from '../release/release-memo';
import { Skeleton } from '../ui/skeleton';

interface ApprovalDialogProps {
  request: BudgetRequest;
  isReadOnly?: boolean;
  triggerButton?: React.ReactNode;
}

export function ApprovalDialog({ request, isReadOnly: initialIsReadOnly = false, triggerButton }: ApprovalDialogProps) {
  const { user: managerUser } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [fundAccount, setFundAccount] = useState<FundAccount | null>(null);
  const [loadingMemo, setLoadingMemo] = useState(false);
  const { toast } = useToast();
  
  const canPrint = request.status === 'approved' || request.status === 'released' || request.status === 'completed';

  useEffect(() => {
    if (open && request.fundSourceId) {
      setLoadingMemo(true);
      getFundAccount(request.fundSourceId)
        .then(setFundAccount)
        .finally(() => setLoadingMemo(false));
    }
  }, [open, request.fundSourceId]);

  const handlePrint = () => {
    window.open(`/request/${request.id}/print`, '_blank');
  };

  const isReadOnly = initialIsReadOnly || request.status === 'released' || request.status === 'completed';

  const handleSubmit = async (status: 'approved' | 'rejected') => {
    if (isReadOnly || !managerUser?.profile) return;

    setIsSubmitting(true);
    try {
        await updateRequest(request.id, status, comment, managerUser.profile);
        
        toast({
            title: `Permintaan ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
            description: `Permintaan anggaran telah ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
        });
        setOpen(false);

    } catch (error) {
        console.error("Error updating request:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.';
        toast({
            variant: 'destructive',
            title: 'Gagal Memperbarui Permintaan',
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const Trigger = () => {
    if (triggerButton) {
        return <div onClick={() => setOpen(true)}>{triggerButton}</div>
    }
    return (
        <DialogTrigger asChild>
            <Button>Tinjau</Button>
        </DialogTrigger>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Trigger />
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isReadOnly ? 'Detail' : 'Tinjau'} Permintaan Anggaran</DialogTitle>
          <DialogDescription>
            {isReadOnly ? 'Anda dapat melihat detail dan mencetak memo untuk permintaan ini.' : 'Tinjau detail di bawah ini dan setujui atau tolak permintaan.'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2 border-y py-4">
            {loadingMemo && <Skeleton className="w-full h-[500px]" />}
            {!loadingMemo && fundAccount && (
                <ReleaseMemo
                    requests={[request]}
                    lembaga={request.institution}
                    fundAccount={fundAccount}
                    isPreview={true}
                />
            )}
            {!loadingMemo && !fundAccount && request.status !== 'pending' && (
                <p className="text-center text-red-500">Gagal memuat detail memo: Sumber dana tidak ditemukan.</p>
            )}
        </div>
        
        {!isReadOnly && (
            <div className="px-1 pt-2">
                <label htmlFor="manager-comment" className="mb-2 block text-sm font-medium">
                Komentar Anda (Opsional)
                </label>
                <Textarea
                id="manager-comment"
                placeholder="Berikan alasan untuk keputusan Anda..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                />
            </div>
          )}

        <DialogFooter className="gap-2 sm:gap-0">
          {isReadOnly ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
              {canPrint && <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Cetak</Button>}
            </>
          ) : (
            <>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                    Batal
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => handleSubmit('rejected')}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700"
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
                    Tolak
                </Button>
                <Button onClick={() => handleSubmit('approved')} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                    Setujui
                </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
