
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
import { Loader2, Link as LinkIcon, PlusCircle, Trash2 } from 'lucide-react';
import { submitReport } from '@/lib/data';

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
    const [receiptLinks, setReceiptLinks] = useState<string[]>(['']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...receiptLinks];
        newLinks[index] = value;
        setReceiptLinks(newLinks);
    };

    const handleAddLink = () => {
        setReceiptLinks([...receiptLinks, '']);
    };

    const handleRemoveLink = (index: number) => {
        if (receiptLinks.length > 1) {
            setReceiptLinks(receiptLinks.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Anda harus login", variant: "destructive" });
            return;
        }
        if (receiptLinks.some(link => !link.trim())) {
            toast({ title: "Anda harus menyediakan setidaknya satu tautan bukti pembayaran.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        
        try {
            const reportData = {
                submittedBy: {
                    id: user.uid,
                    name: user.displayName || 'Unknown',
                },
                spentAmount,
                notes,
                attachments: receiptLinks.filter(link => link.trim()).map(link => ({
                    url: link,
                    fileName: 'Tautan Eksternal',
                    type: 'link',
                })),
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
                            Lengkapi laporan untuk permintaan: "{request.subject || 'Permintaan Lama'}".
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
                            <Label>Tautan Bukti Pembayaran</Label>
                            <div className="space-y-2">
                                {receiptLinks.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            type="url"
                                            placeholder="https://... (contoh: tautan Google Drive)"
                                            value={link}
                                            onChange={(e) => handleLinkChange(index, e.target.value)}
                                            required
                                        />
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleRemoveLink(index)}
                                            disabled={receiptLinks.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Tambah Tautan Lain
                            </Button>
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
