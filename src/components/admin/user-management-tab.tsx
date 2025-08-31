
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
import { formatDepartment } from "@/lib/utils";

interface UserManagementTabProps {
    users: User[];
    loading: boolean;
    departments: Department[];
    onDepartmentAdded: (newDepartment: Department) => void;
}

export function UserManagementTab({ users, loading, departments, onDepartmentAdded }: UserManagementTabProps) {

    const getDepartmentsForUser = (user: User) => {
        if (!user.departmentIds || user.departmentIds.length === 0) return "N/A";
        return user.departmentIds.map(id => {
            const dept = departments.find(d => d.id === id);
            return dept ? formatDepartment(dept) : "Departemen Dihapus";
        }).join(', ');
    }

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
                            <TableHead>Departemen</TableHead>
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
                                        <div className="font-medium max-w-xs whitespace-pre-wrap">{getDepartmentsForUser(user)}</div>
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
                                                    <EditUserDialog user={user} departments={departments} onDepartmentAdded={onDepartmentAdded} />
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
    );
}
