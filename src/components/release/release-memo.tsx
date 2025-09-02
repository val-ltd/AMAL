
'use client';

import type { BudgetRequest, FundAccount } from "@/lib/types";
import Image from "next/image";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useState }from 'react';
import { useToast } from "@/hooks/use-toast";
import { markRequestsAsReleased } from "@/lib/data";
import { Loader2, DollarSign } from "lucide-react";
import { Separator } from "../ui/separator";

interface ReleaseMemoProps {
    requests: BudgetRequest[];
    lembaga: string;
    fundAccount: FundAccount;
    isPreview?: boolean; // Added to distinguish between preview and final print
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
};

const numberToWords = (num: number): string => {
    const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
    const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
    const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

    if (num === 0) return 'Nol';

    let words = '';

    if (num >= 1000000000) {
        words += numberToWords(Math.floor(num / 1000000000)) + ' Miliar ';
        num %= 1000000000;
    }

    if (num >= 1000000) {
        words += numberToWords(Math.floor(num / 1000000)) + ' Juta ';
        num %= 1000000;
    }
    
    if (num >= 1000) {
        if (num < 2000) words += 'Seribu ';
        else words += numberToWords(Math.floor(num / 1000)) + ' Ribu ';
        num %= 1000;
    }

    if (num >= 100) {
        if (num < 200) words += 'Seratus ';
        else words += ones[Math.floor(num / 100)] + ' Ratus ';
        num %= 100;
    }

    if (num >= 20) {
        words += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
    } else if (num >= 10) {
        words += teens[num - 10] + ' ';
        num = 0;
    }

    if (num > 0) {
        words += ones[num] + ' ';
    }
    
    return words.trim();
};

function MemoHeader() {
    return (
        <div className="flex items-center justify-between pb-4 border-b-4 border-black px-4">
            <Image src="/logo-wm.png" alt="Wadi Mubarak Logo" width={80} height={80} />
            <div className="text-center">
                <h1 className="text-xl font-bold">MEMO PERMOHONAN PENCAIRAN DANA</h1>
                <h2 className="text-lg font-semibold">ANGGARAN BULANAN</h2>
            </div>
            <Image src="/amal-logo.png" alt="Amal Logo" width={120} height={48} />
        </div>
    );
}

