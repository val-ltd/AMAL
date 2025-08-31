
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
import { saveInstitutionAction } from '@/app/admin/actions';

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
    const result = await saveInstitutionAction(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({ title: `Lembaga ${isEditing ? 'Diperbarui' : 'Ditambahkan'}`, description: `Lembaga telah berhasil di${isEditing ? 'perbarui' : 'tambahkan'}.` });
      setOpen(false);
    } else {
       const errorMessages = Object.values(result.errors ?? {}).flat().join('\n');
       toast({
        title: `Gagal ${isEditing ? 'Memperbarui' : 'Menambahkan'} Lembaga`,
        description: errorMessages || 'Terjadi kesalahan yang tidak diketahui.',
        variant: 'destructive',
      });
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
          {isEditing && <input type="hidden" name="id" value={institution.id} />}
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
