
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { TransferType } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveTransferTypeDialogProps {
  transferType?: TransferType;
  children: React.ReactNode;
}

export function SaveTransferTypeDialog({ transferType, children }: SaveTransferTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!transferType;

  const [name, setName] = useState('');
  const [fee, setFee] = useState(0);
  
  useEffect(() => {
    if (open) {
      setName(transferType?.name || '');
      setFee(transferType?.fee || 0);
    }
  }, [open, transferType]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    if (!name) {
      toast({ title: 'Semua field harus diisi', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }

    try {
      const data = { name, fee, isDeleted: false };
      if (isEditing && transferType.id) {
        await updateDoc(doc(db, 'transferTypes', transferType.id), data);
        toast({ title: `Jenis Transfer Diperbarui` });
      } else {
        await addDoc(collection(db, 'transferTypes'), data);
        toast({ title: `Jenis Transfer Ditambahkan` });
      }
      setOpen(false);
    } catch (error) {
      console.error('Error saving transfer type: ', error);
      toast({
        title: `Gagal menyimpan Jenis Transfer`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Jenis Transfer</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah nama atau biaya transfer.' : 'Tambah jenis transfer baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fee" className="text-right">
              Biaya
            </Label>
            <Input id="fee" type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} className="col-span-3"/>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
