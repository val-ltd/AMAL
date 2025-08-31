
'use client'

import type { Division } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveDivisionDialog } from "./save-division-dialog";
import { DeleteDivisionAlert } from "./delete-division-alert";

interface DivisionManagementTabProps {
    divisions: Division[];
    loading: boolean;
}

export function DivisionManagementTab({ divisions, loading }: DivisionManagementTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Divisi</CardTitle>
                <CardDescription>Kelola divisi yang terdaftar dalam sistem.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Divisi</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Memuat data divisi...</TableCell>
                            </TableRow>
                        ) : divisions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">Tidak ada divisi ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            divisions.map((div) => (
                                <TableRow key={div.id}>
                                    <TableCell className="font-medium">{div.name}</TableCell>
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
                                                    <SaveDivisionDialog division={div} />
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                    <DeleteDivisionAlert divisionId={div.id} />
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
