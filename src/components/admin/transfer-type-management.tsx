
'use client'

import type { TransferType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteDataAlert } from "./delete-data-alert";
import { SaveTransferTypeDialog } from "./save-transfer-type-dialog";

interface TransferTypeManagementProps {
    transferTypes: TransferType[];
    loading: boolean;
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

export function TransferTypeManagement({ transferTypes, loading }: TransferTypeManagementProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Jenis Transfer</CardTitle>
                    <CardDescription>Kelola jenis transfer dan biayanya.</CardDescription>
                </div>
                <SaveTransferTypeDialog>
                    <Button size="sm" className="flex gap-2">
                        <PlusCircle /> Tambah
                    </Button>
                </SaveTransferTypeDialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Biaya</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">Memuat data...</TableCell>
                            </TableRow>
                        ) : transferTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">Tidak ada data ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            transferTypes.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium">{type.name}</TableCell>
                                    <TableCell>{formatRupiah(type.fee)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <SaveTransferTypeDialog transferType={type}>
                                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Ubah</DropdownMenuItem>
                                                </SaveTransferTypeDialog>
                                                <DeleteDataAlert 
                                                    id={type.id} 
                                                    collection="transferTypes"
                                                    name="Jenis Transfer"
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
