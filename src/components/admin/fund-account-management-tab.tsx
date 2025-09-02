
'use client'

import type { FundAccount } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveFundAccountDialog } from "./save-fund-account-dialog";
import { DeleteFundAccountAlert } from "./delete-fund-account-alert";
import { useIsMobile } from "@/hooks/use-mobile";

export function FundAccountManagementTab({ fundAccounts, loading }: { fundAccounts: FundAccount[], loading: boolean }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Daftar Sumber Dana</CardTitle>
                    <CardDescription>Kelola rekening yang digunakan sebagai sumber dana untuk pencairan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <p className="text-center">Memuat data...</p>
                    ) : fundAccounts.length === 0 ? (
                         <p className="text-center text-muted-foreground h-24 flex items-center justify-center">Tidak ada sumber dana ditemukan.</p>
                    ) : (
                        fundAccounts.map((account) => (
                             <Card key={account.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold">{account.accountName}</h3>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={e => e.preventDefault()}><SaveFundAccountDialog account={account} /></DropdownMenuItem>
                                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-500"><DeleteFundAccountAlert accountId={account.id} /></DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <p className="text-sm"><span className="font-semibold">{account.bankName}</span> - {account.accountNumber}</p>
                                <p className="text-sm text-muted-foreground">{account.namaLembaga}</p>
                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                    <p>Bendahara: {account.namaBendahara}</p>
                                    <p>Petugas: {account.petugas}</p>
                                </div>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        )
    }

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
                            <TableHead>Nama Lembaga</TableHead>
                            <TableHead>Nama Rekening</TableHead>
                            <TableHead>No. Rekening</TableHead>
                            <TableHead>Bank</TableHead>
                            <TableHead>Bendahara</TableHead>
                            <TableHead>Petugas</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Memuat data sumber dana...</TableCell>
                            </TableRow>
                        ) : fundAccounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">Tidak ada sumber dana ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            fundAccounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.namaLembaga}</TableCell>
                                    <TableCell>{account.accountName}</TableCell>
                                    <TableCell>{account.accountNumber}</TableCell>
                                    <TableCell>{account.bankName}</TableCell>
                                    <TableCell>{account.namaBendahara}</TableCell>
                                    <TableCell>{account.petugas}</TableCell>
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
