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
import type { Division } from '@/lib/types';
import { Edit, Loader2, PlusCircle } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveDivisionDialogProps {
  division?: Division;
}

export function SaveDivisionDialog({ division }: SaveDivisionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!division;

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
        const divRef = doc(db, 'divisions', division.id);
        await updateDoc(divRef, { name });
      } else {
        await addDoc(collection(db, 'divisions'), { name });
      }
      toast({ title: `Divisi ${isEditing ? 'Diperbarui' : 'Ditambahkan'}`, description: `Divisi telah berhasil di${isEditing ? 'perbarui' : 'tambahkan'}.` });
      setOpen(false);
    } catch (error) {
      console.error('Error saving division: ', error);
      toast({
        title: `Gagal ${isEditing ? 'Memperbarui' : 'Menambahkan'} Divisi`,
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
                Ubah Divisi
            </button>
        ) : (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Divisi
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Divisi</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah nama divisi.' : 'Tambah divisi baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input id="name" name="name" defaultValue={division?.name} className="col-span-3" placeholder="cth. Divisi Dakwah" />
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
