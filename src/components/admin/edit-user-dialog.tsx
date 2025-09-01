
'use client';

import { useState, useMemo, useCallback } from 'react';
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
import type { User, Department } from '@/lib/types';
import { Edit, Loader2, PlusCircle, Check, ChevronsUpDown, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDepartment } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { SaveDepartmentDialog } from './save-department-dialog';

interface EditUserDialogProps {
  user: User;
  departments: Department[];
  onDepartmentAdded: (newDepartment: Department) => void;
}

export function EditUserDialog({ user, departments, onDepartmentAdded }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(user.departmentIds || []);
  const [openDepartmentSelector, setOpenDepartmentSelector] = useState(false);


  const handleToggleDepartment = (departmentId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId)
        : [...prev, departmentId]
    );
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);

    const updatedData: Partial<User> = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as 'Admin' | 'Manager' | 'Employee',
        departmentIds: selectedDepartments,
    };
    
    if (selectedDepartments.length > 0) {
        const firstDept = departments.find(d => d.id === selectedDepartments[0]);
        if (firstDept) {
            updatedData.institution = firstDept.lembaga;
            updatedData.division = firstDept.divisi;
        }
    } else {
        updatedData.institution = '';
        updatedData.division = '';
    }


    try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, updatedData);
        toast({ title: 'Pengguna Diperbarui', description: `Data untuk ${user.name} telah berhasil diperbarui.` });
        setOpen(false);
    } catch (error) {
        console.error("Error updating user: ", error);
        toast({
            title: 'Gagal Memperbarui Pengguna',
            description: 'Terjadi kesalahan yang tidak diketahui.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const selectedDepartmentDetails = useMemo(() => {
    return departments.filter(d => selectedDepartments.includes(d.id));
  }, [selectedDepartments, departments]);

  const handleDepartmentAddedOptimistic = useCallback((newDepartment: Department) => {
      if (!departments.some(d => d.id === newDepartment.id)) {
        onDepartmentAdded(newDepartment);
      }
      if (!selectedDepartments.includes(newDepartment.id)) {
        setSelectedDepartments(prev => [...prev, newDepartment.id]);
      }
  }, [departments, onDepartmentAdded, selectedDepartments]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center w-full text-left">
          <Edit className="mr-2 h-4 w-4" />
          Ubah Pengguna
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Ubah Pengguna</DialogTitle>
          <DialogDescription>
            Ubah detail untuk pengguna ini. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Departemen
            </Label>
            <div className="col-span-3 space-y-2">
                <div className="rounded-md border min-h-24 p-2 space-y-2">
                    {selectedDepartmentDetails.length > 0 ? (
                        selectedDepartmentDetails.map(dept => (
                            <div key={dept.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                                <span className="text-sm">{formatDepartment(dept)}</span>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    onClick={() => handleToggleDepartment(dept.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Tidak ada departemen yang dipilih.</p>
                    )}
                </div>
                 <Popover open={openDepartmentSelector} onOpenChange={setOpenDepartmentSelector}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start font-normal"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Pilih Departemen
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[385px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Cari departemen..." />
                            <CommandList>
                                <CommandEmpty>Departemen tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                    {departments.map((dept) => (
                                        <CommandItem
                                            key={dept.id}
                                            value={formatDepartment(dept)}
                                            onSelect={() => handleToggleDepartment(dept.id)}
                                        >
                                            <Check
                                                className={`mr-2 h-4 w-4 ${selectedDepartments.includes(dept.id) ? 'opacity-100' : 'opacity-0'}`}
                                            />
                                            {formatDepartment(dept)}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                 <CommandGroup className="border-t">
                                     <SaveDepartmentDialog onDepartmentAdded={handleDepartmentAddedOptimistic} triggerButton={
                                        <div className="p-1">
                                            <Button type="button" variant="ghost" size="sm" className="text-sm w-full justify-start">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Tambah Departemen Baru
                                            </Button>
                                        </div>
                                    } />
                                 </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
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
