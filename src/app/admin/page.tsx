
'use client'

import { useEffect, useState } from "react";
import type { User, Department, BudgetCategory, FundAccount, Bank, Unit, MemoSubject } from "@/lib/types";
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserManagementTab } from "@/components/admin/user-management-tab";
import { DepartmentManagementTab } from "@/components/admin/department-management-tab";
import { Button } from "@/components/ui/button";
import { Edit, PlusCircle, Save, ShieldAlert, X } from "lucide-react";
import { SaveDepartmentDialog } from "@/components/admin/save-department-dialog";
import { CategoryManagementTab } from "@/components/admin/category-management-tab";
import { SaveCategoryDialog } from "@/components/admin/save-category-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FundAccountManagementTab } from "@/components/admin/fund-account-management-tab";
import { SaveFundAccountDialog } from "@/components/admin/save-fund-account-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BankManagement } from "@/components/admin/bank-management";
import { UnitManagement } from "@/components/admin/unit-management";
import { MemoSubjectManagement } from "@/components/admin/memo-subject-management";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [memoSubjects, setMemoSubjects] = useState<MemoSubject[]>([]);
  
  const [transferFee, setTransferFee] = useState<number>(0);
  const [isEditingFee, setIsEditingFee] = useState(false);

  const [loading, setLoading] = useState(true);
  
  const userRoles = authUser?.profile?.roles;
  const isAuthorized = userRoles?.includes('Admin') || userRoles?.includes('Super Admin');
  
  useEffect(() => {
    if (!isAuthorized) {
        if (!authLoading) setLoading(false);
        return;
    }
    
    const unsubscribers = [
      onSnapshot(query(collection(db, 'users'), orderBy('name', 'asc')), snapshot => 
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)))),
      onSnapshot(query(collection(db, 'departments'), orderBy('lembaga', 'asc'), orderBy('divisi', 'asc')), snapshot => 
        setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)))),
      onSnapshot(query(collection(db, 'budgetCategories'), orderBy('name', 'asc')), snapshot => 
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory)))),
      onSnapshot(query(collection(db, 'fundAccounts'), orderBy('accountName', 'asc')), snapshot => 
        setFundAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundAccount)))),
      onSnapshot(query(collection(db, 'banks'), orderBy('name', 'asc')), snapshot =>
        setBanks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bank)))),
      onSnapshot(query(collection(db, 'units'), orderBy('name', 'asc')), snapshot =>
        setUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit)))),
      onSnapshot(query(collection(db, 'memoSubjects'), orderBy('name', 'asc')), snapshot =>
        setMemoSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MemoSubject)))),
      onSnapshot(doc(db, 'settings', 'transfer'), docSnap => {
          if (docSnap.exists()) {
              setTransferFee(docSnap.data().fee);
          }
      })
    ];

    Promise.all(unsubscribers).then(() => setLoading(false));

    return () => unsubscribers.forEach(unsub => unsub());
  }, [isAuthorized, authLoading]);
  
  const handleSaveFee = async () => {
      try {
        await updateDoc(doc(db, 'settings', 'transfer'), { fee: transferFee });
        toast({ title: "Biaya Transfer Diperbarui" });
        setIsEditingFee(false);
      } catch (error) {
        toast({ title: "Gagal menyimpan", variant: "destructive" });
      }
  };

  if (authLoading || (loading && isAuthorized)) {
    return <p>Memuat data administrasi...</p>
  }
  
  if (!isAuthorized) {
    return (
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Akses Ditolak</AlertTitle>
            <AlertDescription>
                Anda tidak memiliki izin untuk melihat halaman ini. Hanya Admin yang dapat mengakses halaman ini.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Administrasi</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="lg:col-span-2 xl:col-span-3">
            <UserManagementTab users={users} loading={loading} departments={departments} />
        </div>
        <div className="lg:col-span-2 xl:col-span-3">
            <DepartmentManagementTab departments={departments} loading={loading} />
        </div>
        <div className="lg:col-span-2 xl:col-span-3">
            <FundAccountManagementTab fundAccounts={fundAccounts} loading={loading} />
        </div>
        
        <CategoryManagementTab categories={categories} loading={loading} />
        <BankManagement banks={banks} loading={loading} />
        <UnitManagement units={units} loading={loading} />
        <MemoSubjectManagement subjects={memoSubjects} loading={loading} />
        
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Aplikasi</CardTitle>
                <CardDescription>Kelola pengaturan global untuk aplikasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="transferFee">Biaya Transfer Bank</Label>
                        {isEditingFee ? (
                            <Input 
                                id="transferFee"
                                type="number"
                                value={transferFee}
                                onChange={e => setTransferFee(Number(e.target.value))}
                                className="mt-1 w-48"
                            />
                        ) : (
                            <p className="text-lg font-bold">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transferFee)}
                            </p>
                        )}
                    </div>
                    {isEditingFee ? (
                         <div className="flex gap-2">
                             <Button size="icon" variant="ghost" onClick={() => setIsEditingFee(false)}><X className="h-4 w-4" /></Button>
                             <Button size="icon" onClick={handleSaveFee}><Save className="h-4 w-4" /></Button>
                         </div>
                    ) : (
                        <Button size="icon" variant="outline" onClick={() => setIsEditingFee(true)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
