
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { BudgetRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Paperclip, Trash2, UploadCloud, File as FileIcon } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};


interface ReportFormProps {
    request: BudgetRequest;
}

export function ReportForm({ request }: ReportFormProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [spentAmount, setSpentAmount] = useState(request.amount);
    const [notes, setNotes] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Anda harus login", variant: "destructive" });
            return;
        }
        if (files.length === 0) {
            toast({ title: "Anda harus mengunggah setidaknya satu bukti pembayaran.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        const storage = getStorage();
        
        try {
            const attachmentUploadPromises = files.map(async (file) => {
                const storageRef = ref(storage, `receipts/${request.id}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return {
                    url: downloadURL,
                    fileName: file.name,
                    type: file.type,
                };
            });

            const attachments = await Promise.all(attachmentUploadPromises);

            const reportData = {
                report: {
                    submittedBy: {
                        id: user.uid,
                        name: user.displayName || 'Unknown',
                    },
                    submittedAt: serverTimestamp(),
                    spentAmount,
                    notes,
                    attachments,
                },
                status: 'completed',
                updatedAt: serverTimestamp(),
            };
            
            const requestRef = doc(db, 'requests', request.id);
            await updateDoc(requestRef, reportData);

            toast({
                title: "Laporan Terkirim",
                description: "Laporan pengeluaran Anda telah berhasil diserahkan."
            });
            router.push('/');
            router.refresh();

        } catch (error) {
            console.error("Error submitting report: ", error);
            toast({ title: "Gagal Mengirim Laporan", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Pengeluaran</CardTitle>
                        <CardDescription>
                            Lengkapi laporan untuk permintaan: "{request.items[0]?.description || 'Permintaan Lama'}".
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                            <Label>Jumlah yang Disetujui</Label>
                            <p className="text-2xl font-bold">{formatRupiah(request.amount)}</p>
                         </div>
                        <div className="space-y-2">
                            <Label htmlFor="spentAmount">Jumlah Aktual yang Dibelanjakan</Label>
                            <Input
                                id="spentAmount"
                                type="number"
                                value={spentAmount}
                                onChange={(e) => setSpentAmount(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan Laporan</Label>
                            <Textarea
                                id="notes"
                                placeholder="Jelaskan penggunaan dana atau jika ada selisih..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                        <div className="space-y-4">
                            <Label>Bukti Pembayaran</Label>
                            <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center hover:border-primary cursor-pointer">
                                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground"/>
                                <p className="mt-2 text-sm text-muted-foreground">Tarik & Lepas file atau klik untuk menelusuri</p>
                                <p className="text-xs text-muted-foreground">Gambar atau PDF</p>
                                <Input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    accept="image/*,application/pdf"
                                    multiple
                                />
                            </div>
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">File yang akan diunggah:</h4>
                                    <ul className="space-y-2">
                                        {files.map((file, index) => (
                                            <li key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                                                <div className="flex items-center gap-2">
                                                    {file.type.startsWith('image/') ? (
                                                        <Image src={URL.createObjectURL(file)} alt={file.name} width={24} height={24} className="rounded-sm object-cover"/>
                                                    ) : (
                                                        <FileIcon className="h-6 w-6" />
                                                    )}
                                                    <span className="font-medium truncate max-w-xs">{file.name}</span>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kirim Laporan
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
