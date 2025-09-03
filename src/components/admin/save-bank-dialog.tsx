
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
import type { Bank } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveBankDialogProps {
  bank?: Bank;
  children: React.ReactNode;
}

export function SaveBankDialog({ bank, children }: SaveBankDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!bank;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  
  useEffect(() => {
    if (open) {
      setName(bank?.name || '');
      setCode(bank?.code || '');
    }
  }, [open, bank]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    if (!name || !code) {
      toast({ title: 'Semua field harus diisi', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }

    try {
      const data = { name, code };
      if (isEditing && bank.id) {
        await updateDoc(doc(db, 'banks', bank.id), data);
        toast({ title: `Bank Diperbarui` });
      } else {
        await addDoc(collection(db, 'banks'), data);
        toast({ title: `Bank Ditambahkan` });
      }
      setOpen(false);
    } catch (error) {
      console.error('Error saving bank: ', error);
      toast({
        title: `Gagal menyimpan bank`,
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
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Bank</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah nama atau kode bank.' : 'Tambah bank baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama Bank
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Kode
            </Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3"/>
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
