
'use client';

import type { BudgetRequest, FundAccount, User } from '@/lib/types';
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
import { getFundAccount, updateRequest, getUser } from '@/lib/data';
import { Loader2, ThumbsDown, ThumbsUp, Printer } from 'lucide-react';
import { ReleaseMemo } from '../release/release-memo';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface ApprovalDialogProps {
  request: BudgetRequest;
  isReadOnly?: boolean;
  triggerButton?: React.ReactNode;
}

export function ApprovalDialog({ request: initialRequest, isReadOnly: initialIsReadOnly = false, triggerButton }: ApprovalDialogProps) {
  const { user: managerUser } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      <DialogContent className={cn("max-w-4xl h-full flex flex-col sm:h-auto sm:max-h-[95vh] dialog-content-max-width")}>
        <DialogHeader>
          <DialogTitle>{isReadOnly ? 'Detail' : 'Tinjau'} Permintaan Anggaran</DialogTitle>
          <DialogDescription>
            {isReadOnly ? 'Anda dapat melihat detail dan mencetak memo untuk permintaan ini.' : 'Tinjau detail di bawah ini dan setujui atau tolak permintaan.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 bg-muted/50 p-0 sm:p-4 rounded-md">
            {loadingMemo && <Skeleton className="w-full h-full min-h-[500px]" />}
            {!loadingMemo && fundAccount && request.requesterProfile && (
                <div className="canvas-a4">
                    <ReleaseMemo
                        requests={[request]}
                        lembaga={request.institution}
                        fundAccount={fundAccount}
                        isPreview={true}
                    />
                </div>
            )}
            {!loadingMemo && !fundAccount && request.status !== 'pending' && (
                <p className="text-center text-red-500">Gagal memuat detail memo: Sumber dana tidak ditemukan.</p>
            )}
             {!loadingMemo && !request.requesterProfile && (
                <p className="text-center text-red-500">Gagal memuat detail memo: Data pemohon tidak ditemukan.</p>
            )}
        </ScrollArea>
        
        {!isReadOnly && (
            <div className="px-1 pt-2 sm:px-0">
                <label htmlFor="manager-comment" className="mb-2 block text-sm font-medium">
                Komentar Anda (Opsional)
                </label>
                <Textarea
                id="manager-comment"
                placeholder="Berikan alasan untuk keputusan Anda..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[60px]"
                />
            </div>
          )}

        <DialogFooter className="pt-4 border-t">
          {isReadOnly ? (
            <div className="flex w-full justify-between">
                <Button variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
                {canPrint && <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Cetak</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
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
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
