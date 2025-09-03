

'use client'

import { useEffect, useState } from "react";
import type { User, Department, BudgetCategory, FundAccount, Bank, Unit, MemoSubject } from "@/lib/types";
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserManagementTab } from "@/components/admin/user-management-tab";
import { DepartmentManagementTab } from "@/components/admin/department-management-tab";
import { Button } from "@/components/ui/button";
import { Edit, Save, ShieldAlert, X } from "lucide-react";
import { CategoryManagementTab } from "@/components/admin/category-management-tab";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FundAccountManagementTab } from "@/components/admin/fund-account-management-tab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BankManagement } from "@/components/admin/bank-management";
import { UnitManagement } from "@/components/admin/unit-management";
import { MemoSubjectManagement } from "@/components/admin/memo-subject-management";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

function TransferFeeCard() {
    const { toast } = useToast();
    const [transferFee, setTransferFee] = useState<number>(0);
    const [isEditingFee, setIsEditingFee] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'transfer'), docSnap => {
            if (docSnap.exists()) {
                setTransferFee(docSnap.data().fee);
            }
        });
        return () => unsub();
    }, []);

    const handleSaveFee = async () => {
        try {
            await updateDoc(doc(db, 'settings', 'transfer'), { fee: transferFee });
            toast({ title: "Biaya Transfer Diperbarui" });
            setIsEditingFee(false);
        } catch (error) {
            toast({ title: "Gagal menyimpan", variant: "destructive" });
        }
    };
    
    return (
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
    )
}

function AdminPageContent({
    users,
    departments,
    categories,
    fundAccounts,
    banks,
    units,
    memoSubjects,
    loading
}: {
    users: User[],
    departments: Department[],
    categories: BudgetCategory[],
    fundAccounts: FundAccount[],
    banks: Bank[],
    units: Unit[],
    memoSubjects: MemoSubject[],
    loading: boolean
}) {
    const isMobile = useIsMobile();

    const sections = [
        { id: "users", title: "Pengguna", component: <UserManagementTab users={users} loading={loading} departments={departments} /> },
        { id: "departments", title: "Departemen", component: <DepartmentManagementTab departments={departments} loading={loading} /> },
        { id: "fund-accounts", title: "Sumber Dana", component: <FundAccountManagementTab fundAccounts={fundAccounts} loading={loading} /> },
        { id: "categories", title: "Kategori Anggaran", component: <CategoryManagementTab categories={categories} loading={loading} /> },
        { id: "banks", title: "Bank", component: <BankManagement banks={banks} loading={loading} /> },
        { id: "units", title: "Satuan", component: <UnitManagement units={units} loading={loading} /> },
        { id: "memo-subjects", title: "Perihal Memo", component: <MemoSubjectManagement subjects={memoSubjects} loading={loading} /> },
        { id: "app-settings", title: "Pengaturan Aplikasi", component: <TransferFeeCard /> }
    ];

    if (isMobile) {
        return (
             <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users">Pengguna</TabsTrigger>
                    <TabsTrigger value="departments">Departemen</TabsTrigger>
                    <TabsTrigger value="settings">Lainnya</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-4">
                    <UserManagementTab users={users} loading={loading} departments={departments} />
                </TabsContent>
                <TabsContent value="departments" className="mt-4">
                    <DepartmentManagementTab departments={departments} loading={loading} />
                </TabsContent>
                <TabsContent value="settings" className="mt-4 space-y-8">
                     <FundAccountManagementTab fundAccounts={fundAccounts} loading={loading} />
                     <CategoryManagementTab categories={categories} loading={loading} />
                     <BankManagement banks={banks} loading={loading} />
                     <UnitManagement units={units} loading={loading} />
                     <MemoSubjectManagement subjects={memoSubjects} loading={loading} />
                     <TransferFeeCard />
                </TabsContent>
            </Tabs>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
            <aside className="sticky top-20 self-start h-[calc(100vh-10rem)]">
                <h3 className="text-lg font-semibold mb-4">Navigasi</h3>
                <ScrollArea className="h-full pr-4">
                    <ul className="space-y-2">
                        {sections.map(section => (
                            <li key={section.id}>
                                <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground text-sm">
                                    {section.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </aside>
            <main className="space-y-8">
                {sections.map(section => (
                    <section key={section.id} id={section.id}>
                        {section.component}
                    </section>
                ))}
            </main>
        </div>
    )
}


export default function AdminPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [memoSubjects, setMemoSubjects] = useState<MemoSubject[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  const userRoles = authUser?.profile?.roles;
  const isAuthorized = userRoles?.includes('Admin') || userRoles?.includes('Super Admin');
  
  useEffect(() => {
    if (!isAuthorized) {
        if (!authLoading) setLoading(false);
        return;
    }
    
    const createQuery = (collectionName: string, orderByField: string) => 
        query(collection(db, collectionName), where('isDeleted', '!=', true), orderBy(orderByField, 'asc'));

    const unsubscribers = [
      onSnapshot(query(collection(db, 'users'), where('isDeleted', '!=', true), orderBy('name', 'asc')), snapshot => 
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)))),
      onSnapshot(query(collection(db, 'departments'), where('isDeleted', '!=', true), orderBy('lembaga', 'asc'), orderBy('divisi', 'asc')), snapshot => 
        setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)))),
      onSnapshot(createQuery('budgetCategories', 'name'), snapshot => 
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory)))),
      onSnapshot(createQuery('fundAccounts', 'accountName'), snapshot => 
        setFundAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundAccount)))),
      onSnapshot(createQuery('banks', 'name'), snapshot =>
        setBanks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bank)))),
      onSnapshot(createQuery('units', 'name'), snapshot =>
        setUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit)))),
      onSnapshot(createQuery('memoSubjects', 'name'), snapshot =>
        setMemoSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MemoSubject)))),
    ];

    setLoading(false)

    return () => unsubscribers.forEach(unsub => unsub());
  }, [isAuthorized, authLoading]);

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
        <AdminPageContent 
            users={users}
            departments={departments}
            categories={categories}
            fundAccounts={fundAccounts}
            banks={banks}
            units={units}
            memoSubjects={memoSubjects}
            loading={loading}
        />
    </div>
  );
}

    