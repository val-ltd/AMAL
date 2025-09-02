
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
import { Loader2 } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '../ui/scroll-area';

interface SaveFundAccountDialogProps {
  account?: FundAccount;
  children: React.ReactNode;
}

const initialFormState = {
    namaLembaga: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    cabang: '',
    pejabatNama: '',
    pejabatJabatan: '',
    namaBendahara: '',
    bankBendahara: '',
    rekeningBendahara: '',
    kodeBank: '',
    petugas: '',
};

export function SaveFundAccountDialog({ account, children }: SaveFundAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!account;

  const [formData, setFormData] = useState(initialFormState);
  
  useEffect(() => {
    if (open) {
      if (isEditing && account) {
        setFormData({
            namaLembaga: account.namaLembaga || '',
            accountName: account.accountName || '',
            accountNumber: account.accountNumber || '',
            bankName: account.bankName || '',
            cabang: account.cabang || '',
            pejabatNama: account.pejabatNama || '',
            pejabatJabatan: account.pejabatJabatan || '',
            namaBendahara: account.namaBendahara || '',
            bankBendahara: account.bankBendahara || '',
            rekeningBendahara: account.rekeningBendahara || '',
            kodeBank: account.kodeBank || '',
            petugas: account.petugas || '',
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [open, account, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.accountName || !formData.bankName || !formData.accountNumber || !formData.namaLembaga) {
      toast({ title: 'Nama Lembaga, Nama Rekening, Bank, dan No. Rekening harus diisi', variant: 'destructive'});
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

  const formFields = [
    { id: 'namaLembaga', label: 'Nama Lembaga', required: true },
    { id: 'accountName', label: 'Nama Rekening', required: true },
    { id: 'accountNumber', label: 'No. Rekening', required: true },
    { id: 'bankName', label: 'Bank', required: true },
    { id: 'cabang', label: 'Cabang' },
    { id: 'pejabatNama', label: 'Nama Pejabat' },
    { id: 'pejabatJabatan', label: 'Jabatan Pejabat' },
    { id: 'namaBendahara', label: 'Nama Bendahara' },
    { id: 'bankBendahara', label: 'Bank Bendahara' },
    { id: 'rekeningBendahara', label: 'Rekening Bendahara' },
    { id: 'kodeBank', label: 'Kode Bank' },
    { id: 'petugas', label: 'Petugas' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Sumber Dana</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah detail rekening sumber dana.' : 'Tambah rekening baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <ScrollArea className="h-96 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-2">
                    {formFields.map(field => (
                         <div key={field.id} className="grid gap-2">
                            <Label htmlFor={field.id}>
                                {field.label}{field.required && '*'}
                            </Label>
                            <Input
                                id={field.id}
                                name={field.id}
                                value={formData[field.id as keyof typeof formData]}
                                onChange={handleInputChange}
                            />
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
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
