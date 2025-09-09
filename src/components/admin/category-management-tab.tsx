
'use client'

import type { BudgetCategory } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveDataDialog } from "./save-data-dialog";
import { DeleteDataAlert } from "./delete-data-alert";
import { usePagination } from "@/hooks/use-pagination";
import { Pagination } from "../ui/pagination";

interface CategoryManagementTabProps {
    categories: BudgetCategory[];
    loading: boolean;
}

export function CategoryManagementTab({ categories, loading }: CategoryManagementTabProps) {
    const { paginatedData, ...paginationProps } = usePagination(categories);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle>Kategori Anggaran</CardTitle>
                    <CardDescription>Kelola kategori untuk item permintaan.</CardDescription>
                </div>
                <SaveDataDialog dialogTitle="Kategori Anggaran" collection="budgetCategories">
                    <Button size="sm" className="flex gap-2">
                        <PlusCircle /> Tambah
                    </Button>
                </SaveDataDialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Kategori</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Memuat data kategori...</TableCell>
                            </TableRow>
                        ) : paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">Tidak ada kategori ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((cat) => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <SaveDataDialog dialogTitle="Kategori Anggaran" collection="budgetCategories" data={cat}>
                                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Ubah</DropdownMenuItem>
                                                </SaveDataDialog>
                                                <DeleteDataAlert id={cat.id} collection="budgetCategories" name="Kategori Anggaran">
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
