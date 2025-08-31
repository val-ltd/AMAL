
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
import { Trash } from 'lucide-react';
import { deleteDivisionAction } from '@/app/admin/actions';

interface DeleteDivisionAlertProps {
  divisionId: string;
}

export function DeleteDivisionAlert({ divisionId }: DeleteDivisionAlertProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsSubmitting(true);
    const result = await deleteDivisionAction(divisionId);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Divisi Dihapus', description: 'Divisi telah berhasil dihapus dari sistem.' });
    } else {
      toast({
        title: 'Gagal Menghapus Divisi',
        description: result.error || 'Terjadi kesalahan yang tidak diketahui.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="flex items-center w-full text-left text-red-600">
          <Trash className="mr-2 h-4 w-4" />
          Hapus
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data divisi secara permanen dari basis data.
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
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Divisi'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
