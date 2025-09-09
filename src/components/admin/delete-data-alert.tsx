
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteDepartment } from '@/lib/data';

interface DeleteDataAlertProps {
  id: string;
  collection: string;
  name: string;
  children: React.ReactNode;
}

export function DeleteDataAlert({ id, collection, name, children }: DeleteDataAlertProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      if (collection === 'departments') {
        await deleteDepartment(id);
      } else {
        await updateDoc(doc(db, collection, id), { isDeleted: true });
      }
      toast({ title: `${name} Dihapus`, description: `${name} telah berhasil dihapus.` });
    } catch (error) {
      console.error(`Error deleting ${name}:`, error);
      toast({
        title: `Gagal Menghapus ${name}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak akan menghapus data secara permanen, tetapi akan diarsipkan. Anda dapat menghubungi administrator untuk memulihkannya.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menghapus...' : `Ya, Hapus ${name}`}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
