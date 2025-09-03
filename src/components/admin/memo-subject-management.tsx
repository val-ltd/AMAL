
'use client'

import type { MemoSubject } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SaveDataDialog } from "./save-data-dialog";
import { DeleteDataAlert } from "./delete-data-alert";

interface MemoSubjectManagementProps {
    subjects: MemoSubject[];
    loading: boolean;
}

export function MemoSubjectManagement({ subjects, loading }: MemoSubjectManagementProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Perihal Memo</CardTitle>
                    <CardDescription>Kelola subjek untuk memo pencairan.</CardDescription>
                </div>
                <SaveDataDialog dialogTitle="Perihal Memo" collection="memoSubjects">
                    <Button size="sm" className="flex gap-2">
                        <PlusCircle /> Tambah
                    </Button>
                </SaveDataDialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Perihal</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Memuat data...</TableCell>
                            </TableRow>
                        ) : subjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">Tidak ada data ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            subjects.map((subject) => (
                                <TableRow key={subject.id}>
                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <SaveDataDialog dialogTitle="Perihal Memo" collection="memoSubjects" data={subject}>
                                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Ubah</DropdownMenuItem>
                                                </SaveDataDialog>
                                                <DeleteDataAlert id={subject.id} collection="memoSubjects" name="Perihal Memo">
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
