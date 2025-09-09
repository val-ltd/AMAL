
'use client';

import { useState } from 'react';
import type { BudgetRequest, ReportAttachment } from "@/lib/types";
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { formatRupiah, formatSimpleDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { submitReport } from '@/lib/data';
import { Loader2, Paperclip, Trash2 } from 'lucide-react';


interface ReportFormProps {
    request: BudgetRequest;
}

export function ReportForm({ request }: ReportFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [spentAmount, setSpentAmount] = useState<number>(request.amount);
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const remainingAmount = request.amount - spentAmount;

    const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // This would typically involve uploading to a storage service (e.g., Firebase Storage)
        // For this example, we'll simulate it by adding a dummy attachment.
        const file = e.target.files?.[0];
        if (file) {
            const newAttachment: ReportAttachment = {
                url: URL.createObjectURL(file), // Dummy URL
                fileName: file.name,
                type: file.type,
            };
            setAttachments(prev => [...prev, newAttachment]);
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user) {
            toast({ title: "Anda harus login untuk mengirim laporan.", variant: "destructive" });
            return;
        }
        if (spentAmount > request.amount) {
            toast({ title: "Jumlah pengeluaran tidak boleh melebihi jumlah permintaan.", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await submitReport(request.id, {
                submittedBy: { id: user.uid, name: user.displayName || 'Unknown' },
                spentAmount,
                notes,
                attachments,
            });
            toast({ title: "Laporan Terkirim", description: "Laporan pertanggungjawaban telah berhasil dikirim." });
            router.push('/');
        } catch (error) {
            console.error("Error submitting report:", error);
            toast({ title: "Gagal Mengirim Laporan", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Pertanggungjawaban (LPJ)</CardTitle>
                    <CardDescription>
                        Lengkapi formulir ini untuk melaporkan penggunaan dana dari permintaan anggaran yang telah dicairkan.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Detail Permintaan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            <TableRow><TableCell className="font-semibold">Perihal</TableCell><TableCell>{request.subject}</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Pemohon</TableCell><TableCell>{request.requester.name}</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Tanggal Dicairkan</TableCell><TableCell>{request.releasedAt ? formatSimpleDate(request.releasedAt) : '-'}</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Jumlah Dicairkan</TableCell><TableCell className="font-bold">{formatRupiah(request.amount)}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Rincian Pengeluaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="spentAmount">Jumlah Dana yang Digunakan</Label>
                        <Input
                            id="spentAmount"
                            type="number"
                            value={spentAmount}
                            onChange={(e) => setSpentAmount(Number(e.target.value))}
                            max={request.amount}
                        />
                    </div>
                    <div>
                        <Label htmlFor="remainingAmount">Sisa Dana</Label>
                        <Input
                            id="remainingAmount"
                            value={formatRupiah(remainingAmount)}
                            disabled
                            className={remainingAmount > 0 ? "text-green-600 font-bold" : remainingAmount < 0 ? "text-red-600 font-bold" : ""}
                        />
                         {remainingAmount < 0 && <p className="text-red-500 text-xs mt-1">Jumlah pengeluaran melebihi dana yang dicairkan.</p>}
                    </div>
                     <div>
                        <Label htmlFor="notes">Catatan Penggunaan Dana</Label>
                        <Textarea
                            id="notes"
                            placeholder="Jelaskan bagaimana dana digunakan..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                     <div>
                        <Label>Lampiran (Nota, Kuitansi, dll.)</Label>
                        <div className="mt-2 space-y-2">
                             <div className="flex items-center justify-center w-full">
                                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Paperclip className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Klik untuk mengunggah</span> atau seret dan lepas</p>
                                        <p className="text-xs text-muted-foreground">Gambar, PDF, Dokumen (MAX. 5MB)</p>
                                    </div>
                                    <Input id="dropzone-file" type="file" className="hidden" onChange={handleAttachmentUpload} />
                                </Label>
                            </div> 
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 text-sm rounded-md border">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{file.fileName}</a>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(index)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardFooter className="flex justify-end p-4">
                     <Button onClick={handleSubmit} disabled={isSubmitting || remainingAmount < 0}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kirim Laporan
                    </Button>
                </CardFooter>
            </Card>

        </div>
    );
}
