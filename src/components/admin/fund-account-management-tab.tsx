
'use client'

import type { FundAccount } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveFundAccountDialog } from "./save-fund-account-dialog";
import { DeleteFundAccountAlert } from "./delete-fund-account-alert";

interface FundAccountManagementTabProps {
    fundAccounts: FundAccount[];
    loading: boolean;
}

export function FundAccountManagementTab({ fundAccounts, loading }: FundAccountManagementTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Sumber Dana</CardTitle>
                <CardDescription>Kelola rekening yang digunakan sebagai sumber dana untuk pencairan.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Rekening</TableHead>
                            <TableHead>Nama Bank</TableHead>
                            <TableHead>Nomor Rekening</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Memuat data sumber dana...</TableCell>
                            </TableRow>
                        ) : fundAccounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">Tidak ada sumber dana ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            fundAccounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.accountName}</TableCell>
                                    <TableCell>{account.bankName}</TableCell>
                                    <TableCell>{account.accountNumber}</TableCell>
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
                                                    <SaveFundAccountDialog account={account} />
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                    <DeleteFundAccountAlert accountId={account.id} />
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
