
'use client'

import type { User, Institution, Division } from "@/lib/types";
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
    institutions: Institution[];
    divisions: Division[];
}

export function UserManagementTab({ users, loading, institutions, divisions }: UserManagementTabProps) {
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
                                                    <EditUserDialog user={user} institutions={institutions} divisions={divisions} />
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
