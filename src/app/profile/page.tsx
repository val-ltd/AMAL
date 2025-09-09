
'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User as UserIcon, Landmark, Building, Layers, Briefcase, Dot, Edit, Save, X, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { User, Department, UserBankAccount } from "@/lib/types";
import { getUser, getDepartmentsByIds } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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


export default function ProfilePage() {
    const { user: authUser, logout } = useAuth();
    const [profileData, setProfileData] = useState<User | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // State for inline editing
    const [formData, setFormData] = useState<Partial<User>>({});
    const [bankAccounts, setBankAccounts] = useState<UserBankAccount[]>([]);
    const [editingAccount, setEditingAccount] = useState<Partial<UserBankAccount> & { index?: number }>({});


    const fetchProfileData = async () => {
        if (authUser) {
            setLoading(true);
            const data = await getUser(authUser.uid);
            setProfileData(data);
            setFormData(data || {});
            setBankAccounts(data?.bankAccounts || []);
            if (data?.departmentIds && data.departmentIds.length > 0) {
                const deptData = await getDepartmentsByIds(data.departmentIds);
                setDepartments(deptData);
            } else {
                setDepartments([]);
            }
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProfileData();
    }, [authUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenderChange = (value: string) => {
      setFormData({ ...formData, gender: value as 'Male' | 'Female' });
    }
    
    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData(profileData || {});
        setBankAccounts(profileData?.bankAccounts || []);
    };

    const handleSaveProfile = async () => {
      if (!profileData) return;
      setIsSubmitting(true);
      const updatedData = { ...formData, bankAccounts };
      try {
        await updateDoc(doc(db, 'users', profileData.id), updatedData);
        toast({ title: "Profil Diperbarui", description: "Perubahan Anda telah disimpan." });
        setIsEditing(false);
        fetchProfileData();
      } catch (error) {
        toast({ title: "Gagal Menyimpan", description: "Terjadi kesalahan saat menyimpan profil.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    };
    
    const handleBankAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'accountNumber') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setEditingAccount({...editingAccount, [name]: numericValue });
        } else {
            setEditingAccount({...editingAccount, [name]: value });
        }
    }

    const handleSaveBankAccount = (index: number) => {
        const newBankAccounts = [...bankAccounts];
        if (!editingAccount.bankName || !editingAccount.accountHolderName || !editingAccount.accountNumber) {
            toast({ title: "Data Tidak Lengkap", description: "Harap isi semua field rekening bank.", variant: "destructive"});
            return;
        }

        if (index === -1) { // Adding new account
            if (bankAccounts.some(acc => acc.accountNumber === editingAccount.accountNumber)) {
                toast({ title: "Rekening Sudah Ada", description: "Nomor rekening ini sudah terdaftar.", variant: "destructive"});
                return;
            }
            newBankAccounts.push(editingAccount as UserBankAccount);
        } else { // Updating existing account
            newBankAccounts[index] = editingAccount as UserBankAccount;
        }
        setBankAccounts(newBankAccounts);
        setEditingAccount({}); // Reset editing state
    };
    
    const handleDeleteBankAccount = (index: number) => {
        const newBankAccounts = bankAccounts.filter((_, i) => i !== index);
        setBankAccounts(newBankAccounts);
    };


    if (loading) {
        return <ProfileSkeleton />
    }

    if (!profileData) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Tidak dapat memuat data profil.</p>
            </div>
        );
    }
    
    const roles = Array.isArray(profileData.roles) ? profileData.roles : [profileData.roles].filter(Boolean);

    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profileData.avatarUrl ?? ''} alt={profileData.name ?? ''} data-ai-hint="person" />
                    <AvatarFallback>{profileData.name?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{profileData.name}</CardTitle>
                <CardDescription>{profileData.email}</CardDescription>
                <div className="flex flex-wrap gap-1 justify-center pt-2">
                    {roles.map(role => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                    )) || <p className="font-medium">N/A</p>}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 rounded-lg border text-sm">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-semibold text-lg">Informasi Pribadi</h3>
                         {isEditing ? (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4 mr-2" /> Batal
                                </Button>
                                <Button size="sm" onClick={handleSaveProfile} disabled={isSubmitting}>
                                    <Save className="h-4 w-4 mr-2" /> Simpan
                                </Button>
                            </div>
                         ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4 mr-2" /> Ubah Profil
                            </Button>
                         )}
                    </div>
                     <div className="grid md:grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <Label className="text-muted-foreground">Nama Lengkap</Label>
                            {isEditing ? <Input name="name" value={formData.name || ''} onChange={handleInputChange} /> : <p className="font-medium">{profileData.name}</p>}
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Jenis Kelamin</Label>
                            {isEditing ? (
                                <Select name="gender" value={formData.gender} onValueChange={handleGenderChange}>
                                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Male">Laki-laki</SelectItem>
                                    <SelectItem value="Female">Perempuan</SelectItem>
                                  </SelectContent>
                                </Select>
                            ) : <p className="font-medium">{profileData.gender || 'N/A'}</p>}
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Nomor Telepon</Label>
                            {isEditing ? <Input name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} /> : <p className="font-medium">{profileData.phoneNumber || 'N/A'}</p>}
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Alamat</Label>
                            {isEditing ? <Input name="address" value={formData.address || ''} onChange={handleInputChange} /> : <p className="font-medium">{profileData.address || 'N/A'}</p>}
                        </div>
                        <div>
                            <Label className="text-muted-foreground">URL Tanda Tangan</Label>
                            {isEditing ? <Input name="signatureUrl" value={formData.signatureUrl || ''} onChange={handleInputChange} placeholder="https://example.com/signature.png" /> : <p className="font-medium">{profileData.signatureUrl || 'N/A'}</p>}
                        </div>
                     </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg border text-sm">
                     <h3 className="font-semibold text-lg mb-4">Rekening Bank</h3>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bank</TableHead>
                                <TableHead>No. Rekening</TableHead>
                                <TableHead>Atas Nama</TableHead>
                                {isEditing && <TableHead className="text-right">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bankAccounts.map((acc, index) => (
                                <TableRow key={index}>
                                    {editingAccount.index === index ? (
                                        <>
                                            <TableCell><Input name="bankName" value={editingAccount.bankName || ''} onChange={handleBankAccountChange} /></TableCell>
                                            <TableCell><Input name="accountNumber" value={editingAccount.accountNumber || ''} onChange={handleBankAccountChange} /></TableCell>
                                            <TableCell><Input name="accountHolderName" value={editingAccount.accountHolderName || ''} onChange={handleBankAccountChange} /></TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost" onClick={() => handleSaveBankAccount(index)}><Save className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" onClick={() => setEditingAccount({})}><X className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>{acc.bankName}</TableCell>
                                            <TableCell>{acc.accountNumber}</TableCell>
                                            <TableCell>{acc.accountHolderName}</TableCell>
                                            {isEditing && (
                                                <TableCell className="text-right">
                                                    <Button size="icon" variant="ghost" onClick={() => setEditingAccount({...acc, index})}><Edit className="h-4 w-4"/></Button>
                                                    <DeleteAccountAlert onConfirm={() => handleDeleteBankAccount(index)} />
                                                </TableCell>
                                            )}
                                        </>
                                    )}
                                </TableRow>
                            ))}
                            {editingAccount.index === -1 && (
                                <TableRow>
                                    <TableCell><Input name="bankName" placeholder="Nama Bank" value={editingAccount.bankName || ''} onChange={handleBankAccountChange} /></TableCell>
                                    <TableCell><Input name="accountNumber" placeholder="Hanya angka" value={editingAccount.accountNumber || ''} onChange={handleBankAccountChange} /></TableCell>
                                    <TableCell><Input name="accountHolderName" placeholder="Nama Pemilik" value={editingAccount.accountHolderName || ''} onChange={handleBankAccountChange} /></TableCell>
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" onClick={() => handleSaveBankAccount(-1)}><Save className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => setEditingAccount({})}><X className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                     </Table>
                     {isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setEditingAccount({ index: -1, bankName: '', accountHolderName: profileData.name, accountNumber: '', bankCode: '' })} disabled={editingAccount.index !== undefined}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Rekening
                        </Button>
                     )}
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                 <Button variant="destructive" className="w-full justify-start" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                </Button>
            </CardFooter>
        </Card>
        
        {departments.length > 0 && (
            departments.map(dept => (
                <Card key={dept.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">Informasi Departemen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <p><span className="text-muted-foreground">Lembaga:</span> {dept.lembaga}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-muted-foreground" />
                            <p><span className="text-muted-foreground">Divisi:</span> {dept.divisi}</p>
                        </div>
                       {dept.bagian && (
                         <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <p><span className="text-muted-foreground">Bagian:</span> {dept.bagian}</p>
                        </div>
                       )}
                       {dept.unit && (
                         <div className="flex items-center gap-3">
                            <Dot className="w-4 h-4 text-muted-foreground" />
                            <p><span className="text-muted-foreground">Unit:</span> {dept.unit}</p>
                        </div>
                       )}
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    )
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

function ProfileSkeleton() {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
            <CardHeader className="items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
                 <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-9 w-28" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="space-y-4 p-4 rounded-lg border">
                     <Skeleton className="h-7 w-48 mb-4" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
      </div>
    )
}
