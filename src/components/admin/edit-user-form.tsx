
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User, Department } from '@/lib/types';
import { Loader2, PlusCircle, Check, X } from 'lucide-react';
import { formatDepartment } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { SaveDepartmentDialog } from './save-department-dialog';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Checkbox } from '../ui/checkbox';

type Role = 'Admin' | 'Manager' | 'Employee' | 'Super Admin';
const ALL_ROLES: Role[] = ['Employee', 'Manager', 'Admin', 'Super Admin'];

interface EditUserFormProps {
  user: User;
  departments: Department[];
}

export function EditUserForm({ user, departments: initialDepartments }: EditUserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
  });
  const [departments, setDepartments] = useState(initialDepartments);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(user.departmentIds || []);
  const [openDepartmentSelector, setOpenDepartmentSelector] = useState(false);
  
  const getRolesArray = (roles: any): Role[] => {
    if (Array.isArray(roles)) {
      return roles;
    }
    if (typeof roles === 'string') {
      return [roles] as Role[];
    }
    return [];
  };
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(getRolesArray(user.roles));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

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
    
    const updatedData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        roles: selectedRoles,
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
        router.push('/admin');
        router.refresh();
    } catch (error) {
        console.error("Error updating user: ", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
        toast({
            title: 'Gagal Memperbarui Pengguna',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const selectedDepartmentDetails = useMemo(() => {
    return departments.filter(d => selectedDepartments.includes(d.id));
  }, [selectedDepartments, departments]);

  const handleDepartmentAdded = useCallback((newDepartment: Department) => {
      if (!departments.some(d => d.id === newDepartment.id)) {
        setDepartments(prev => [...prev, newDepartment]);
      }
      if (!selectedDepartments.includes(newDepartment.id)) {
        setSelectedDepartments(prev => [...prev, newDepartment.id]);
      }
  }, [departments, selectedDepartments]);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
      </div>
      <div className="grid gap-2">
        <Label>Peran</Label>
        <div className="space-y-2 rounded-md border p-4">
            {ALL_ROLES.map(role => (
                <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                        id={`role-${role}`}
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={() => handleRoleChange(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="font-normal">{role}</Label>
                </div>
            ))}
        </div>
      </div>
      <div className="grid gap-3">
        <Label>Departemen</Label>
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
                    <CommandList className="max-h-52 overflow-y-auto">
                        <CommandEmpty>Departemen tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {departments.map((dept) => (
                                <CommandItem
                                    key={dept.id}
                                    value={formatDepartment(dept)}
                                    onSelect={() => {
                                        handleToggleDepartment(dept.id)
                                        setOpenDepartmentSelector(false)
                                    }}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${selectedDepartments.includes(dept.id) ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    {formatDepartment(dept)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandGroup className="border-t">
                        <SaveDepartmentDialog onDepartmentAdded={handleDepartmentAdded} triggerButton={
                            <CommandItem 
                                className="w-full cursor-pointer"
                                onSelect={(e) => { e.preventDefault(); }}
                             >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Departemen Baru
                            </CommandItem>
                        } />
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
