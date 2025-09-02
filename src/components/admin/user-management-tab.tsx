
'use client'

import { useState } from "react";
import type { User, Department, Role } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Building, Layers, Briefcase, Dot, ShieldCheck, ShieldAlert, DollarSign } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DeleteUserAlert } from "@/components/admin/delete-user-alert";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "../ui/separator";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

// Helper to ensure roles is always an array
const getRolesArray = (roles: any): Role[] => {
    if (Array.isArray(roles)) {
      return roles;
    }
    if (typeof roles === 'string') {
      return [roles as Role];
    }
    return [];
};

const getHighestRole = (roles: Role[]): Role => {
    if (roles.includes('Super Admin')) return 'Super Admin';
    if (roles.includes('Admin')) return 'Admin';
    if (roles.includes('Releaser')) return 'Releaser';
    if (roles.includes('Manager')) return 'Manager';
    return 'Employee';
}


function UserRow({ user, departments }: { user: User, departments: Department[]}) {
    const { toast } = useToast();
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [deleteUserAlertOpen, setDeleteUserAlertOpen] = useState(false);

    const userDepartmentRows = user.departmentIds && user.departmentIds.length > 0
      ? user.departmentIds.map(deptId => departments.find(d => d.id === deptId) || null)
      : [null];

    if (userDepartmentRows.length === 0) userDepartmentRows.push(null);

    const rowSpan = userDepartmentRows.length;
    
    const userRoles = getRolesArray(user.roles);
    const highestRole = getHighestRole(userRoles);

    const handleVerificationToggle = async (isVerified: boolean) => {
        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { isVerified });
            toast({
                title: 'Status Verifikasi Diperbarui',
                description: `${user.name} telah ${isVerified ? 'diverifikasi' : 'verifikasinya dicabut'}.`,
            });
        } catch (error) {
            console.error('Error toggling verification', error);
            toast({
                title: 'Gagal Memperbarui Status',
                description: 'Terjadi kesalahan saat memperbarui status verifikasi pengguna.',
                variant: 'destructive',
            });
        }
    };

    const getRoleBadgeVariant = (role: Role) => {
        switch(role) {
            case 'Super Admin': return 'destructive';
            case 'Admin': return 'destructive';
            case 'Releaser': return 'default';
            case 'Manager': return 'secondary';
            default: return 'outline';
        }
    }

    return (
        <>
            {userDepartmentRows.map((department, index) => (
                <TableRow key={`${user.id}-${department?.id || index}`} className={!user.isVerified ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : ''}>
                    {index === 0 && (
                        <TableCell rowSpan={rowSpan} className="align-top">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {user.name}
                                        {!user.isVerified && (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                                                <ShieldAlert className="mr-1 h-3 w-3" />
                                                Belum Diverifikasi
                                            </Badge>
                                        )}
                                    </div>
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
                           <Badge variant={getRoleBadgeVariant(highestRole)}>
                                {highestRole}
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
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`verify-switch-${user.id}`}
                                                checked={!!user.isVerified}
                                                onCheckedChange={handleVerificationToggle}
                                            />
                                            <Label htmlFor={`verify-switch-${user.id}`} className="font-normal cursor-pointer">
                                                {user.isVerified ? 'Terverifikasi' : 'Verifikasi Pengguna'}
                                            </Label>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
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
            {editUserDialogOpen && (
                <EditUserDialog 
                    open={editUserDialogOpen} 
                    onOpenChange={setEditUserDialogOpen} 
                    user={user} 
                    departments={departments} 
                />
            )}
            {deleteUserAlertOpen && (
                <DeleteUserAlert
                    open={deleteUserAlertOpen}
                    onOpenChange={setDeleteUserAlertOpen}
                    userId={user.id}
                />
            )}
        </>
    );
}

function UserCard({ user, departments }: { user: User, departments: Department[]}) {
    const { toast } = useToast();
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [deleteUserAlertOpen, setDeleteUserAlertOpen] = useState(false);
    
    const userDepartments = user.departmentIds && user.departmentIds.length > 0 
      ? user.departmentIds.map(deptId => departments.find(d => d.id === deptId) || null).filter(d => d !== null)
      : [];
      
    const userRoles = getRolesArray(user.roles);
    const highestRole = getHighestRole(userRoles);

    const handleVerificationToggle = async (isVerified: boolean) => {
        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { isVerified });
            toast({
                title: 'Status Verifikasi Diperbarui',
                description: `${user.name} telah ${isVerified ? 'diverifikasi' : 'verifikasinya dicabut'}.`,
            });
        } catch (error) {
            console.error('Error toggling verification', error);
            toast({
                title: 'Gagal Memperbarui Status',
                description: 'Terjadi kesalahan saat memperbarui status verifikasi pengguna.',
                variant: 'destructive',
            });
        }
    };

    const getRoleBadgeVariant = (role: Role) => {
        switch(role) {
            case 'Super Admin': return 'destructive';
            case 'Admin': return 'destructive';
            case 'Releaser': return 'default';
            case 'Manager': return 'secondary';
            default: return 'outline';
        }
    }


    return (
        <Card className={!user.isVerified ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
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
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`verify-switch-card-${user.id}`}
                                        checked={!!user.isVerified}
                                        onCheckedChange={handleVerificationToggle}
                                    />
                                    <Label htmlFor={`verify-switch-card-${user.id}`} className="font-normal cursor-pointer">
                                        {user.isVerified ? 'Terverifikasi' : 'Verifikasi'}
                                    </Label>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant={getRoleBadgeVariant(highestRole)}>
                        {highestRole}
                    </Badge>
                    {user.isVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-500">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Terverifikasi
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                            <ShieldAlert className="mr-1 h-3 w-3" />
                            Belum Diverifikasi
                        </Badge>
                    )}
                </div>
                <Separator />
                <h4 className="font-semibold">Departemen</h4>
                {userDepartments.length > 0 ? (
                    <div className="space-y-3">
                        {userDepartments.map((dept, index) => dept && (
                            <div key={dept.id} className="text-sm text-muted-foreground space-y-1">
                                <p className="flex items-center gap-2 font-medium text-foreground"><Building className="h-4 w-4 text-primary" /> {dept.lembaga}</p>
                                <p className="flex items-center gap-2 pl-6"><Layers className="h-4 w-4" /> {dept.divisi}</p>
                                {dept.bagian && <p className="flex items-center gap-2 pl-6"><Briefcase className="h-4 w-4" /> {dept.bagian}</p>}
                                {dept.unit && <p className="flex items-center gap-2 pl-6"><Dot className="h-4 w-4" /> {dept.unit}</p>}
                                {index < userDepartments.length -1 && <Separator className="mt-3"/>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Tidak ada departemen yang ditugaskan.</p>
                )}
            </CardContent>
            {editUserDialogOpen && (
                <EditUserDialog 
                    open={editUserDialogOpen} 
                    onOpenChange={setEditUserDialogOpen} 
                    user={user} 
                    departments={departments} 
                />
            )}
            {deleteUserAlertOpen && (
                <DeleteUserAlert
                    open={deleteUserAlertOpen}
                    onOpenChange={setDeleteUserAlertOpen}
                    userId={user.id}
                />
            )}
        </Card>
    );
}

interface UserManagementTabProps {
    users: User[];
    loading: boolean;
    departments: Department[];
}

export function UserManagementTab({ users, loading, departments }: UserManagementTabProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                    <CardDescription>Lihat, tambah, dan kelola pengguna sistem. Pengguna yang belum diverifikasi ditandai dengan warna kuning.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <p className="text-center text-muted-foreground">Memuat data pengguna...</p>
                    ) : users.length === 0 ? (
                        <p className="text-center text-muted-foreground h-24 flex items-center justify-center">Tidak ada pengguna ditemukan.</p>
                    ) : (
                        users.map((user) => (
                            <UserCard 
                                key={user.id} 
                                user={user} 
                                departments={departments} 
                            />
                        ))
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Pengguna</CardTitle>
                <CardDescription>Lihat, tambah, dan kelola pengguna sistem. Pengguna yang belum diverifikasi ditandai dengan warna kuning.</CardDescription>
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
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
