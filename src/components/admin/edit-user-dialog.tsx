
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User, Institution, Division } from '@/lib/types';
import { Edit, Loader2 } from 'lucide-react';
import { updateUserAction } from '@/app/admin/actions';

interface EditUserDialogProps {
  user: User;
  institutions: Institution[];
  divisions: Division[];
}

export function EditUserDialog({ user, institutions, divisions }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await updateUserAction(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Pengguna Diperbarui', description: `Data untuk ${user.name} telah berhasil diperbarui.` });
      setOpen(false);
    } else {
       const errorMessages = Object.values(result.errors ?? {}).flat().join('\n');
       toast({
        title: 'Gagal Memperbarui Pengguna',
        description: errorMessages || 'Terjadi kesalahan yang tidak diketahui.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center w-full text-left">
          <Edit className="mr-2 h-4 w-4" />
          Ubah Pengguna
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah Pengguna</DialogTitle>
          <DialogDescription>
            Ubah detail untuk pengguna ini. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input id="name" name="name" defaultValue={user.name} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Peran
            </Label>
            <Select name="role" defaultValue={user.role}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="institution" className="text-right">
              Lembaga
            </Label>
            <Select name="institution" defaultValue={user.institution}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih Lembaga" />
                </SelectTrigger>
                <SelectContent>
                    {institutions.map(inst => (
                        <SelectItem key={inst.id} value={inst.name}>{inst.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="division" className="text-right">
              Divisi
            </Label>
            <Select name="division" defaultValue={user.division}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih Divisi" />
                </SelectTrigger>
                <SelectContent>
                    {divisions.map(div => (
                        <SelectItem key={div.id} value={div.name}>{div.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
