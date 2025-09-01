'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { collection, getDocs, query, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Combobox } from './combobox';

interface SaveDepartmentDialogProps {
  department?: Department;
  onDepartmentAdded?: (newDepartment: Department) => void;
  triggerButton?: React.ReactElement;
}

export function SaveDepartmentDialog({ department, onDepartmentAdded, triggerButton }: SaveDepartmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!department;

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  
  const [lembaga, setLembaga] = useState(department?.lembaga || '');
  const [divisi, setDivisi] = useState(department?.divisi || '');
  const [bagian, setBagian] = useState(department?.bagian || '');
  const [unit, setUnit] = useState(department?.unit || '');
  
  useEffect(() => {
    if (open) {
      const fetchDepts = async () => {
        const q = query(collection(db, "departments"));
        const querySnapshot = await getDocs(q);
        const depts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        setAllDepartments(depts);
      };
      fetchDepts();
      
      setLembaga(department?.lembaga || '');
      setDivisi(department?.divisi || '');
      setBagian(department?.bagian || '');
      setUnit(department?.unit || '');
    }
  }, [open, department]);

  const uniqueLembaga = useMemo(() => [...new Set(allDepartments.map(d => d.lembaga))], [allDepartments]);
  const uniqueDivisi = useMemo(() => [...new Set(allDepartments.filter(d => d.lembaga === lembaga).map(d => d.divisi))], [allDepartments, lembaga]);
  const uniqueBagian = useMemo(() => [...new Set(allDepartments.filter(d => d.lembaga === lembaga && d.divisi === divisi && d.bagian).map(d => d.bagian!))], [allDepartments, lembaga, divisi]);
  const uniqueUnit = useMemo(() => [...new Set(allDepartments.filter(d => d.lembaga === lembaga && d.divisi === divisi && d.bagian === bagian && d.unit).map(d => d.unit!))], [allDepartments, lembaga, divisi, bagian]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const data = { lembaga, divisi, bagian, unit };

    if (!data.lembaga || !data.divisi) {
      toast({ title: 'Lembaga dan Divisi harus diisi', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing && department.id) {
        await updateDoc(doc(db, 'departments', department.id), data);
        toast({ title: `Departemen Diperbarui`, description: `Departemen telah berhasil diperbarui.` });
      } else {
        const docRef = await addDoc(collection(db, 'departments'), data);
        toast({ title: `Departemen Ditambahkan`, description: `Departemen telah berhasil ditambahkan.` });
        if(onDepartmentAdded) {
            onDepartmentAdded({id: docRef.id, ...data});
        }
      }
      setOpen(false);
    } catch (error) {
      console.error('Error saving department: ', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
      toast({
        title: `Gagal ${isEditing ? 'Memperbarui' : 'Menambahkan'} Departemen`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Trigger = () => {
    if (triggerButton) {
        return <div onClick={() => setOpen(true)}>{triggerButton}</div>
    }
    if (isEditing) {
        return (
            <DialogTrigger asChild>
                <button className="flex items-center w-full text-left">
                    <Edit className="mr-2 h-4 w-4" />
                    Ubah Departemen
                </button>
            </DialogTrigger>
        )
    }
    return (
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Departemen
            </Button>
        </DialogTrigger>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Trigger />
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
             <Combobox
                options={uniqueLembaga.map(l => ({value: l, label: l}))}
                value={lembaga}
                onChange={(v) => { setLembaga(v); setDivisi(''); setBagian(''); setUnit(''); }}
                placeholder="Pilih atau buat baru..."
                className="col-span-3"
              />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="divisi" className="text-right">
              Divisi*
            </Label>
             <Combobox
                options={uniqueDivisi.map(d => ({value: d, label: d}))}
                value={divisi}
                onChange={(v) => { setDivisi(v); setBagian(''); setUnit(''); }}
                placeholder="Pilih atau buat baru..."
                className="col-span-3"
                disabled={!lembaga}
              />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bagian" className="text-right">
              Bagian
            </Label>
             <Combobox
                options={uniqueBagian.map(b => ({value: b, label: b}))}
                value={bagian}
                onChange={(v) => { setBagian(v); setUnit(''); }}
                placeholder="Pilih atau buat baru..."
                className="col-span-3"
                disabled={!divisi}
              />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
             <Combobox
                options={uniqueUnit.map(u => ({value: u, label: u}))}
                value={unit}
                onChange={setUnit}
                placeholder="Pilih atau buat baru..."
                className="col-span-3"
                disabled={!bagian}
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