export function ReleaseMemo({ requests, lembaga, fundAccount, isPreview = false }: ReleaseMemoProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isReleasing, setIsReleasing] = useState(false);

    const totalAmount = requests.reduce((sum, req) => sum + req.amount, 0);
    const totalInWords = numberToWords(totalAmount);

    const handleRelease = async () => {
        if (!user || !user.profile) {
            toast({ title: 'Error', description: 'You must be logged in to perform this action.', variant: 'destructive' });
            return;
        }

        setIsReleasing(true);
        const requestIds = requests.map(req => req.id);
        
        try {
            await markRequestsAsReleased(requestIds, { id: user.uid, name: user.displayName || 'Unknown Releaser' }, fundAccount.id);
            toast({
                title: 'Dana Dicairkan',
                description: `${requests.length} permintaan telah ditandai sebagai dicairkan.`,
            });
            // Try to close the tab, will only work if script opened it
            window.close();
            // Fallback for when window.close() fails silently (e.g. user opened link manually)
            // Navigate to a "safe" page if it's still open.
            setTimeout(() => {
                window.location.href = '/release?status=released';
            }, 500);

        } catch (error) {
            console.error("Failed to release funds:", error);
            toast({ title: 'Gagal Mencairkan Dana', description: 'Terjadi kesalahan.', variant: 'destructive' });
        } finally {
            setIsReleasing(false);
        }
    };
    
    const approverName = fundAccount.pejabatNama || '........................';
    const firstRequesterName = requests[0]?.requester?.name || '........................';
    
    const allItems = requests.flatMap(req => 
        (Array.isArray(req.items) && req.items.length > 0) 
        ? req.items 
        : [{ 
            description: (req as any).description || "Item Permintaan Lama", 
            qty: 1, 
            unit: 'item', 
            price: req.amount, 
            total: req.amount,
            category: (req as any).category || "Lainnya"
          }]
    );

    return (
        <div className="bg-white p-8 shadow-lg">
            <header className="printable-header">
                <MemoHeader />
            </header>

            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                    <span className="font-semibold">Dari:</span> {approverName} / {fundAccount.pejabatJabatan}
                </div>
                 <div className="text-right">
                    <span className="font-semibold">Kepada:</span> {fundAccount.petugas}
                </div>
                <div>
                     <span className="font-semibold">Lembaga:</span> {lembaga}
                </div>
                 <div className="text-right">
                    <span className="font-semibold">Tanggal:</span> {format(new Date(), 'dd MMMM yyyy', { locale: id })}
                </div>
                <div>
                    <span className="font-semibold">Perihal:</span> OPERASIONAL BULANAN
                </div>
            </div>

            <div className="mt-6">
                <p>Bismillahirrohmaanirrohiim</p>
                <p>Assalamu'alaikum Warahmatullahi Wabarakaatuh</p>
                <p className="mt-2">Sehubungan dengan telah disetujui dan ditandatanganinya Permohonan Anggaran Dana oleh Kepala Manajemen, maka kami sampaikan Rincian Permohonan Anggaran Dana sebagai berikut:</p>
            </div>
            
            <div className="mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[5%]">NO.</TableHead>
                            <TableHead>URAIAN</TableHead>
                            <TableHead>JML</TableHead>
                            <TableHead>SATUAN</TableHead>
                            <TableHead>HARGA/SAT.</TableHead>
                            <TableHead>JUMLAH (Rp.)</TableHead>
                            <TableHead>KATEGORI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>{formatRupiah(item.price)}</TableCell>
                                <TableCell>{formatRupiah(item.total)}</TableCell>
                                <TableCell>{item.category}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex justify-end">
                <div className="w-1/2">
                    <div className="flex justify-between font-bold">
                        <span>Sub Total Anggaran</span>
                        <span>{formatRupiah(totalAmount)}</span>
                    </div>
                     <div className="flex justify-between font-bold mt-2 border-t pt-2">
                        <span>Total Pengajuan Anggaran</span>
                        <span>{formatRupiah(totalAmount)}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground italic">
                        Terbilang: #{totalInWords} Rupiah#
                    </div>
                </div>
            </div>
            
            <Separator className="my-6" />

            <div className="text-sm space-y-2">
                <p>Adapun sumber dana anggaran diatas dialokasikan dari rekening {fundAccount.accountName}</p>
                <p><span className="font-semibold">Atas nama:</span> {fundAccount.accountName}</p>
                <p><span className="font-semibold">No. Rekening:</span> {fundAccount.accountNumber}</p>
                <p><span className="font-semibold">Nama Bank:</span> {fundAccount.bankName}</p>
            </div>
            <p className="mt-4 text-sm">Dengan ini, Kami mohon kepada Kasir, agar dapat merealisasikan anggaran yang telah disetujui oleh Kepala Manajemen.</p>

             <p className="mt-4 text-sm">Demikian permohonan ini kami sampaikan, atas perhatian dan kerjasamanya, kami haturkan Jazakumullahu Khairan Katsiran. Wassalamu'alaikum Warahmatullahi Wabarakaatuh</p>

            <div className="mt-12 grid grid-cols-3 gap-8 text-center text-sm">
                <div>
                    <p>Menyetujui,</p>
                    <p className="mt-20 font-semibold border-b border-black pb-1">{approverName}</p>
                    <p>{fundAccount.pejabatJabatan}</p>
                </div>
                <div>
                    <p>Mengetahui,</p>
                     <p className="mt-20 font-semibold border-b border-black pb-1">{fundAccount.namaBendahara || '........................'}</p>
                    <p>Bendahara</p>
                </div>
                <div>
                    <p>Pemohon,</p>
                     <p className="mt-20 font-semibold border-b border-black pb-1">{firstRequesterName}</p>
                    <p>Staff</p>
                </div>
            </div>


            {!isPreview && (
              <div className="mt-8 flex justify-end gap-2 no-print">
                  <Button onClick={handleRelease} disabled={isReleasing}>
                      {isReleasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                      Tandai Sudah Dicairkan & Tutup
                  </Button>
              </div>
            )}

            <footer className="printable-footer pt-8 text-xs text-gray-500 flex justify-between">
                <span>Nomor: M.XX / PT&PM-XXXX / VIII / 25</span>
                <span>Halaman <span className="page-number"></span></span>
            </footer>
        </div>
    )
}

    