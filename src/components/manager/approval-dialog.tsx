
'use client';

import type { BudgetRequest } from '@/lib/types';
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
import { useState } from 'react';
import { updateRequestAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '../status-badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Building, Loader2, ThumbsDown, ThumbsUp, UserCheck } from 'lucide-react';
import { formatDepartment } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface ApprovalDialogProps {
  request: BudgetRequest;
}

export function ApprovalDialog({ request }: ApprovalDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
  };

  const handleSubmit = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    await updateRequestAction(request.id, status, comment);
    setIsSubmitting(false);
    setOpen(false);
    toast({
      title: `Permintaan ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
      description: `Permintaan anggaran untuk "${request.category}" telah ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tinjau</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Tinjau Permintaan Anggaran</DialogTitle>
          <DialogDescription>
            Tinjau detail di bawah ini dan setujui atau tolak permintaan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
            <div>
              <h3 className="font-semibold">{request.category}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {request.description}
              </p>
              <div className="mt-4 text-2xl font-bold">
                {formatRupiah(request.amount)}
              </div>
            </div>
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
        </div>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
