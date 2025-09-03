
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User, Department } from '@/lib/types';
import { Loader2, PlusCircle, X, Search } from 'lucide-react';
import { doc, updateDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDepartment } from '@/lib/utils';
import { SaveDepartmentDialog } from './save-department-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type Role = 'Admin' | 'Manager' | 'Employee' | 'Super Admin' | 'Releaser';
const ALL_ROLES: Role[] = ['Employee', 'Manager', 'Admin', 'Super Admin', 'Releaser'];
const ROLE_HIERARCHY: Record<Role, Role[]> = {
    'Super Admin': ['Super Admin', 'Admin', 'Manager', 'Releaser', 'Employee'],
    'Admin': ['Admin', 'Manager', 'Releaser', 'Employee'],
    'Manager': ['Manager', 'Employee'],
    'Releaser': ['Releaser', 'Employee'],
    'Employee': ['Employee'],
};

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const getRolesArray = (roles: any): Role[] => {
    if (Array.isArray(roles)) {
      return roles;
    }
    if (typeof roles === 'string') {
      return [roles] as Role[];
    }
    return [];
  };

  const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
  });
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(getRolesArray(user.roles));
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(user.departmentIds || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);

  // Use a snapshot listener to keep allDepartments up to date
  useEffect(() => {
    const q = query(collection(db, "departments"), where('isDeleted', '!=', true), orderBy('lembaga'), orderBy('divisi'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const depts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        setAllDepartments(depts);
    });
    return () => unsubscribe();
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: user.name,
        email: user.email,
      });
      setSelectedRoles(getRolesArray(user.roles));
      setSelectedDepartmentIds(user.departmentIds || []);
      setSearchTerm('');
    }
  }, [open, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleRoleChange = (role: Role, checked: boolean) => {
    let newRoles: Role[];
    if (checked) {
      // Add the role and its implied lower roles
      newRoles = [...new Set([...selectedRoles, ...ROLE_HIERARCHY[role]])];
    } else {
      // Remove the role and its implied higher roles
      const rolesToRemove: Role[] = [];
      for (const r of ALL_ROLES) {
        if (ROLE_HIERARCHY[r].includes(role)) {
          rolesToRemove.push(r);
        }
      }
      newRoles = selectedRoles.filter(r => !rolesToRemove.includes(r));
    }
    setSelectedRoles(newRoles);
  };

  const handleToggleDepartment = (departmentId: string) => {
    setSelectedDepartmentIds((prev) =>
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
        roles: selectedRoles.length > 0 ? selectedRoles : ['Employee'], // Default to Employee if none selected
        departmentIds: selectedDepartmentIds,
    };
    
    // Legacy support: also update institution/division on the user object
    if (selectedDepartmentIds.length > 0) {
        const firstDept = allDepartments.find(d => d.id === selectedDepartmentIds[0]);
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
        onOpenChange(false);
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

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return allDepartments;
    return allDepartments.filter(d => formatDepartment(d).toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allDepartments, searchTerm]);

  const handleDepartmentAdded = useCallback((newDepartment: Department) => {
      // The listener will update allDepartments, we just need to select the new one
      if (!selectedDepartmentIds.includes(newDepartment.id)) {
        setSelectedDepartmentIds(prev => [...prev, newDepartment.id]);
      }
  }, [selectedDepartmentIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ubah Pengguna: {user.name}</DialogTitle>
          <DialogDescription>
            Perbarui detail untuk pengguna ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 flex-1 overflow-y-auto pr-4">
            {/* Left Column: User Details */}
            <div className="space-y-4 pt-2">
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
                                    onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                                />
                                <Label htmlFor={`role-${role}`} className="font-normal">{role}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Department Selection */}
            <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                    <Label>Departemen</Label>
                     <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start font-normal"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Pilih atau Tambah Departemen
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput 
                                    placeholder="Cari departemen..." 
                                    value={searchTerm}
                                    onValueChange={setSearchTerm}
                                />
                                <CommandList>
                                    <CommandEmpty>Tidak ada departemen ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredDepartments.map((dept) => (
                                            <CommandItem
                                                key={dept.id}
                                                value={formatDepartment(dept)}
                                                onSelect={() => {
                                                    handleToggleDepartment(dept.id);
                                                }}
                                            >
                                                <Checkbox
                                                    className="mr-2"
                                                    checked={selectedDepartmentIds.includes(dept.id)}
                                                    onCheckedChange={() => handleToggleDepartment(dept.id)}
                                                />
                                                {formatDepartment(dept)}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                                 <CommandGroup className="border-t">
                                    <SaveDepartmentDialog onDepartmentAdded={handleDepartmentAdded}>
                                        <CommandItem 
                                            className="w-full cursor-pointer"
                                            onSelect={(e) => { e.preventDefault(); }}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Tambah Departemen Baru
                                        </CommandItem>
                                    </SaveDepartmentDialog>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <ScrollArea className="h-52 w-full rounded-md border p-2">
                        <div className="space-y-2">
                        {selectedDepartmentIds.length > 0 ? (
                            selectedDepartmentIds.map(id => {
                                const dept = allDepartments.find(d => d.id === id);
                                if (!dept) return null;
                                return (
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
                                )
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada departemen yang dipilih.</p>
                        )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
            
            <DialogFooter className="md:col-span-2 pt-4 border-t">
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
