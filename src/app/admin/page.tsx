
'use client'

import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { DeleteUserAlert } from "@/components/admin/delete-user-alert";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(userList);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Administrasi</h1>
        <Button disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Baru
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="institutions" disabled>Lembaga</TabsTrigger>
          <TabsTrigger value="divisions" disabled>Divisi</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
            <Card>
                <CardHeader>
                <CardTitle>Daftar Pengguna</CardTitle>
                <CardDescription>Lihat, tambah, dan kelola pengguna sistem.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Pengguna</TableHead>
                        <TableHead>Lembaga / Divisi</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">Memuat data pengguna...</TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{user.institution || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">{user.division || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Manager' ? 'secondary' : 'outline'}>
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <EditUserDialog user={user} />
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                            <DeleteUserAlert userId={user.id} />
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
