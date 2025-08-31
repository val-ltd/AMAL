
'use client'

import { useEffect, useState } from "react";
import { User, Institution, Division } from "@/lib/types";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTab } from "@/components/admin/user-management-tab";
import { InstitutionManagementTab } from "@/components/admin/institution-management-tab";
import { DivisionManagementTab } from "@/components/admin/division-management-tab";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SaveInstitutionDialog } from "@/components/admin/save-institution-dialog";
import { SaveDivisionDialog } from "@/components/admin/save-division-dialog";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  
  useEffect(() => {
    setLoading(true);
    const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
    const institutionsQuery = query(collection(db, 'institutions'), orderBy('name', 'asc'));
    const divisionsQuery = query(collection(db, 'divisions'), orderBy('name', 'asc'));

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        setLoading(false);
    });
    const unsubInstitutions = onSnapshot(institutionsQuery, (snapshot) => {
        setInstitutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institution)));
    });
    const unsubDivisions = onSnapshot(divisionsQuery, (snapshot) => {
        setDivisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Division)));
    });

    return () => {
        unsubUsers();
        unsubInstitutions();
        unsubDivisions();
    };
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
      case 'institutions':
        return <SaveInstitutionDialog />;
      case 'divisions':
        return <SaveDivisionDialog />;
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="institutions">Lembaga</TabsTrigger>
          <TabsTrigger value="divisions">Divisi</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
            <UserManagementTab users={users} loading={loading} institutions={institutions} divisions={divisions} />
        </TabsContent>
        <TabsContent value="institutions">
            <InstitutionManagementTab institutions={institutions} loading={loading} />
        </TabsContent>
        <TabsContent value="divisions">
            <DivisionManagementTab divisions={divisions} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
