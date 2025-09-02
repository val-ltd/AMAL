
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { User, Department, BudgetCategory, RequestItem } from '@/lib/types';
import { getManagers, getUser, getBudgetCategories } from '@/lib/data';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getDoc, doc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDepartment } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { appendRequestToSheet } from '@/lib/sheets';

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

export function NewRequestForm() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<User | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [items, setItems] = useState<RequestItem[]>([
    { id: '1', description: '', qty: 1, unit: '', price: 0, total: 0, category: '' },
  ]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchInitialData = async () => {
        if (authUser) {
            setLoading(true);
            try {
                const [userProfile, managerList, categoryList] = await Promise.all([
                  getUser(authUser.uid),
                  getManagers(),
                  getBudgetCategories()
                ]);

                setProfileData(userProfile);
                setManagers(managerList);
                setBudgetCategories(categoryList);

                if(userProfile?.departmentIds && userProfile.departmentIds.length > 0) {
                  const deptPromises = userProfile.departmentIds.map(id => getDoc(doc(db, 'departments', id)));
                  const deptDocs = await Promise.all(deptPromises);
                  const depts = deptDocs.map(d => ({id: d.id, ...d.data()}) as Department);
                  setUserDepartments(depts);
                  if(depts.length > 0) {
                      setSelectedDepartmentId(depts[0].id);
                  }
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setFormError("Gagal memuat data pengguna. Silakan muat ulang halaman.");
            } finally {
                setLoading(false);
            }
        }
    }
    fetchInitialData();
  }, [authUser]);
  
  const handleItemChange = (index: number, field: keyof RequestItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'qty' || field === 'price') {
      item.total = item.qty * item.price;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };
  
  const handleAddItem = () => {
    setItems([...items, { id: `${Date.now()}`, description: '', qty: 1, unit: '', price: 0, total: 0, category: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!supervisorId) {
      setFormError("Nama Atasan harus diisi.");
      return;
    }
     if (userDepartments.length > 0 && !selectedDepartmentId) {
      setFormError("Silakan pilih departemen untuk permintaan ini.");
      return;
    }
    if (items.some(item => !item.description || item.qty <= 0 || !item.category)) {
      setFormError("Setiap item harus memiliki Uraian, Kuantitas, dan Kategori.");
      return;
    }
    if (!profileData || !authUser) {
        setFormError("Data pengguna tidak ditemukan. Silakan login kembali.");
        return;
    }

    setIsSubmitting(true);

    try {
      const supervisor = managers.find(m => m.id === supervisorId);
      if (!supervisor) throw new Error("Supervisor yang dipilih tidak valid.");
      
      const selectedDepartment = userDepartments.find(d => d.id === selectedDepartmentId);
      if(!selectedDepartment && userDepartments.length > 0) throw new Error("Departemen yang dipilih tidak valid.");

      const newRequestData = {
          items: items.map(({id, ...rest}) => rest), // Remove temporary frontend ID
          amount: totalAmount,
          additionalInfo,
          institution: selectedDepartment?.lembaga || profileData.institution || '',
          division: selectedDepartment?.divisi || profileData.division || '',
          department: selectedDepartment ? {
              lembaga: selectedDepartment.lembaga,
              divisi: selectedDepartment.divisi,
              bagian: selectedDepartment.bagian || '',
              unit: selectedDepartment.unit || '',
          } : undefined,
          requester: {
              id: authUser.uid,
              name: profileData.name || 'Unknown User',
              avatarUrl: profileData.avatarUrl || '',
          },
          supervisor: {
              id: supervisor.id,
              name: supervisor.name,
          },
          status: 'pending' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'requests'), newRequestData);
      
      // We are not awaiting this. Let it run in the background.
      appendRequestToSheet({
        id: docRef.id,
        ...newRequestData,
        items: newRequestData.items.map(i => ({...i, id:''})),
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
      });

      toast({
          title: "Permintaan Terkirim",
          description: "Permintaan anggaran Anda telah berhasil dibuat.",
      });
      router.push('/');

    } catch (error) {
        console.error("Error creating request:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.';
        setFormError(errorMessage);
        toast({
            variant: 'destructive',
            title: 'Gagal Membuat Permintaan',
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isFormReady = !loading && !authLoading && profileData;

  if (authLoading || loading) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
      )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {profileData && (
          <Card className="bg-muted/50">
              <CardHeader>
                  <CardTitle className='text-base'>Informasi Pemohon</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama</span>
                      <span className="font-medium">{profileData.name}</span>
                  </div>
                   <div className="flex justify-between items-start">
                      <span className="text-muted-foreground pt-1">Departemen</span>
                      {userDepartments.length > 1 ? (
                          <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={!isFormReady || isSubmitting}>
                              <SelectTrigger id="department" className="w-auto max-w-[70%]">
                                  <SelectValue placeholder="Pilih departemen" />
                              </SelectTrigger>
                              <SelectContent>
                                  {userDepartments.map(dept => (
                                      <SelectItem key={dept.id} value={dept.id}>{formatDepartment(dept)}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      ) : (
                          <span className="font-medium text-right">
                              {userDepartments.length === 1 ? formatDepartment(userDepartments[0]) : 'N/A'}
                          </span>
                      )}
                  </div>
              </CardContent>
          </Card>
      )}
      
      <Card>
          <CardHeader>
              <CardTitle>Rincian Permintaan</CardTitle>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[30%]">Uraian</TableHead>
                          <TableHead className="w-[10%]">Jml</TableHead>
                          <TableHead className="w-[10%]">Satuan</TableHead>
                          <TableHead className="w-[15%]">Harga/Sat.</TableHead>
                          <TableHead className="w-[20%]">Kategori</TableHead>
                          <TableHead className="w-[15%] text-right">Jumlah</TableHead>
                          <TableHead className="w-12 p-0"></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {items.map((item, index) => (
                          <TableRow key={item.id} className="align-top">
                              <TableCell className="p-1">
                                  <Textarea value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Deskripsi item..." className="h-10" />
                              </TableCell>
                              <TableCell className="p-1">
                                  <Input type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', parseInt(e.target.value, 10) || 0)} />
                              </TableCell>
                              <TableCell className="p-1">
                                  <Input value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} placeholder="Pcs" />
                              </TableCell>
                               <TableCell className="p-1">
                                  <Input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', parseInt(e.target.value, 10) || 0)} placeholder="100000" />
                              </TableCell>
                               <TableCell className="p-1">
                                  <Select value={item.category} onValueChange={v => handleItemChange(index, 'category', v)}>
                                      <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                      <SelectContent>
                                           {budgetCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </TableCell>
                              <TableCell className="p-1 text-right align-middle">
                                  {formatRupiah(item.total)}
                              </TableCell>
                              <TableCell className="p-1 align-middle">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={items.length <= 1}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Baris
              </Button>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
               <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1">Informasi Tambahan</label>
                  <Textarea
                      id="additionalInfo"
                      placeholder="Informasi tambahan jika ada..."
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      disabled={!isFormReady || isSubmitting}
                  />
              </div>
              <div className="w-full flex justify-end">
                <div className="text-right text-lg font-bold">
                    <span>Total Pengajuan: </span>
                    <span>{formatRupiah(totalAmount)}</span>
                </div>
              </div>
          </CardFooter>
      </Card>
      
      <div>
        <label htmlFor="supervisor" className="block text-sm font-medium mb-1">Nama Atasan</label>
        <Select onValueChange={setSupervisorId} value={supervisorId} disabled={!isFormReady || isSubmitting}>
            <SelectTrigger id="supervisor">
                <SelectValue placeholder="Pilih seorang atasan untuk menyetujui" />
            </SelectTrigger>
            <SelectContent>
                {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      {!isFormReady && !loading && (
           <Alert variant="destructive">
              <AlertTitle>Profil Tidak Lengkap</AlertTitle>
              <AlertDescription>Profil Anda harus memiliki setidaknya satu departemen yang ditugaskan untuk membuat permintaan. Hubungi administrator.</AlertDescription>
          </Alert>
      )}

      {formError && (
          <Alert variant="destructive">
              <AlertTitle>Gagal Mengirim Permintaan</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
          </Alert>
      )}

      <Button type="submit" disabled={!isFormReady || isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kirim Permintaan
      </Button>
    </form>
  );
}
