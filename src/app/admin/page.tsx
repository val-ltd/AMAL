
'use client'

import { useEffect, useState } from "react";
import { User, Department, BudgetCategory } from "@/lib/types";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTab } from "@/components/admin/user-management-tab";
import { DepartmentManagementTab } from "@/components/admin/department-management-tab";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShieldAlert } from "lucide-react";
import { SaveDepartmentDialog } from "@/components/admin/save-department-dialog";
import { CategoryManagementTab } from "@/components/admin/category-management-tab";
import { SaveCategoryDialog } from "@/components/admin/save-category-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  
  const userRoles = authUser?.profile?.roles;
  const isAuthorized = userRoles?.includes('Admin');
  
  useEffect(() => {
    if (isAuthorized) {
        setLoading(true);
        const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
        const departmentsQuery = query(collection(db, 'departments'), orderBy('lembaga', 'asc'), orderBy('divisi', 'asc'));
        const categoriesQuery = query(collection(db, 'budgetCategories'), orderBy('name', 'asc'));

        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
            if(activeTab === 'users') setLoading(false);
        });
        const unsubDepartments = onSnapshot(departmentsQuery, (snapshot) => {
            setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
            if(activeTab === 'departments') setLoading(false);
        });
        const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory)));
            if(activeTab === 'categories') setLoading(false);
        });

        return () => {
            unsubUsers();
            unsubDepartments();
            unsubCategories();
        };
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [activeTab, isAuthorized, authLoading]);

  if (authLoading) {
    return <p>Loading...</p>
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

  const renderAddButton = () => {
    switch (activeTab) {
      case 'users':
        return (
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Pengguna
            </Button>
        );
      case 'departments':
        return <SaveDepartmentDialog />;
      case 'categories':
        return <SaveCategoryDialog />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Administrasi</h1>
        {renderAddButton()}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setLoading(true); setActiveTab(value); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="departments">Departemen</TabsTrigger>
          <TabsTrigger value="categories">Kategori Anggaran</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
            <UserManagementTab users={users} loading={loading} departments={departments} />
        </TabsContent>
        <TabsContent value="departments">
            <DepartmentManagementTab departments={departments} loading={loading} />
        </TabsContent>
        <TabsContent value="categories">
            <CategoryManagementTab categories={categories} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
