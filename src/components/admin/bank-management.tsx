
'use client'

import type { Bank } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveBankDialog } from "./save-bank-dialog";
import { DeleteDataAlert } from "./delete-data-alert";

interface BankManagementProps {
    banks: Bank[];
    loading: boolean;
}

export function BankManagement({ banks, loading }: BankManagementProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Daftar Bank</CardTitle>
                    <CardDescription>Kelola bank dan kode transfer.</CardDescription>
                </div>
                <SaveBankDialog>
                    <Button size="sm" className="flex gap-2">
                        <PlusCircle /> Tambah
                    </Button>
                </SaveBankDialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Bank</TableHead>
                            <TableHead>Kode</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">Memuat data bank...</TableCell>
                            </TableRow>
                        ) : banks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">Tidak ada bank ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            banks.map((bank) => (
                                <TableRow key={bank.id}>
                                    <TableCell className="font-medium">{bank.name}</TableCell>
                                    <TableCell>{bank.code}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <SaveBankDialog bank={bank}>
                                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Ubah</DropdownMenuItem>
                                                </SaveBankDialog>
                                                <DropdownMenuSeparator />
                                                <DeleteDataAlert 
                                                    id={bank.id} 
                                                    collection="banks"
                                                    name="Bank"
                                                >
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
        </Card>
    );
}
