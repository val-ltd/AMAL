
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
import type { Department } from '@/lib/types';
import { Edit, Loader2, PlusCircle } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveDepartmentDialogProps {
  department?: Department;
}

export function SaveDepartmentDialog({ department }: SaveDepartmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!department;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    const data = {
        lembaga: formData.get('lembaga') as string,
        divisi: formData.get('divisi') as string,
        bagian: formData.get('bagian') as string || null,
        unit: formData.get('unit') as string || null,
    };

    if (!data.lembaga || !data.divisi) {
      toast({ title: 'Lembaga dan Divisi harus diisi', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        const deptRef = doc(db, 'departments', department.id);
        await updateDoc(deptRef, data);
      } else {
        await addDoc(collection(db, 'departments'), data);
      }
      toast({ title: `Departemen ${isEditing ? 'Diperbarui' : 'Ditambahkan'}`, description: `Departemen telah berhasil di${isEditing ? 'perbarui' : 'tambahkan'}.` });
      setOpen(false);
    } catch (error) {
      console.error('Error saving department: ', error);
      toast({
        title: `Gagal ${isEditing ? 'Memperbarui' : 'Menambahkan'} Departemen`,
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
                Ubah Departemen
            </button>
        ) : (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Departemen
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} Departemen</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah detail departemen.' : 'Tambah departemen baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lembaga" className="text-right">
              Lembaga*
            </Label>
            <Input id="lembaga" name="lembaga" defaultValue={department?.lembaga} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="divisi" className="text-right">
              Divisi*
            </Label>
            <Input id="divisi" name="divisi" defaultValue={department?.divisi} className="col-span-3" required/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bagian" className="text-right">
              Bagian
            </Label>
            <Input id="bagian" name="bagian" defaultValue={department?.bagian} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
            <Input id="unit" name="unit" defaultValue={department?.unit} className="col-span-3" />
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
