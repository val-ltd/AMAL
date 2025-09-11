
'use client';

import { useState, useMemo, ChangeEvent, Fragment, useEffect } from 'react';
import type { BudgetRequest, ReportAttachment, ExpenseItem, Unit, ExpenseReceipt, BudgetCategory } from "@/lib/types";
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
import { submitReport, getUnits, getBudgetCategories } from '@/lib/data';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Loader2, Paperclip, Trash2, Plus, UploadCloud, File as FileIcon, FileUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';

interface ReportFormProps {
    request: BudgetRequest;
}

interface UploadingFile {
    file: File;
    progress: number;
    error?: string;
}

export function ReportForm({ request }: ReportFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [expenseReceipts, setExpenseReceipts] = useState<ExpenseReceipt[]>([
        { id: `${Date.now()}`, items: [{ id: `${Date.now()}-1`, description: '', qty: 1, unit: '', price: 0, total: 0, category: '' }], attachment: null },
    ]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<Record<string, UploadingFile>>({});

    useEffect(() => {
        const fetchData = async () => {
            const [fetchedUnits, fetchedCategories] = await Promise.all([
                getUnits(),
                getBudgetCategories(),
            ]);
            setUnits(fetchedUnits);
            setBudgetCategories(fetchedCategories);
        };
        fetchData();
    }, []);


    const spentAmount = useMemo(() => {
        return expenseReceipts.reduce((receiptTotal, receipt) => {
            const itemTotal = receipt.items.reduce((sum, item) => sum + item.total, 0);
            return receiptTotal + itemTotal;
        }, 0);
    }, [expenseReceipts]);

    const remainingAmount = request.amount - spentAmount;

    // --- Receipt Level Actions ---
    const handleAddReceipt = () => {
        const newId = `${Date.now()}`;
        setExpenseReceipts([
            ...expenseReceipts,
            { id: newId, items: [{ id: `${newId}-1`, description: '', qty: 1, unit: '', price: 0, total: 0, category: '' }], attachment: null },
        ]);
    };

    const handleRemoveReceipt = async (receiptId: string) => {
        const receiptToRemove = expenseReceipts.find(r => r.id === receiptId);
        if (receiptToRemove?.attachment) {
            // Also delete from storage
            try {
                const storage = getStorage();
                const fileRef = ref(storage, receiptToRemove.attachment.url);
                await deleteObject(fileRef);
            } catch (error) {
                console.error("Failed to delete file from storage:", error);
                toast({ title: "Gagal Menghapus File dari Storage", variant: "destructive" });
            }
        }
        setExpenseReceipts(expenseReceipts.filter(r => r.id !== receiptId));
    };

    // --- Item Level Actions ---
    const handleItemChange = (receiptIndex: number, itemIndex: number, field: keyof ExpenseItem, value: any) => {
        const newReceipts = [...expenseReceipts];
        const item = { ...newReceipts[receiptIndex].items[itemIndex], [field]: value };

        if (field === 'qty' || field === 'price') {
            item.total = (Number(item.qty) || 0) * (Number(item.price) || 0);
        }

        newReceipts[receiptIndex].items[itemIndex] = item;
        setExpenseReceipts(newReceipts);
    };

    const handleAddItemToReceipt = (receiptIndex: number) => {
        const newReceipts = [...expenseReceipts];
        const receiptId = newReceipts[receiptIndex].id;
        newReceipts[receiptIndex].items.push({
            id: `${receiptId}-${Date.now()}`,
            description: '', qty: 1, unit: '', price: 0, total: 0, category: ''
        });
        setExpenseReceipts(newReceipts);
    };

    const handleRemoveItemFromReceipt = (receiptIndex: number, itemIndex: number) => {
        const newReceipts = [...expenseReceipts];
        if (newReceipts[receiptIndex].items.length <= 1) return;
        newReceipts[receiptIndex].items = newReceipts[receiptIndex].items.filter((_, i) => i !== itemIndex);
        setExpenseReceipts(newReceipts);
    };

    // --- File Upload ---
    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>, receiptId: string) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const uniqueFileName = `${Date.now()}_${file.name}`;
        setUploadingFiles(prev => ({ ...prev, [receiptId]: { file, progress: 0 } }));

        const storage = getStorage();
        const storageRef = ref(storage, `reports/${request.id}/${uniqueFileName}`);

        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const newAttachment: ReportAttachment = {
                url: downloadURL,
                fileName: file.name,
                type: file.type,
            };

            setExpenseReceipts(prevReceipts => prevReceipts.map(r => 
                r.id === receiptId ? { ...r, attachment: newAttachment } : r
            ));
            
            // Clean up uploading state
            setUploadingFiles(prev => {
                const newUploading = { ...prev };
                delete newUploading[receiptId];
                return newUploading;
            });

        } catch (error) {
            console.error("Upload failed", error);
            toast({ title: "Upload Gagal", description: `Gagal mengunggah ${file.name}.`, variant: "destructive" });
            setUploadingFiles(prev => ({ ...prev, [receiptId]: { ...prev[receiptId], error: "Upload failed" } }));
        }
    };
    
    const handleRemoveAttachment = async (receiptId: string) => {
        const receipt = expenseReceipts.find(r => r.id === receiptId);
        if (!receipt?.attachment) return;

        const attachmentUrl = receipt.attachment.url;
        
        // Remove from state
        setExpenseReceipts(prev => prev.map(r => r.id === receiptId ? { ...r, attachment: null } : r));

        // Delete from storage
        try {
            const storage = getStorage();
            const fileRef = ref(storage, attachmentUrl);
            await deleteObject(fileRef);
        } catch (error) {
             console.error("Failed to delete file from storage:", error);
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
        for (const receipt of expenseReceipts) {
            if (!receipt.attachment) {
                toast({ title: `Bukti ${expenseReceipts.indexOf(receipt) + 1} belum diunggah.`, description: "Setiap rincian pengeluaran harus memiliki bukti (nota) yang diunggah.", variant: "destructive" });
                return;
            }
            if (receipt.items.some(item => !item.description || item.qty <= 0 || !item.unit || !item.category )) {
                 toast({ title: "Data tidak lengkap.", description: `Item pada Bukti ${expenseReceipts.indexOf(receipt) + 1} harus memiliki Uraian, Jml, Satuan, dan Kategori.`, variant: "destructive" });
                return;
            }
        }
        
        setIsSubmitting(true);
        try {
             const finalReceipts = expenseReceipts.map(receipt => ({
                attachment: receipt.attachment!,
                items: receipt.items.map(({ id, ...rest }) => rest), // Remove client-side ID
            }));

            await submitReport(request.id, {
                submittedBy: { id: user.uid, name: user.displayName || 'Unknown' },
                spentAmount,
                notes,
                receipts: finalReceipts,
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
                        Lengkapi formulir ini untuk melaporkan penggunaan dana. Kelompokkan rincian pengeluaran berdasarkan bukti pembayaran (nota/kuitansi).
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

            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">Rincian Pengeluaran</h2>
                {expenseReceipts.map((receipt, receiptIndex) => (
                     <Card key={receipt.id} className="relative">
                        <CardHeader className='flex-row items-center justify-between'>
                            <CardTitle className="text-lg">Bukti {receiptIndex + 1}</CardTitle>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveReceipt(receipt.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Lampiran Bukti (Nota/Kuitansi)</Label>
                                {receipt.attachment ? (
                                    <div className="flex items-center p-2 mt-1 border rounded-md bg-muted/50">
                                        <FileIcon className="h-5 w-5 mr-3 shrink-0" />
                                        <div className="flex-1">
                                            <a href={receipt.attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate">
                                                {receipt.attachment.fileName}
                                            </a>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(receipt.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ) : uploadingFiles[receipt.id] ? (
                                     <div className="mt-1 p-2 border rounded-md">
                                        <p className="text-sm font-medium truncate">{uploadingFiles[receipt.id].file.name}</p>
                                        <Progress value={uploadingFiles[receipt.id].progress} className="h-2 mt-1" />
                                     </div>
                                ) : (
                                    <div className="flex items-center mt-1">
                                        <Button asChild variant="outline" size="sm">
                                            <Label htmlFor={`upload-${receipt.id}`} className="cursor-pointer">
                                                <FileUp className="mr-2 h-4 w-4" /> Unggah File
                                            </Label>
                                        </Button>
                                        <Input id={`upload-${receipt.id}`} type="file" className="hidden" onChange={(e) => handleFileSelect(e, receipt.id)} />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <Label>Item Pengeluaran pada Bukti ini</Label>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30%]">Uraian</TableHead>
                                            <TableHead className="w-[10%]">Jml</TableHead>
                                            <TableHead className="w-[15%]">Satuan</TableHead>
                                            <TableHead className="w-[15%]">Harga/Sat.</TableHead>
                                            <TableHead className="w-[20%]">Kategori</TableHead>
                                            <TableHead className="w-[10%] text-right">Jumlah</TableHead>
                                            <TableHead className="w-12 p-0"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receipt.items.map((item, itemIndex) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="p-1"><Input value={item.description} onChange={e => handleItemChange(receiptIndex, itemIndex, 'description', e.target.value)} placeholder="Item pengeluaran"/></TableCell>
                                                <TableCell className="p-1"><Input type="number" value={item.qty} onChange={e => handleItemChange(receiptIndex, itemIndex, 'qty', parseInt(e.target.value, 10) || 0)} /></TableCell>
                                                <TableCell className="p-1">
                                                    <Select value={item.unit} onValueChange={v => handleItemChange(receiptIndex, itemIndex, 'unit', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {units.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="p-1"><Input type="number" value={item.price} onChange={e => handleItemChange(receiptIndex, itemIndex, 'price', parseInt(e.target.value, 10) || 0)} placeholder="100000"/></TableCell>
                                                <TableCell className="p-1">
                                                    <Select value={item.category} onValueChange={v => handleItemChange(receiptIndex, itemIndex, 'category', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                                        <SelectContent>
                                                             {budgetCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="p-1 text-right align-middle">{formatRupiah(item.total)}</TableCell>
                                                <TableCell className="p-1 align-middle">
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItemFromReceipt(receiptIndex, itemIndex)} disabled={receipt.items.length <= 1}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddItemToReceipt(receiptIndex)} className="mt-2">
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Item
                                </Button>
                            </div>
                        </CardContent>
                     </Card>
                ))}
                 <Button type="button" variant="secondary" onClick={handleAddReceipt} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Bukti Pembayaran
                </Button>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Total & Sisa Dana</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Jumlah Dicairkan</span>
                        <span className="font-bold">{formatRupiah(request.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total Pengeluaran</span>
                        <span className="font-bold">{formatRupiah(spentAmount)}</span>
                    </div>
                     <div className={`flex justify-between items-center text-xl font-bold ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>Sisa Dana</span>
                        <span>{formatRupiah(remainingAmount)}</span>
                    </div>
                    {remainingAmount < 0 && <p className="text-red-500 text-xs mt-1 text-right">Jumlah pengeluaran melebihi dana yang dicairkan.</p>}
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
