
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User, Department } from '@/lib/types';
import { Loader2, PlusCircle, X, Search } from 'lucide-react';
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDepartment } from '@/lib/utils';
import { SaveDepartmentDialog } from './save-department-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';

interface EditUserDialogProps {
  user: User;
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, departments: initialDepartments, open, onOpenChange }: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
      role: user.role,
  });
  const [allDepartments, setAllDepartments] = useState(initialDepartments);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(user.departmentIds || []);
  const [searchTerm, setSearchTerm] = useState('');

  // Use a snapshot listener to keep allDepartments up to date
  useEffect(() => {
    const q = collection(db, "departments");
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
        role: user.role,
      });
      setSelectedDepartmentIds(user.departmentIds || []);
      setAllDepartments(initialDepartments);
      setSearchTerm('');
    }
  }, [open, user, initialDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleRoleChange = (value: 'Admin' | 'Manager' | 'Employee' | 'Super Admin') => {
      setFormData(prev => ({...prev, role: value}));
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
        role: formData.role,
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
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-4">
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
                    <Label htmlFor="role">Peran</Label>
                    <Select name="role" value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label>Departemen Terpilih</Label>
                    <ScrollArea className="h-64 w-full rounded-md border p-2">
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

            {/* Right Column: Department Selection */}
            <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                    <Label>Pilih Departemen</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari departemen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <ScrollArea className="h-[26.5rem] w-full rounded-md border">
                    <div className="p-2 space-y-1">
                        {filteredDepartments.map(dept => (
                            <div key={dept.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <Checkbox
                                    id={`dept-${dept.id}`}
                                    checked={selectedDepartmentIds.includes(dept.id)}
                                    onCheckedChange={() => handleToggleDepartment(dept.id)}
                                />
                                <Label htmlFor={`dept-${dept.id}`} className="font-normal flex-1 cursor-pointer">
                                    {formatDepartment(dept)}
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <SaveDepartmentDialog onDepartmentAdded={handleDepartmentAdded}>
                     <Button type="button" variant="outline" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Departemen Baru
                    </Button>
                </SaveDepartmentDialog>
            </div>
            
            <DialogFooter className="md:col-span-2 pt-4">
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
