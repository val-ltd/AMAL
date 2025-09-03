
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
import { submitReport } from '@/lib/data';
import Image from 'next/image';

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          0.7 // 70% quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
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
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const selectedFiles = Array.from(e.target.files);
        const processedFiles: File[] = [];

        for (const file of selectedFiles) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast({
                    title: 'File Terlalu Besar',
                    description: `File "${file.name}" melebihi batas ukuran ${MAX_FILE_SIZE_MB}MB.`,
                    variant: 'destructive',
                });
                continue;
            }

            if (file.type.startsWith('image/')) {
                try {
                    const compressedFile = await compressImage(file);
                    processedFiles.push(compressedFile);
                } catch (error) {
                    console.error('Image compression error:', error);
                    toast({
                        title: 'Gagal Kompresi Gambar',
                        description: `Gagal memproses file "${file.name}".`,
                        variant: 'destructive'
                    });
                }
            } else {
                processedFiles.push(file);
            }
        }
        setFiles(prev => [...prev, ...processedFiles]);
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
                submittedBy: {
                    id: user.uid,
                    name: user.displayName || 'Unknown',
                },
                spentAmount,
                notes,
                attachments,
            };
            
            await submitReport(request.id, reportData);

            toast({
                title: "Laporan Terkirim",
                description: "Laporan pengeluaran Anda telah berhasil diserahkan."
            });
            router.push('/');
            router.refresh();

        } catch (error) {
            console.error("Error submitting report: ", error);
            toast({ title: "Gagal Mengirim Laporan", description: error instanceof Error ? error.message : "Terjadi kesalahan.", variant: "destructive" });
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
                            <Label>Bukti Pembayaran (Maks {MAX_FILE_SIZE_MB}MB per file)</Label>
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
