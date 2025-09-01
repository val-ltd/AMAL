
'use client'

import { useEffect, useState, useCallback } from "react";
import { User, Department } from "@/lib/types";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTab } from "@/components/admin/user-management-tab";
import { DepartmentManagementTab } from "@/components/admin/department-management-tab";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SaveDepartmentDialog } from "@/components/admin/save-department-dialog";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  
  useEffect(() => {
    setLoading(true);
    const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
    const departmentsQuery = query(collection(db, 'departments'), orderBy('lembaga', 'asc'), orderBy('divisi', 'asc'));

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        setLoading(false);
    });
    const unsubDepartments = onSnapshot(departmentsQuery, (snapshot) => {
        const depts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        setDepartments(depts);
    });

    return () => {
        unsubUsers();
        unsubDepartments();
    };
  }, []);

  const handleDepartmentAdded = useCallback((newDepartment: Department) => {
    // This optimistic update is no longer needed, Firestore's onSnapshot will handle it.
    // setDepartments(prev => [...prev, newDepartment]);
  }, []);

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
        return <SaveDepartmentDialog onDepartmentAdded={handleDepartmentAdded} />;
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="departments">Departemen</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
            <UserManagementTab users={users} loading={loading} departments={departments} onDepartmentAdded={handleDepartmentAdded} />
        </TabsContent>
        <TabsContent value="departments">
            <DepartmentManagementTab departments={departments} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
