
'use client'

import type { Department } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveDepartmentDialog } from "./save-department-dialog";
import { DeleteDataAlert } from "./delete-data-alert";
import { usePagination } from "@/hooks/use-pagination";
import { Pagination } from "../ui/pagination";

interface DepartmentManagementTabProps {
    departments: Department[];
    loading: boolean;
}

export function DepartmentManagementTab({ departments, loading }: DepartmentManagementTabProps) {
    const { paginatedData, ...paginationProps } = usePagination(departments);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Departemen</CardTitle>
                <CardDescription>Kelola departemen yang terdaftar dalam sistem.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lembaga</TableHead>
                            <TableHead>Divisi</TableHead>
                            <TableHead>Bagian</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Memuat data departemen...</TableCell>
                            </TableRow>
                        ) : paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Tidak ada departemen ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((dept) => (
                                <TableRow key={dept.id}>
                                    <TableCell className="font-medium">{dept.lembaga}</TableCell>
                                    <TableCell>{dept.divisi}</TableCell>
                                    <TableCell>{dept.bagian || '-'}</TableCell>
                                    <TableCell>{dept.unit || '-'}</TableCell>
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
                                                <SaveDepartmentDialog department={dept}>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Ubah</DropdownMenuItem>
                                                </SaveDepartmentDialog>
                                                <DropdownMenuSeparator />
                                                <DeleteDataAlert id={dept.id} collection="departments" name="Departemen">
                                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Hapus</DropdownMenuItem>
                                                </DeleteDataAlert>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <Pagination {...paginationProps} />
            </CardFooter>
        </Card>
    );
}
