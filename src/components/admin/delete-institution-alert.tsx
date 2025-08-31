
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
import { deleteInstitutionAction } from '@/app/admin/actions';

interface DeleteInstitutionAlertProps {
  institutionId: string;
}

export function DeleteInstitutionAlert({ institutionId }: DeleteInstitutionAlertProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsSubmitting(true);
    const result = await deleteInstitutionAction(institutionId);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Lembaga Dihapus', description: 'Lembaga telah berhasil dihapus dari sistem.' });
    } else {
      toast({
        title: 'Gagal Menghapus Lembaga',
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
            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data lembaga secara permanen dari basis data.
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
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Lembaga'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
