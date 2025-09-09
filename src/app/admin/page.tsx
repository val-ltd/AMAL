

'use client'

import { useEffect, useState } from "react";
import type { User, Department, BudgetCategory, FundAccount, Bank, Unit, MemoSubject, TransferType } from "@/lib/types";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserManagementTab } from "@/components/admin/user-management-tab";
import { DepartmentManagementTab } from "@/components/admin/department-management-tab";
import { ShieldAlert, PlusCircle } from "lucide-react";
import { CategoryManagementTab } from "@/components/admin/category-management-tab";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FundAccountManagementTab } from "@/components/admin/fund-account-management-tab";
import { BankManagement } from "@/components/admin/bank-management";
import { UnitManagement } from "@/components/admin/unit-management";
import { MemoSubjectManagement } from "@/components/admin/memo-subject-management";
import { useIsMobile } from "@/hooks/use-mobile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TransferTypeManagement } from "@/components/admin/transfer-type-management";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SaveDepartmentDialog } from "@/components/admin/save-department-dialog";
import { Button } from "@/components/ui/button";

function AdminPageContent({
    users,
    departments,
    categories,
    fundAccounts,
    banks,
    units,
    memoSubjects,
    transferTypes,
    loading
}: {
    users: User[],
    departments: Department[],
    categories: BudgetCategory[],
    fundAccounts: FundAccount[],
    banks: Bank[],
    units: Unit[],
    memoSubjects: MemoSubject[],
    transferTypes: TransferType[],
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
        { id: "transfer-types", title: "Jenis Transfer", component: <TransferTypeManagement transferTypes={transferTypes} loading={loading} /> },
    ];

    if (isMobile) {
        return (
             <Accordion type="single" collapsible defaultValue="users" className="w-full space-y-4">
                {sections.map(section => (
                    <AccordionItem value={section.id} key={section.id} className="border rounded-lg bg-card">
                        <AccordionTrigger className="p-4 hover:no-underline">
                           <span className="font-semibold">{section.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            {section.component}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
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
  const [transferTypes, setTransferTypes] = useState<TransferType[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  const userRoles = authUser?.profile?.roles;
  const isAuthorized = userRoles?.includes('Admin') || userRoles?.includes('Super Admin');
  
  useEffect(() => {
    if (!isAuthorized) {
        setLoading(false);
        return;
    }

    setLoading(true);

    const collections = [
        { name: 'users', setter: setUsers, orderBy: ['name', 'asc'] },
        { name: 'departments', setter: setDepartments, orderBy: ['lembaga', 'asc'] },
        { name: 'budgetCategories', setter: setCategories, orderBy: ['name', 'asc'] },
        { name: 'fundAccounts', setter: setFundAccounts, orderBy: ['accountName', 'asc'] },
        { name: 'banks', setter: setBanks, orderBy: ['name', 'asc'] },
        { name: 'units', setter: setUnits, orderBy: ['name', 'asc'] },
        { name: 'memoSubjects', setter: setMemoSubjects, orderBy: ['name', 'asc'] },
        { name: 'transferTypes', setter: setTransferTypes, orderBy: ['name', 'asc'] },
    ];
    
    const unsubscribers = collections.map(c => {
        const q = query(
            collection(db, c.name), 
            where('isDeleted', '!=', true),
            orderBy('isDeleted'), // Firestore requires an inequality filter to be on the first orderBy clause
            orderBy(c.orderBy[0], c.orderBy[1] as "asc" | "desc")
        );
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            c.setter(data as any);
        }, (error) => {
            console.error(`Error fetching ${c.name}:`, error);
        });
    });

    setLoading(false);

    return () => {
        unsubscribers.forEach(unsub => unsub())
    };
  }, [isAuthorized]);

  if (authLoading) {
    return <p>Memuat data otentikasi...</p>
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
  
  if (loading) {
    return <p>Memuat data administrasi...</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Administrasi</h1>
         <SaveDepartmentDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Departemen
            </Button>
         </SaveDepartmentDialog>
      </div>
        <AdminPageContent 
            users={users}
            departments={departments}
            categories={categories}
            fundAccounts={fundAccounts}
            banks={banks}
            units={units}
            memoSubjects={memoSubjects}
            transferTypes={transferTypes}
            loading={loading}
        />
    </div>
  );
}
