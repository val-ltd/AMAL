
'use client'

import type { Institution } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveInstitutionDialog } from "./save-institution-dialog";
import { DeleteInstitutionAlert } from "./delete-institution-alert";

interface InstitutionManagementTabProps {
    institutions: Institution[];
    loading: boolean;
}

export function InstitutionManagementTab({ institutions, loading }: InstitutionManagementTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Lembaga</CardTitle>
                <CardDescription>Kelola lembaga yang terdaftar dalam sistem.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Lembaga</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Memuat data lembaga...</TableCell>
                            </TableRow>
                        ) : institutions.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">Tidak ada lembaga ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            institutions.map((inst) => (
                                <TableRow key={inst.id}>
                                    <TableCell className="font-medium">{inst.name}</TableCell>
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
                                                    <SaveInstitutionDialog institution={inst} />
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                   <DeleteInstitutionAlert institutionId={inst.id} />
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
