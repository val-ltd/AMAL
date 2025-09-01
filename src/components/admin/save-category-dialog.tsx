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
import type { BudgetCategory } from '@/lib/types';
import { Edit, Loader2, PlusCircle } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveCategoryDialogProps {
  category?: BudgetCategory;
}

export function SaveCategoryDialog({ category }: SaveCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!category;

  const [name, setName] = useState(category?.name || '');
  
  useEffect(() => {
    if (open) {
      setName(category?.name || '');
    }
  }, [open, category]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    if (!name) {
      toast({ title: 'Nama kategori harus diisi', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing && category.id) {
        await updateDoc(doc(db, 'budgetCategories', category.id), { name });
        toast({ title: `Kategori Diperbarui`, description: `Kategori telah berhasil diperbarui.` });
      } else {
        await addDoc(collection(db, 'budgetCategories'), { name });
        toast({ title: `Kategori Ditambahkan`, description: `Kategori telah berhasil ditambahkan.` });
      }
      setOpen(false);
    } catch (error) {
      console.error('Error saving category: ', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
      toast({
        title: `Gagal ${isEditing ? 'Memperbarui' : 'Menambahkan'} Kategori`,
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
                    Ubah Kategori
                </button>
            </DialogTrigger>
        )
    }
    return (
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Kategori
            </Button>
        </DialogTrigger>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Trigger />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Kategori Anggaran</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah nama kategori.' : 'Tambah kategori baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="cth., 23. Biaya Pendidikan Anak"
            />
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
