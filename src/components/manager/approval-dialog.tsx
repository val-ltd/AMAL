

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
import StatusBadge from '../status-badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Building, Eye, Loader2, ThumbsDown, ThumbsUp, UserCheck } from 'lucide-react';
import { formatDepartment } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { doc, serverTimestamp, updateDoc, collection, addDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useAuth } from '@/hooks/use-auth';
import { getFundAccounts, updateRequest } from '@/lib/data';

interface ApprovalDialogProps {
  request: BudgetRequest;
  isReadOnly?: boolean;
  triggerButton?: React.ReactNode;
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};


export function ApprovalDialog({ request, isReadOnly: initialIsReadOnly = false, triggerButton }: ApprovalDialogProps) {
  const { user: managerUser } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      getFundAccounts().then(setFundAccounts);
    }
  }, [open]);

  // A request is always read-only if its status is 'released' or if the initial prop says so.
  const isReadOnly = initialIsReadOnly || request.status === 'released';

  const handleSubmit = async (status: 'approved' | 'rejected') => {
    if (isReadOnly || !managerUser?.profile) return;

    setIsSubmitting(true);
    try {
        const updatedRequest = await updateRequest(request.id, status, comment, managerUser.profile);
        
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

  const items = Array.isArray(request.items) && request.items.length > 0 ? request.items : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Trigger />
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isReadOnly ? 'Detail' : 'Tinjau'} Permintaan Anggaran</DialogTitle>
          <DialogDescription>
            {isReadOnly ? 'Anda hanya dapat melihat detail permintaan ini.' : 'Tinjau detail di bawah ini dan setujui atau tolak permintaan.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className='flex items-center gap-3'>
                <Avatar>
                    <AvatarImage src={request.requester.avatarUrl} alt={request.requester.name} />
                    <AvatarFallback>{request.requester.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-semibold">{request.requester.name}</div>
                    <div className="text-sm text-muted-foreground">
                        Dikirim pada {format(new Date(request.createdAt), 'PP', { locale: id })}
                    </div>
                </div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
             {items.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Uraian</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Harga</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="text-right">{item.qty} {item.unit}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.total)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold">Total Pengajuan</TableCell>
                            <TableCell className="text-right font-bold">{formatRupiah(request.amount)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
             ) : (
                <div className="space-y-2">
                    <p className="font-medium">Deskripsi (Data Lama)</p>
                    <p className="text-sm text-muted-foreground">Tidak ada deskripsi.</p>
                    <Separator />
                    <div className="flex justify-end font-bold">
                        <span>Total: {formatRupiah(request.amount)}</span>
                    </div>
                </div>
             )}
            <Separator />
            <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-muted-foreground">
                    <Building className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className='flex-1'>{request.department ? formatDepartment(request.department) : `${request.institution} / ${request.division}`}</span>
                </div>
                {request.supervisor && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <UserCheck className="w-4 h-4 flex-shrink-0" />
                        <span>Penyetuju: {request.supervisor.name}</span>
                    </div>
                )}
            </div>
          </div>
          
          {!isReadOnly && (
            <div>
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

          {request.managerComment && (
             <div>
                <h4 className="text-sm font-semibold">Komentar Manajer</h4>
                <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">{request.managerComment}</p>
             </div>
          )}
        </div>
        <DialogFooter>
          {isReadOnly ? (
            <Button variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
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
