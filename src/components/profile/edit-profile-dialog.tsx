
'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User, UserBankAccount } from '@/lib/types';
import { Edit, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '../ui/scroll-area';
import { BankAccountForm } from './bank-account-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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


interface EditProfileDialogProps {
  user: User;
  onProfileUpdate: () => void;
}

export function EditProfileDialog({ user, onProfileUpdate }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
      name: user.name,
      gender: user.gender || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
  });
  const [bankAccounts, setBankAccounts] = useState<UserBankAccount[]>(user.bankAccounts || []);
  const [editingAccount, setEditingAccount] = useState<UserBankAccount | null>(null);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  

  useEffect(() => {
    if(open) {
        setFormData({
            name: user.name,
            gender: user.gender || '',
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
        });
        setBankAccounts(user.bankAccounts || []);
        setEditingAccount(null);
        setIsAccountFormOpen(false);
    }
  }, [open, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value as 'Male' | 'Female' }));
  }

  const handleSaveAccount = (account: UserBankAccount) => {
    if (editingAccount) {
      // Update existing account
      setBankAccounts(bankAccounts.map(acc => acc.accountNumber === editingAccount.accountNumber ? account : acc));
    } else {
      // Add new account
      if (bankAccounts.some(acc => acc.accountNumber === account.accountNumber)) {
          toast({ title: 'Rekening sudah ada', description: 'Nomor rekening ini sudah terdaftar.', variant: 'destructive' });
          return;
      }
      setBankAccounts([...bankAccounts, account]);
    }
    setIsAccountFormOpen(false);
    setEditingAccount(null);
  };
  
  const handleEditAccount = (account: UserBankAccount) => {
    setEditingAccount(account);
    setIsAccountFormOpen(true);
  };

  const handleAddNewAccount = () => {
    setEditingAccount(null);
    setIsAccountFormOpen(true);
  };
  
  const handleDeleteAccount = (accountNumber: string) => {
    setBankAccounts(bankAccounts.filter(acc => acc.accountNumber !== accountNumber));
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const updatedData: Partial<User> = {
        name: formData.name,
        gender: formData.gender as 'Male' | 'Female',
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        bankAccounts: bankAccounts,
    };

    try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, updatedData);
        toast({ title: 'Profil Diperbarui', description: `Profil Anda telah berhasil diperbarui.` });
        onProfileUpdate(); // Callback to refetch data on the parent page
        setOpen(false);
    } catch (error) {
        console.error("Error updating user: ", error);
        toast({
            title: 'Gagal Memperbarui Profil',
            description: 'Terjadi kesalahan yang tidak diketahui.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button variant="outline" className="w-full justify-start">
            <Edit className="mr-2 h-4 w-4" />
            <span>Ubah Profil</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ubah Profil</DialogTitle>
          <DialogDescription>
            Perbarui detail profil dan informasi rekening bank Anda.
          </DialogDescription>
        </DialogHeader>
        
        {isAccountFormOpen ? (
            <BankAccountForm
                account={editingAccount}
                onSave={handleSaveAccount}
                onCancel={() => setIsAccountFormOpen(false)}
            />
        ) : (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-6 -mr-6">
            <div className="space-y-6 py-4">
                {/* Personal Details */}
                <div className="space-y-4 p-4 rounded-lg border">
                    <h3 className="font-semibold text-lg">Detail Pribadi</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="gender">Jenis Kelamin</Label>
                            <Select name="gender" value={formData.gender} onValueChange={handleGenderChange}>
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Pilih Jenis Kelamin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Laki-laki</SelectItem>
                                    <SelectItem value="Female">Perempuan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                            <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                {/* Bank Accounts */}
                <div className="space-y-4 p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Rekening Bank</h3>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddNewAccount}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Rekening
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {bankAccounts.length > 0 ? (
                            bankAccounts.map(acc => (
                                <div key={acc.accountNumber} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                    <div>
                                        <p className="font-medium">{acc.accountHolderName}</p>
                                        <p className="text-sm text-muted-foreground">{acc.bankName} - {acc.accountNumber}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAccount(acc)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <DeleteAccountAlert onConfirm={() => handleDeleteAccount(acc.accountNumber)} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada rekening bank ditambahkan.</p>
                        )}
                    </div>
                </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-6 mt-auto border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


function DeleteAccountAlert({ onConfirm }: { onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Rekening Bank?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus rekening ini?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
                        Ya, Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
