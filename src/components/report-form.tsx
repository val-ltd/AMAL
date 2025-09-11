
'use client';

import { useState, useMemo, ChangeEvent, Fragment } from 'react';
import type { BudgetRequest, ReportAttachment, ExpenseItem, Unit } from "@/lib/types";
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
import { submitReport, getUnits } from '@/lib/data';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Loader2, Paperclip, Trash2, Plus, UploadCloud, File as FileIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useEffect } from 'react';
import { Progress } from './ui/progress';

interface ReportFormProps {
    request: BudgetRequest;
}

interface AttachmentFile extends ReportAttachment {
    isUploading: boolean;
    progress: number;
    file: File;
}

export function ReportForm({ request }: ReportFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
        { id: '1', description: '', qty: 1, unit: '', price: 0, total: 0 },
    ]);
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        getUnits().then(setUnits);
    }, []);

    const spentAmount = useMemo(() => {
        return expenseItems.reduce((sum, item) => sum + item.total, 0);
    }, [expenseItems]);

    const remainingAmount = request.amount - spentAmount;

    const handleItemChange = (index: number, field: keyof ExpenseItem, value: any) => {
        const newItems = [...expenseItems];
        const item = { ...newItems[index], [field]: value };
        
        if (field === 'qty' || field === 'price') {
            item.total = (Number(item.qty) || 0) * (Number(item.price) || 0);
        }
        
        newItems[index] = item;
        setExpenseItems(newItems);
    };
  
    const handleAddItem = () => {
        setExpenseItems([
            ...expenseItems, 
            { id: `${Date.now()}`, description: '', qty: 1, unit: '', price: 0, total: 0 }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (expenseItems.length <= 1) return;
        const newItems = expenseItems.filter((_, i) => i !== index);
        setExpenseItems(newItems);
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;

        const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
            file,
            fileName: file.name,
            type: file.type,
            url: '',
            isUploading: true,
            progress: 0,
        }));

        setAttachments(prev => [...prev, ...newAttachments]);

        // Upload each file
        newAttachments.forEach(async (attachment, index) => {
            const storage = getStorage();
            const storageRef = ref(storage, `reports/${request.id}/${Date.now()}_${attachment.file.name}`);

            try {
                const snapshot = await uploadBytes(storageRef, attachment.file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                setAttachments(prev => prev.map(att => 
                    att.fileName === attachment.fileName && att.isUploading ? { ...att, url: downloadURL, isUploading: false, progress: 100 } : att
                ));
            } catch (error) {
                console.error("Upload failed", error);
                toast({ title: "Upload Gagal", description: `Gagal mengunggah ${attachment.fileName}.`, variant: "destructive" });
                 setAttachments(prev => prev.filter(att => att.fileName !== attachment.fileName));
            }
        });
    };

    const handleRemoveAttachment = async (fileName: string) => {
        const attachmentToRemove = attachments.find(a => a.fileName === fileName);
        if (!attachmentToRemove) return;
        
        // Remove from state immediately
        setAttachments(prev => prev.filter(att => att.fileName !== fileName));

        // If file was already uploaded, delete from storage
        if (attachmentToRemove.url) {
            try {
                const storage = getStorage();
                const fileRef = ref(storage, attachmentToRemove.url);
                await deleteObject(fileRef);
            } catch (error) {
                console.error("Failed to delete file from storage:", error);
                toast({ title: "Gagal Menghapus File", description: `File ${fileName} mungkin masih ada di storage.`, variant: "destructive" });
            }
        }
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
        if (expenseItems.some(item => !item.description || item.qty <= 0 || !item.unit )) {
            toast({ title: "Data tidak lengkap.", description: "Setiap item pengeluaran harus memiliki Uraian, Jml, dan Satuan.", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const finalAttachments = attachments
                .filter(a => !a.isUploading && a.url)
                .map(({ url, fileName, type }) => ({ url, fileName, type }));

            await submitReport(request.id, {
                submittedBy: { id: user.uid, name: user.displayName || 'Unknown' },
                spentAmount,
                notes,
                expenseItems: expenseItems.map(({id, ...rest}) => rest),
                attachments: finalAttachments,
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
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[45%]">Uraian</TableHead>
                                <TableHead className="w-[10%]">Jml</TableHead>
                                <TableHead className="w-[15%]">Satuan</TableHead>
                                <TableHead className="w-[15%]">Harga/Sat.</TableHead>
                                <TableHead className="w-[15%] text-right">Jumlah</TableHead>
                                <TableHead className="w-12 p-0"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenseItems.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="p-1">
                                        <Input value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Item pengeluaran"/>
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <Input type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', parseInt(e.target.value, 10) || 0)} />
                                    </TableCell>
                                     <TableCell className="p-1">
                                        <Select value={item.unit} onValueChange={v => handleItemChange(index, 'unit', v)}>
                                            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                            <SelectContent>
                                                {units.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <Input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', parseInt(e.target.value, 10) || 0)} placeholder="100000"/>
                                    </TableCell>
                                    <TableCell className="p-1 text-right align-middle">{formatRupiah(item.total)}</TableCell>
                                    <TableCell className="p-1 align-middle">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={expenseItems.length <= 1}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Pengeluaran
                    </Button>
                </CardContent>
                 <CardFooter className="flex-col items-end gap-4 p-6 bg-muted/50">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Pengeluaran</span>
                            <span className="font-bold">{formatRupiah(spentAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg">
                            <span className="text-muted-foreground">Sisa Dana</span>
                            <span className={`font-bold ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatRupiah(remainingAmount)}
                            </span>
                        </div>
                         {remainingAmount < 0 && <p className="text-red-500 text-xs mt-1 text-right">Jumlah pengeluaran melebihi dana yang dicairkan.</p>}
                    </div>
                </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Lampiran</CardTitle>
                    <CardDescription>Unggah nota, kuitansi, atau bukti pengeluaran lainnya.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg">
                         <UploadCloud className="w-12 h-12 text-muted-foreground" />
                         <p className="mt-2 text-sm text-muted-foreground">Seret & lepas file di sini, atau klik untuk memilih file</p>
                         <Button asChild variant="outline" className="mt-4">
                             <Label htmlFor="file-upload">Pilih File</Label>
                         </Button>
                         <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileSelect} />
                     </div>
                     {attachments.length > 0 && (
                         <div className="mt-6 space-y-3">
                             {attachments.map(att => (
                                 <div key={att.fileName} className="flex items-center p-2 border rounded-md">
                                     <FileIcon className="h-5 w-5 mr-3 shrink-0" />
                                     <div className="flex-1">
                                         <p className="text-sm font-medium truncate">{att.fileName}</p>
                                         {att.isUploading ? (
                                             <Progress value={att.progress} className="h-2 mt-1" />
                                         ) : (
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                                Lihat File
                                            </a>
                                         )}
                                     </div>
                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(att.fileName)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                     </Button>
                                 </div>
                             ))}
                         </div>
                     )}
                 </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Catatan & Kesimpulan</CardTitle>
                </CardHeader>
                 <CardContent>
                     <Label htmlFor="notes">Catatan Tambahan</Label>
                    <Textarea
                        id="notes"
                        placeholder="Jelaskan kesimpulan penggunaan dana, atau detail lainnya..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
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
