
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
import type { FundAccount } from '@/lib/types';
import { Edit, Loader2, PlusCircle } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveFundAccountDialogProps {
  account?: FundAccount;
}

export function SaveFundAccountDialog({ account }: SaveFundAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!account;

  const [formData, setFormData] = useState({
    accountName: account?.accountName || '',
    bankName: account?.bankName || '',
    accountNumber: account?.accountNumber || ''
  });
  
  useEffect(() => {
    if (open) {
      setFormData({
        accountName: account?.accountName || '',
        bankName: account?.bankName || '',
        accountNumber: account?.accountNumber || ''
      });
    }
  }, [open, account]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.accountName || !formData.bankName || !formData.accountNumber) {
      toast({ title: 'Semua kolom harus diisi', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing && account.id) {
        await updateDoc(doc(db, 'fundAccounts', account.id), formData);
        toast({ title: `Sumber Dana Diperbarui`, description: `Rekening telah berhasil diperbarui.` });
      } else {
        await addDoc(collection(db, 'fundAccounts'), formData);
        toast({ title: `Sumber Dana Ditambahkan`, description: `Rekening telah berhasil ditambahkan.` });
      }
      setOpen(false);
    } catch (error) {
      console.error('Error saving fund account: ', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
      toast({
        title: `Gagal ${isEditing ? 'Memperbarui' : 'Menambahkan'} Sumber Dana`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Trigger = () => {
    if (isEditing) {
        return (
            <DialogTrigger asChild>
                <button className="flex items-center w-full text-left">
                    <Edit className="mr-2 h-4 w-4" />
                    Ubah Rekening
                </button>
            </DialogTrigger>
        )
    }
    return (
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Sumber Dana
            </Button>
        </DialogTrigger>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Trigger />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Sumber Dana</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah detail rekening sumber dana.' : 'Tambah rekening baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accountName" className="text-right">
              Nama Rek.
            </Label>
            <Input id="accountName" name="accountName" value={formData.accountName} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bankName" className="text-right">
              Nama Bank
            </Label>
            <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accountNumber" className="text-right">
              No. Rek.
            </Label>
            <Input id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="col-span-3" />
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
