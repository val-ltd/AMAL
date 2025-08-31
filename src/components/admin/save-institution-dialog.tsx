'use client';

import { useState } from 'react';
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
import type { Institution } from '@/lib/types';
import { Edit, Loader2, PlusCircle } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveInstitutionDialogProps {
  institution?: Institution;
}

export function SaveInstitutionDialog({ institution }: SaveInstitutionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!institution;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;

    if (!name) {
        toast({ title: 'Nama tidak boleh kosong', variant: 'destructive'});
        setIsSubmitting(false);
        return;
    }

    try {
        if (isEditing) {
            const instRef = doc(db, 'institutions', institution.id);
            await updateDoc(instRef, { name });
        } else {
            await addDoc(collection(db, 'institutions'), { name });
        }
        toast({ title: `Lembaga ${isEditing ? 'Diperbarui' : 'Ditambahkan'}`, description: `Lembaga telah berhasil di${isEditing ? 'perbarui' : 'tambahkan'}.` });
        setOpen(false);
    } catch (error) {
        console.error('Error saving institution: ', error);
        toast({
            title: `Gagal ${isEditing ? 'Memperbarui' : 'Menambahkan'} Lembaga`,
            description: 'Terjadi kesalahan yang tidak diketahui.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
            <button className="flex items-center w-full text-left">
                <Edit className="mr-2 h-4 w-4" />
                Ubah Lembaga
            </button>
        ) : (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Lembaga
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Lembaga</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah nama lembaga.' : 'Tambah lembaga baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input id="name" name="name" defaultValue={institution?.name} className="col-span-3" placeholder="cth. YAYASAN..." />
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
