
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
import { Loader2 } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaveDataDialogProps {
  data?: { id: string; name: string; };
  collection: string;
  dialogTitle: string;
  children: React.ReactNode;
}

export function SaveDataDialog({ data, collection: collectionName, dialogTitle, children }: SaveDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!data;

  const [name, setName] = useState('');
  
  useEffect(() => {
    if (open) {
      setName(data?.name || '');
    }
  }, [open, data]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    if (!name) {
      toast({ title: 'Nama harus diisi', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing && data.id) {
        await updateDoc(doc(db, collectionName, data.id), { name });
        toast({ title: `${dialogTitle} Diperbarui` });
      } else {
        await addDoc(collection(db, collectionName), { name });
        toast({ title: `${dialogTitle} Ditambahkan` });
      }
      setOpen(false);
    } catch (error) {
      console.error(`Error saving ${dialogTitle.toLowerCase()}: `, error);
      toast({
        title: `Gagal menyimpan ${dialogTitle.toLowerCase()}`,
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
          <DialogTitle>{isEditing ? 'Ubah' : 'Tambah'} {dialogTitle}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Ubah nama ${dialogTitle.toLowerCase()}.` : `Tambah ${dialogTitle.toLowerCase()} baru.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3"/>
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
