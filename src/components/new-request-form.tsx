

'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Loader2, Plus, Save, Trash2, WalletCards } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { User, Department, BudgetCategory, RequestItem, UserBankAccount, Unit, BudgetRequest, MemoSubject, FundAccount, TransferType } from '@/lib/types';
import { getManagers, getUser, getBudgetCategories, getUnits, getRequest, getMemoSubjects, getFundAccounts, getTransferTypes } from '@/lib/data';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getDoc, doc, serverTimestamp, addDoc, collection, writeBatch, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDepartment } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { appendRequestToSheet } from '@/lib/sheets';
import { format, addMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Separator } from './ui/separator';

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

const generateBudgetPeriods = (date = new Date()) => {
    const periods = [];
    // Start from the current month
    periods.push(format(date, 'MMMM yyyy', { locale: localeId }));
    // Add the next 12 months
    for (let i = 1; i <= 12; i++) {
        periods.push(format(addMonths(date, i), 'MMMM yyyy', { locale: localeId }));
    }
    return periods;
}


export function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: authUser, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  
  const duplicateRequestId = searchParams.get('duplicate');
  const draftId = searchParams.get('draft');

  const [profileData, setProfileData] = useState<User | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [memoSubjects, setMemoSubjects] = useState<MemoSubject[]>([]);
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [transferTypes, setTransferTypes] = useState<TransferType[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [subjectPrefix, setSubjectPrefix] = useState('');
  const [subjectSuffix, setSubjectSuffix] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<string>(format(new Date(), 'MMMM yyyy', { locale: localeId }));
  const [items, setItems] = useState<RequestItem[]>([
    { id: '1', description: '', qty: 1, unit: '', price: 0, total: 0, category: '' },
  ]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [fundSourceId, setFundSourceId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [transferTypeId, setTransferTypeId] = useState<string>('');
  const [reimbursementAccountId, setReimbursementAccountId] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const budgetPeriodOptions = useMemo(() => generateBudgetPeriods(), []);

  useEffect(() => {
    const fetchInitialData = async () => {
        if (authUser) {
            setLoading(true);
            try {
                const idToFetch = draftId || duplicateRequestId;
                const [
                    userProfile, 
                    managerList, 
                    categoryList, 
                    unitList, 
                    subjectList, 
                    fundAccountList, 
                    reqToLoad,
                    tTypes
                ] = await Promise.all([
                  getUser(authUser.uid),
                  getManagers(),
                  getBudgetCategories(),
                  getUnits(),
                  getMemoSubjects(),
                  getFundAccounts(),
                  idToFetch ? getRequest(idToFetch) : Promise.resolve(null),
                  getTransferTypes()
                ]);

                if (!userProfile) {
                    setFormError("Gagal memuat data pengguna. Silakan muat ulang halaman.");
                    setLoading(false);
                    return;
                }

                setProfileData(userProfile);
                setManagers(managerList);
                setBudgetCategories(categoryList);
                setUnits(unitList);
                setMemoSubjects(subjectList);
                setFundAccounts(fundAccountList);
                setTransferTypes(tTypes);
                
                if (userProfile.bankAccounts && userProfile.bankAccounts.length > 0) {
                    setReimbursementAccountId(userProfile.bankAccounts[0].accountNumber);
                }

                let loadedDepartments: Department[] = [];
                if(userProfile.departmentIds && userProfile.departmentIds.length > 0) {
                  const deptPromises = userProfile.departmentIds.map(id => getDoc(doc(db, 'departments', id)));
                  const deptDocs = await Promise.all(deptPromises);
                  loadedDepartments = deptDocs.map(d => ({id: d.id, ...d.data()}) as Department).filter(d => !d.isDeleted);
                  setUserDepartments(loadedDepartments);
                  if (loadedDepartments.length > 0) {
                    setSelectedDepartmentId(loadedDepartments[0].id);
                  }
                }
                
                if (reqToLoad) {
                  const fullSubject = reqToLoad.subject || '';
                  const matchingPrefix = subjectList.find(s => fullSubject.startsWith(s.name));
                  if (matchingPrefix) {
                    setSubjectPrefix(matchingPrefix.name);
                    setSubjectSuffix(fullSubject.substring(matchingPrefix.name.length).trim());
                  } else {
                    setSubjectPrefix(fullSubject);
                    setSubjectSuffix('');
                  }

                  setBudgetPeriod(reqToLoad.budgetPeriod || format(new Date(), 'MMMM yyyy', { locale: localeId }));
                  setItems(reqToLoad.items.map((item, index) => ({...item, id: `${Date.now()}-${index}`})));
                  setAdditionalInfo(reqToLoad.additionalInfo || '');
                  setSupervisorId(reqToLoad.supervisor?.id || '');
                  setFundSourceId(reqToLoad.fundSourceId || '');
                  const loadedDept = loadedDepartments.find(d => d.lembaga === reqToLoad.institution && d.divisi === reqToLoad.division);
                  if (loadedDept) {
                      setSelectedDepartmentId(loadedDept.id);
                  }
                  setPaymentMethod(reqToLoad.paymentMethod || 'Cash');
                  setTransferTypeId(reqToLoad.transferTypeId || '');
                  setReimbursementAccountId(reqToLoad.reimbursementAccount?.accountNumber || '');
                  
                  const message = draftId ? "Draf dimuat." : "Permintaan diduplikasi.";
                  toast({title: message, description: "Data dari permintaan sebelumnya telah dimuat. Silakan periksa dan kirim."});
                }

            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setFormError("Gagal memuat data. Silakan muat ulang halaman.");
            } finally {
                setLoading(false);
            }
        } else if (!authLoading) {
            setLoading(false);
        }
    }
    fetchInitialData();
  }, [authUser, authLoading, duplicateRequestId, draftId, toast]);
  
  const handleItemChange = (index: number, field: keyof RequestItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'qty' || field === 'price') {
      item.total = (Number(item.qty) || 0) * (Number(item.price) || 0);
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
  
  const calculatedTransferFee = useMemo(() => {
    if (paymentMethod !== 'Transfer' || !fundSourceId || !reimbursementAccountId || !transferTypeId) {
        return 0;
    }
    
    const senderAccount = fundAccounts.find(acc => acc.id === fundSourceId);
    const receiverAccount = profileData?.bankAccounts?.find(acc => acc.accountNumber === reimbursementAccountId);
    const transferType = transferTypes.find(t => t.id === transferTypeId);

    if (!senderAccount || !receiverAccount || !transferType) return 0;
    
    // No fee for same bank
    if (senderAccount.bankName === receiverAccount.bankName) {
        return 0;
    }
    
    return transferType.fee;
  }, [paymentMethod, fundSourceId, reimbursementAccountId, transferTypeId, fundAccounts, profileData, transferTypes]);


  const totalAmount = useMemo(() => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    return itemsTotal + calculatedTransferFee;
  }, [items, calculatedTransferFee]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, status: 'pending' | 'draft') => {
    e.preventDefault();
    setFormError(null);
    
    let subject = subjectPrefix.trim();
    if (subjectPrefix !== 'ANGGARAN BULANAN' && subjectSuffix.trim()) {
        subject = `${subjectPrefix} ${subjectSuffix}`.trim();
    }


    // Validation
    const isSubmittingForApproval = status === 'pending';
    if (isSubmittingForApproval) {
        if (!subject) { setFormError("Perihal Memo harus diisi."); return; }
        if (!budgetPeriod) { setFormError("Periode Anggaran harus diisi."); return; }
        if (!supervisorId) { setFormError("Nama Atasan harus diisi."); return; }
        if (!fundSourceId) { setFormError("Sumber Dana harus diisi."); return; }
        if (userDepartments.length > 0 && !selectedDepartmentId) { setFormError("Silakan pilih departemen untuk permintaan ini."); return; }
        if (items.some(item => !item.description || item.qty <= 0 || !item.category || !item.unit)) { setFormError("Setiap item harus memiliki Uraian, Kuantitas, Satuan dan Kategori."); return; }
        if (paymentMethod === 'Transfer' && !reimbursementAccountId) { setFormError("Pilih rekening untuk pembayaran transfer."); return; }
        if (paymentMethod === 'Transfer' && !transferTypeId) { setFormError("Pilih jenis transfer."); return; }
    }
     if (!profileData || !authUser) { setFormError("Data pengguna tidak ditemukan. Silakan login kembali."); return; }


    setIsSubmitting(true);

    const supervisor = managers.find(m => m.id === supervisorId);
    const selectedDepartment = userDepartments.find(d => d.id === selectedDepartmentId);
    const reimbursementAccount = profileData.bankAccounts?.find(acc => acc.accountNumber === reimbursementAccountId);
    const transferType = transferTypes.find(t => t.id === transferTypeId);
    
    const requestObject: Omit<BudgetRequest, 'createdAt' | 'updatedAt' | 'releasedAt'> = {
        id: draftId || doc(collection(db, 'requests')).id,
        subject,
        budgetPeriod,
        items: items.map(({id, ...rest}) => rest),
        amount: totalAmount,
        additionalInfo,
        institution: selectedDepartment?.lembaga || profileData.institution || '',
        division: selectedDepartment?.divisi || profileData.division || '',
        department: selectedDepartment ? {
            lembaga: selectedDepartment.lembaga,
            divisi: selectedDepartment.divisi,
            bagian: selectedDepartment.bagian || null,
            unit: selectedDepartment.unit || null,
        } : undefined,
        requester: {
            id: authUser.uid,
            name: profileData.name || 'Unknown User',
            avatarUrl: profileData.avatarUrl || '',
        },
        supervisor: supervisor ? { id: supervisor.id, name: supervisor.name } : undefined,
        fundSourceId,
        paymentMethod,
        transferFee: calculatedTransferFee,
        status: status,
    };

    if (paymentMethod === 'Transfer') {
        if(reimbursementAccount) requestObject.reimbursementAccount = reimbursementAccount;
        if(transferType) {
          requestObject.transferTypeId = transferType.id;
          requestObject.transferType = transferType.name;
        }
    }

    try {
        const isUpdatingDraft = !!draftId;

        if (isSubmittingForApproval) {
            const fundAccount = fundAccounts.find(f => f.id === fundSourceId);

            const fullRequestDataForSheet = {
                ...requestObject,
                id: requestObject.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                requesterProfile: profileData,
                fundAccount: fundAccount,
            }

            const requestDataForFirestore = { ...requestObject, updatedAt: serverTimestamp() };
            
            const sheetUpdateResponse = await appendRequestToSheet(fullRequestDataForSheet as any);
            
            requestDataForFirestore.sheetStartRow = sheetUpdateResponse.startRow;
            requestDataForFirestore.sheetEndRow = sheetUpdateResponse.endRow;

            if (isUpdatingDraft) {
                await updateDoc(doc(db, 'requests', draftId), requestDataForFirestore);
            } else {
                await setDoc(doc(db, 'requests', requestObject.id), { ...requestDataForFirestore, createdAt: serverTimestamp() });
            }

            const batch = writeBatch(db);
            const supervisorNotification = { userId: supervisor!.id, type: 'new_request' as const, title: 'Permintaan Anggaran Baru', message: `${profileData.name} mengajukan permintaan baru (${formatRupiah(totalAmount)}) untuk ditinjau.`, requestId: requestObject.id, isRead: false, createdAt: serverTimestamp(), createdBy: requestObject.requester };
            batch.set(doc(collection(db, 'notifications')), supervisorNotification);
            
            const requesterNotification = { userId: authUser.uid, type: 'request_submitted' as const, title: 'Permintaan Terkirim', message: `Permintaan Anda (${formatRupiah(totalAmount)}) telah dikirim ke ${supervisor!.name} untuk ditinjau.`, requestId: requestObject.id, isRead: false, createdAt: serverTimestamp(), createdBy: { id: 'system', name: 'System' } };
            batch.set(doc(collection(db, 'notifications')), requesterNotification);

            await batch.commit();

            toast({ title: "Permintaan Terkirim", description: "Permintaan anggaran Anda telah berhasil dibuat dan disimpan di Google Sheets." });

        } else {
            // Logic for saving as draft
            const draftData = { ...requestObject, updatedAt: serverTimestamp() };
             if (isUpdatingDraft) {
                await updateDoc(doc(db, 'requests', draftId), draftData);
            } else {
                await setDoc(doc(db, 'requests', requestObject.id), { ...draftData, createdAt: serverTimestamp() });
            }
            toast({ title: "Draf Disimpan", description: "Permintaan Anda telah disimpan sebagai draf." });
        }
        
        router.push('/');

    } catch (error) {
        console.error("Error creating/updating request:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.';
        setFormError(errorMessage);
        const title = isSubmittingForApproval ? 'Gagal Membuat Permintaan' : 'Gagal Menyimpan Draf';
        const description = isSubmittingForApproval ? `Gagal menyimpan ke Google Sheets. Permintaan tidak dibuat. Kesalahan: ${errorMessage}` : errorMessage;
        toast({ variant: 'destructive', title, description });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isFormReady = !loading && !authLoading && profileData && userDepartments.length > 0;
  const isProfileIncomplete = !loading && !authLoading && profileData && userDepartments.length === 0;

  const renderItems = () => {
    if (isMobile) {
      return (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="relative p-4 border rounded-lg">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`desc-mobile-${item.id}`}>Item</Label>
                  <Input id={`desc-mobile-${item.id}`} value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Nama item..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`qty-mobile-${item.id}`}>Jml</Label>
                    <Input id={`qty-mobile-${item.id}`} type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', parseInt(e.target.value, 10) || 0)} />
                  </div>
                   <div>
                        <Label htmlFor={`unit-mobile-${item.id}`}>Satuan</Label>
                        <Select value={item.unit} onValueChange={v => handleItemChange(index, 'unit', v)}>
                          <SelectTrigger id={`unit-mobile-${item.id}`}><SelectValue placeholder="Pilih..." /></SelectTrigger>
                          <SelectContent>
                              {units.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                  <Label htmlFor={`price-mobile-${item.id}`}>Harga/Sat.</Label>
                  <Input id={`price-mobile-${item.id}`} type="number" value={item.price} onChange={e => handleItemChange(index, 'price', parseInt(e.target.value, 10) || 0)} placeholder="100000" />
                </div>
                <div>
                  <Label htmlFor={`cat-mobile-${item.id}`}>Kategori</Label>
                  <Select value={item.category} onValueChange={v => handleItemChange(index, 'category', v)}>
                    <SelectTrigger id={`cat-mobile-${item.id}`}><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    <SelectContent>
                         {budgetCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-right font-medium">
                  Jumlah: {formatRupiah(item.total)}
                </div>
              </div>
              {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="absolute top-1 right-1">
                      <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
              )}
            </div>
          ))}
        </div>
      )
    }

    return (
      <Table>
          <TableHeader>
              <TableRow>
                  <TableHead className="w-[30%]">Item</TableHead>
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
                          <Input value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Nama item..." />
                      </TableCell>
                      <TableCell className="p-1">
                          <Input type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', parseInt(e.target.value, 10) || 0)} />
                      </TableCell>
                      <TableCell className="p-1">
                           <Select value={item.unit} onValueChange={v => handleItemChange(index, 'unit', v)}>
                              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                              <SelectContent>
                                   {units.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
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
    );
  }

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
    <form className="space-y-6">
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
                      <span className="text-muted-foreground pt-1">Departemen*</span>
                      {userDepartments.length > 0 ? (
                          <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={isSubmitting}>
                              <SelectTrigger id="department" className="w-auto max-w-[70%]">
                                  <SelectValue placeholder="Pilih departemen..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {userDepartments.map(dept => (
                                      <SelectItem key={dept.id} value={dept.id}>{formatDepartment(dept)}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      ) : (
                          <span className="font-medium text-right text-red-500">
                             Anda tidak ditugaskan ke departemen mana pun.
                          </span>
                      )}
                  </div>
              </CardContent>
          </Card>
      )}

      <div>
        <Label htmlFor="budgetPeriod" className="block text-sm font-medium mb-1">Periode Anggaran*</Label>
        <Select onValueChange={setBudgetPeriod} value={budgetPeriod} disabled={isSubmitting}>
            <SelectTrigger id="budgetPeriod">
                <SelectValue placeholder="Pilih periode anggaran..." />
            </SelectTrigger>
            <SelectContent>
                {budgetPeriodOptions.map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject" className="block text-sm font-medium mb-1">Perihal Memo*</Label>
        <div className="flex gap-2">
            <Select onValueChange={setSubjectPrefix} value={subjectPrefix} disabled={isSubmitting}>
                <SelectTrigger id="subject-prefix" className="w-full">
                    <SelectValue placeholder="Pilih perihal memo..." />
                </SelectTrigger>
                <SelectContent>
                    {memoSubjects.map(sub => (
                        <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {subjectPrefix !== "ANGGARAN BULANAN" && (
              <Input 
                  id="subject-suffix"
                  value={subjectSuffix}
                  onChange={(e) => setSubjectSuffix(e.target.value)}
                  placeholder="Detail tambahan..."
                  className="w-full"
                  disabled={isSubmitting}
              />
            )}
        </div>
      </div>
      
      <Card className="mt-6">
          <CardHeader>
              <CardTitle>Rincian Permintaan</CardTitle>
          </CardHeader>
          <CardContent>
            {renderItems()}
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Tambah Item
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
                      disabled={isSubmitting}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <Label htmlFor="fundSource" className="block text-sm font-medium mb-1">Sumber Dana*</Label>
            <Select onValueChange={setFundSourceId} value={fundSourceId} disabled={isSubmitting}>
                <SelectTrigger id="fundSource">
                    <SelectValue placeholder="Pilih sumber dana..." />
                </SelectTrigger>
                <SelectContent>
                    {fundAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                            {account.accountName} ({account.accountNumber})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label htmlFor="supervisor" className="block text-sm font-medium mb-1">Nama Atasan*</Label>
            <Select onValueChange={setSupervisorId} value={supervisorId} disabled={isSubmitting}>
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
      </div>
      

      <Card>
        <CardHeader><CardTitle>Metode Pembayaran</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Cash" id="cash"/>
                    <Label htmlFor="cash">Tunai</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Transfer" id="transfer"/>
                    <Label htmlFor="transfer">Transfer</Label>
                </div>
            </RadioGroup>
            {paymentMethod === 'Transfer' && (
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="transferType">Jenis Transfer*</Label>
                            <Select value={transferTypeId} onValueChange={(v) => setTransferTypeId(v as any)}>
                                <SelectTrigger id="transferType">
                                    <SelectValue placeholder="Pilih jenis transfer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {transferTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name} ({formatRupiah(t.fee)})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="reimbursementAccount">Rekening Penerima*</Label>
                            {(profileData?.bankAccounts && profileData.bankAccounts.length > 0) ? (
                                <Select value={reimbursementAccountId} onValueChange={setReimbursementAccountId}>
                                    <SelectTrigger id="reimbursementAccount">
                                        <SelectValue placeholder="Pilih rekening..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {profileData.bankAccounts.map(acc => (
                                            <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                                                {acc.bankName} - {acc.accountNumber} (a/n {acc.accountHolderName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Alert variant="destructive" className="mt-2">
                                    <WalletCards className="h-4 w-4" />
                                    <AlertTitle>Tidak Ada Rekening Bank</AlertTitle>
                                    <AlertDescription>
                                        Anda tidak memiliki rekening bank yang tersimpan. Silakan tambahkan satu di halaman profil Anda untuk menggunakan metode transfer.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                    {calculatedTransferFee > 0 && (
                        <Alert>
                            <AlertDescription>
                                Biaya transfer sebesar {formatRupiah(calculatedTransferFee)} akan ditambahkan ke total pengajuan.
                            </AlertDescription>
                        </Alert>
                    )}
                 </div>
            )}
        </CardContent>
      </Card>

      {isProfileIncomplete && (
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

      <div className="flex flex-col sm:flex-row gap-2 mt-8">
            <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e as any, 'draft')}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
            >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan sebagai Draf
            </Button>
            <Button
                type="button"
                onClick={(e) => handleSubmit(e as any, 'pending')}
                disabled={!isFormReady || isSubmitting || !selectedDepartmentId}
                className="w-full sm:flex-1"
            >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim Permintaan
            </Button>
      </div>
    </form>
  );
}
