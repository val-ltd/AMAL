
'use client'

import { useState } from "react";
import type { User, Department } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DeleteUserAlert } from "@/components/admin/delete-user-alert";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";

interface UserManagementTabProps {
    users: User[];
    loading: boolean;
    departments: Department[];
    onDepartmentAdded: (newDepartment: Department) => void;
}

function UserRow({ user, departments, onDepartmentAdded }: { user: User, departments: Department[], onDepartmentAdded: (newDepartment: Department) => void }) {
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [deleteUserAlertOpen, setDeleteUserAlertOpen] = useState(false);

    const userDepartmentRows = user.departmentIds && user.departmentIds.length > 0 
      ? user.departmentIds.map(deptId => departments.find(d => d.id === deptId) || null)
      : [null];

    if (userDepartmentRows.length === 0) userDepartmentRows.push(null);

    const rowSpan = userDepartmentRows.length;

    return (
        <>
            {userDepartmentRows.map((department, index) => (
                <TableRow key={`${user.id}-${department?.id || index}`}>
                    {index === 0 && (
                        <TableCell rowSpan={rowSpan} className="align-top">
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
                    )}
                    <TableCell>{department?.lembaga || 'N/A'}</TableCell>
                    <TableCell>{department?.divisi || 'N/A'}</TableCell>
                    <TableCell>{department?.bagian || '-'}</TableCell>
                    <TableCell>{department?.unit || '-'}</TableCell>
                    {index === 0 && (
                        <TableCell rowSpan={rowSpan} className="align-top">
                            <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Manager' ? 'secondary' : 'outline'}>
                                {user.role}
                            </Badge>
                        </TableCell>
                    )}
                    {index === 0 && (
                        <TableCell rowSpan={rowSpan} className="text-right align-top">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                    <DropdownMenuItem onSelect={() => setEditUserDialogOpen(true)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Ubah Pengguna</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setDeleteUserAlertOpen(true)} className="text-red-600">
                                        <Trash className="mr-2 h-4 w-4" />
                                        <span>Hapus</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    )}
                </TableRow>
            ))}
            <EditUserDialog 
                open={editUserDialogOpen} 
                onOpenChange={setEditUserDialogOpen} 
                user={user} 
                departments={departments} 
                onDepartmentAdded={onDepartmentAdded} 
            />
            <DeleteUserAlert
                open={deleteUserAlertOpen}
                onOpenChange={setDeleteUserAlertOpen}
                userId={user.id}
            />
        </>
    );
}

export function UserManagementTab({ users, loading, departments, onDepartmentAdded }: UserManagementTabProps) {
    return (
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
                            <TableHead>Lembaga</TableHead>
                            <TableHead>Divisi</TableHead>
                            <TableHead>Bagian</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Memuat data pengguna...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">Tidak ada pengguna ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <UserRow 
                                    key={user.id} 
                                    user={user} 
                                    departments={departments} 
                                    onDepartmentAdded={onDepartmentAdded} 
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
