
'use client'

import type { User, Department } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { DeleteUserAlert } from "@/components/admin/delete-user-alert";

interface UserManagementTabProps {
    users: User[];
    loading: boolean;
    departments: Department[];
    onDepartmentAdded: (newDepartment: Department) => void;
}

export function UserManagementTab({ users, loading, departments, onDepartmentAdded }: UserManagementTabProps) {

    const userRows = users.flatMap(user => {
        if (!user.departmentIds || user.departmentIds.length === 0) {
            return [{ user, department: null, isFirst: true, rowSpan: 1 }];
        }
        return user.departmentIds.map((deptId, index) => {
            const department = departments.find(d => d.id === deptId);
            return { 
                user, 
                department: department || null,
                isFirst: index === 0,
                rowSpan: user.departmentIds?.length ?? 1,
            };
        });
    });


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
                        ) : (
                            userRows.map(({ user, department, isFirst, rowSpan }, index) => (
                                <TableRow key={`${user.id}-${department?.id || index}`}>
                                    {isFirst && (
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
                                    {isFirst && (
                                        <TableCell rowSpan={rowSpan} className="align-top">
                                            <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Manager' ? 'secondary' : 'outline'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {isFirst && (
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
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <EditUserDialog user={user} departments={departments} onDepartmentAdded={onDepartmentAdded} />
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                        <DeleteUserAlert userId={user.id} />
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
