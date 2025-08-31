
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { getSuggestionsAction } from '@/app/actions';
import { Loader2, Sparkles, Wand2, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { User, Department } from '@/lib/types';
import { getManagers, getUser } from '@/lib/data';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { budgetCategories } from '@/lib/categories';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { addDoc, collection, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDepartment } from '@/lib/utils';

export function NewRequestForm() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<User | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);


  useEffect(() => {
    const fetchInitialData = async () => {
        if (authUser) {
            setLoading(true);
            try {
                const userProfile = await getUser(authUser.uid);
                setProfileData(userProfile);

                if(userProfile?.departmentIds && userProfile.departmentIds.length > 0) {
                  const deptPromises = userProfile.departmentIds.map(id => getDoc(doc(db, 'departments', id)));
                  const deptDocs = await Promise.all(deptPromises);
                  const depts = deptDocs.map(d => ({id: d.id, ...d.data()}) as Department);
                  setUserDepartments(depts);
                  // set the first department as the default selected one
                  if(depts.length > 0) {
                      setSelectedDepartmentId(depts[0].id);
                  }
                }

                const managerList = await getManagers();
                setManagers(managerList);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation
    if (!category || !amount || !description || !supervisorId) {
      setFormError("Semua kolom harus diisi.");
      return;
    }
     if (userDepartments.length > 1 && !selectedDepartmentId) {
      setFormError("Silakan pilih departemen untuk permintaan ini.");
      return;
    }
    if (description.length < 10) {
      setFormError("Deskripsi harus memiliki setidaknya 10 karakter.");
      return;
    }
    if (!profileData || !authUser) {
        setFormError("Data pengguna tidak ditemukan. Silakan login kembali.");
        return;
    }

    setIsSubmitting(true);

    try {
        const supervisor = managers.find(m => m.id === supervisorId);
        if (!supervisor) {
            throw new Error("Supervisor yang dipilih tidak valid.");
        }
        
        const selectedDepartment = userDepartments.find(d => d.id === selectedDepartmentId);
        if(!selectedDepartment) {
            throw new Error("Departemen yang dipilih tidak valid.");
        }

        // 2. Prepare data object
        const newRequestData = {
            category,
            amount: Number(amount),
            description,
            institution: selectedDepartment.lembaga,
            division: selectedDepartment.divisi,
            department: {
                lembaga: selectedDepartment.lembaga,
                divisi: selectedDepartment.divisi,
                bagian: selectedDepartment.bagian || '',
                unit: selectedDepartment.unit || '',
            },
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

        // 3. Save to Firestore
        await addDoc(collection(db, 'requests'), newRequestData);

        // 4. Show success and redirect
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
  
  const handleGetSuggestions = async () => {
    setIsSuggesting(true);
    setSuggestions([]);
    const result = await getSuggestionsAction(description);
    setIsSuggesting(false);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      setSuggestions(result.suggestions);
    }
  };

  const isFormReady = !loading && !authLoading && profileData && userDepartments.length > 0;

  if (authLoading || loading) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
      )
  }

  const primaryDepartment = useMemo(() => {
    if (userDepartments.length === 0) return 'N/A';
    if (userDepartments.length === 1) return formatDepartment(userDepartments[0]);
    // If multiple departments, let them select. The info card will show a generic message.
    return `${userDepartments.length} departemen ditugaskan`;
  }, [userDepartments]);

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
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Departemen</span>
                      <span className="font-medium text-right">
                        {primaryDepartment}
                      </span>
                  </div>
              </CardContent>
          </Card>
      )}

      {userDepartments.length > 1 && (
        <div>
            <label htmlFor="department" className="block text-sm font-medium mb-1">Pilih Departemen untuk Permintaan Ini</label>
            <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={!isFormReady || isSubmitting}>
                <SelectTrigger id="department">
                    <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                    {userDepartments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{formatDepartment(dept)}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">Kategori Permintaan</label>
        <Select onValueChange={setCategory} value={category} disabled={!isFormReady || isSubmitting}>
            <SelectTrigger id="category">
                <SelectValue placeholder="Pilih kategori anggaran" />
            </SelectTrigger>
            <SelectContent>
                {budgetCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
        <Input 
          id="amount" 
          type="number" 
          placeholder="cth., 15000000" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!isFormReady || isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Deskripsi & Justifikasi</label>
        <Textarea
          id="description"
          placeholder="Berikan deskripsi terperinci tentang permintaan dan mengapa itu diperlukan."
          className="min-h-[120px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isFormReady || isSubmitting}
        />
      </div>
      
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
      
      <div className="space-y-4">
          <Button type="button" variant="outline" onClick={handleGetSuggestions} disabled={isSuggesting || !description || !isFormReady}>
          {isSuggesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
              <Wand2 className="mr-2 h-4 w-4" />
          )}
          Dapatkan Saran AI
          </Button>
          {suggestions.length > 0 && (
          <Card className="bg-accent/50">
              <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" />Saran</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                      ))}
                  </ul>
              </CardContent>
          </Card>
          )}
      </div>

      {!isFormReady && !loading && (
           <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Profil Tidak Lengkap</AlertTitle>
              <AlertDescription>Profil Anda harus memiliki setidaknya satu departemen yang ditugaskan untuk membuat permintaan. Hubungi administrator.</AlertDescription>
          </Alert>
      )}

      {formError && (
          <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Gagal Mengirim Permintaan</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
          </Alert>
      )}

      <Button type="submit" disabled={!isFormReady || isSubmitting} className="w-full">
          {(isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kirim Permintaan
      </Button>
    </form>
  );
}
