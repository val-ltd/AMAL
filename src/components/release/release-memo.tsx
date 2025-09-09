
'use client';

import type { BudgetRequest, FundAccount } from "@/lib/types";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ReleaseMemoProps {
    requests: BudgetRequest[];
    lembaga: string;
    fundAccount: FundAccount;
    isPreview?: boolean;
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(/\s*Rp\s*/, '');
};

const numberToWords = (num: number): string => {
    const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
    const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
    const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
    const thousands = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];

    const integerPart = Math.floor(num);
    if (integerPart === 0) return 'Nol';

    let i = 0;
    let words = '';
    let currentNum = integerPart;

    while (currentNum > 0) {
        let chunk = currentNum % 1000;
        if (chunk > 0) {
            let chunkWords = '';
            if (chunk >= 100) {
                chunkWords += (chunk < 200 ? 'Seratus' : ones[Math.floor(chunk / 100)] + ' Ratus') + ' ';
                chunk %= 100;
            }
            if (chunk >= 20) {
                chunkWords += tens[Math.floor(chunk / 10)] + ' ';
                chunk %= 10;
            } else if (chunk >= 10) {
                chunkWords += teens[chunk - 10] + ' ';
                chunk = 0;
            }
            if (chunk > 0) {
                if (i === 1 && chunk === 1 && (currentNum >= 1000 && currentNum < 2000)) {
                   // handles "seribu" case correctly
                } else {
                   chunkWords += ones[chunk] + ' ';
                }
            }
            if (i === 1 && chunk === 1 && (currentNum >= 1000 && currentNum < 2000) ) {
                words = 'Seribu ' + words;
            } else {
                words = chunkWords + (thousands[i] || '') + ' ' + words;
            }
        }
        i++;
        currentNum = Math.floor(currentNum / 1000);
    }
    
    return words.trim();
};

function ApprovedStamp({ date }: { date?: string }) {
    const formattedDate = date ? format(new Date(date), 'dd MMM yyyy', { locale: id }) : '................';
    return (
        <svg
            width="80"
            height="80"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600 opacity-80"
        >
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="3" fill="none" />
            <text x="50" y="45" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="currentColor">
                APPROVED
            </text>
            <text x="50" y="65" fontFamily="Arial, sans-serif" fontSize="10" textAnchor="middle" fill="currentColor">
                {formattedDate}
            </text>
        </svg>
    );
}


function MemoHeader({ memoNumber, dari, releaser, unitKerja, perihal, memoDate }: { memoNumber: string, dari: string, releaser: FundAccount['petugas'], unitKerja: string, perihal: string, memoDate: string }) {
    return (
        <div className="flex flex-col">
            <div className="flex items-start justify-between pb-2 border-b-4 border-black">
                <Image src="/logo-wadi.png" alt="Wadi Mubarak Logo" width={60} height={60} />
                <div className="text-center">
                    <h1 className="text-xl font-bold">MEMO PERMOHONAN PENCAIRAN DANA</h1>
                    <h2 className="text-lg font-semibold uppercase">{perihal}</h2>
                    <p className="text-sm">Nomor: {memoNumber}</p>
                </div>
                 <div className="text-center border-2 border-black p-1 w-[120px]">
                    <p className="font-bold text-lg">ICWM</p>
                    <p className="text-xs">Versi 3.0.1</p>
                    <div className="flex justify-between items-center text-xs mt-1">
                        <span className="font-bold text-2xl">{format(new Date(memoDate), 'dd')}</span>
                        <span className="font-bold uppercase">{format(new Date(memoDate), 'MMMM yyyy', {locale: id})}</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 text-sm mt-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-2">
                    <span className="font-semibold">Dari</span><span>: {dari}</span>
                    <span className="font-semibold">Unit Kerja</span><span>: {unitKerja}</span>
                    <span className="font-semibold">Perihal</span><span>: {perihal}</span>
                </div>
                 <div className="grid grid-cols-[auto_1fr] gap-x-2">
                    <span className="font-semibold">Kepada</span><span>: {releaser}</span>
                </div>
            </div>
        </div>
    );
}

export function ReleaseMemo({ requests, lembaga, fundAccount, isPreview = false }: ReleaseMemoProps) {
    const totalAmount = requests.reduce((sum, req) => sum + req.amount, 0);
    const totalTransferFee = requests.reduce((sum, req) => sum + (req.transferFee || 0), 0);
    const subTotal = totalAmount - totalTransferFee;

    const totalInWords = numberToWords(totalAmount);
    
    const firstRequest = requests[0];
    const { requesterProfile } = firstRequest;

    const memoSubject = firstRequest?.subject || 'OPERASIONAL BULANAN';
    const memoDate = firstRequest?.createdAt ? new Date(firstRequest.createdAt) : new Date();

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
    
    const reimbursementText = firstRequest.paymentMethod === 'Cash' 
        ? `PEMINDAHBUKUAN ke Rekening ${fundAccount.bankBendahara} ${fundAccount.rekeningBendahara} Atas Nama: ${fundAccount.namaBendahara}`
        : `TRANSFER ke Rekening ${firstRequest.reimbursementAccount?.bankName} ${firstRequest.reimbursementAccount?.accountNumber} Atas nama: ${firstRequest.reimbursementAccount?.accountHolderName}`;
    
    const isApproved = firstRequest.status === 'approved' || firstRequest.status === 'released' || firstRequest.status === 'completed';
    const unitKerja = `${firstRequest.department?.divisi || firstRequest.division} | ${firstRequest.department?.lembaga || firstRequest.institution}`;

    return (
        <div className="bg-white p-6 shadow-lg font-['Times_New_Roman',_serif] text-black" style={{ fontSize: '10px' }}>
            <header className="printable-header">
                <MemoHeader 
                  memoNumber={`M.${firstRequest.id.substring(0,2)} / PT&PM-${firstRequest.id.substring(2,6)} / ${format(memoDate, 'MM/yy')}`}
                  dari={firstRequest.requester.name}
                  releaser={fundAccount.petugas}
                  unitKerja={unitKerja}
                  perihal={memoSubject}
                  memoDate={firstRequest.createdAt}
                />
            </header>

            <div className="mt-4 space-y-1">
                <p>Bismillahirrohmaanirrohiim</p>
                <p>Assalamu'alaikum Warahmatullahi Wabarakaatuh</p>
                <p className="mt-2">Sehubungan dengan telah disetujui dan ditandatanganinya Permohonan Anggaran Dana oleh Ketua Yayasan, maka kami sampaikan Rincian Permohonan Anggaran Dana sebagai berikut:</p>
            </div>
            
            <div className="mt-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[3%] p-1 h-auto text-black font-bold border border-black text-center align-middle">NO.</TableHead>
                            <TableHead className="w-auto p-1 h-auto text-black font-bold border border-black text-center align-middle">URAIAN</TableHead>
                            <TableHead className="w-[5%] p-1 h-auto text-black font-bold border border-black text-center align-middle">JML ITEM</TableHead>
                            <TableHead className="w-[8%] p-1 h-auto text-black font-bold border border-black text-center align-middle">SATUAN</TableHead>
                            <TableHead className="w-[12%] p-1 h-auto text-black font-bold border border-black text-center align-middle">HARGA/SAT. (Rp.)</TableHead>
                            <TableHead className="w-[12%] p-1 h-auto text-black font-bold border border-black text-center align-middle">JUMLAH (Rp.)</TableHead>
                            <TableHead className="w-[20%] p-1 h-auto text-black font-bold border border-black text-center align-middle">KATEGORI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="p-1 border border-black text-center">{index + 1}</TableCell>
                                <TableCell className="p-1 border border-black">{item.description}</TableCell>
                                <TableCell className="p-1 border border-black text-center">{item.qty}</TableCell>
                                <TableCell className="p-1 border border-black text-center">{item.unit}</TableCell>
                                <TableCell className="p-1 border border-black text-right">{formatRupiah(item.price)}</TableCell>
                                <TableCell className="p-1 border border-black text-right">{formatRupiah(item.total)}</TableCell>
                                <TableCell className="p-1 border border-black">{item.category}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
             <div className="flex justify-between mt-0">
                <div className="w-1/2 border-l border-r border-b border-black p-2 flex flex-col justify-between">
                    <div>
                        <p className="font-bold">Informasi Tambahan:</p>
                        <p className="text-red-600 font-bold">{firstRequest.additionalInfo || 'TIDAK ADA INFO TAMBAHAN'}</p>
                    </div>
                </div>
                <div className="w-1/2 flex flex-col">
                    <div className="flex">
                        <div className="w-2/3 border-b border-l border-black p-1">Sub Total Anggaran</div>
                        <div className="w-1/3 border-b border-l border-r border-black p-1 text-right">{formatRupiah(subTotal)}</div>
                    </div>
                    <div className="flex">
                        <div className="w-2/3 border-b border-l border-black p-1">Total Ada Biaya Transfer</div>
                        <div className="w-1/3 border-b border-l border-r border-black p-1 text-right">{totalTransferFee > 0 ? formatRupiah(totalTransferFee) : '-'}</div>
                    </div>
                     <div className="flex font-bold">
                        <div className="w-2/3 border-b border-l border-black p-1">Total Pengajuan Anggaran</div>
                        <div className="w-1/3 border-b border-l border-r border-black p-1 text-right">{formatRupiah(totalAmount)}</div>
                    </div>
                </div>
             </div>
             <div className="border-x border-b border-black p-1 font-bold italic">
                Terbilang: # {totalInWords} Rupiah #
            </div>

            <div className="mt-2 space-y-0.5">
                <p>Adapun sumber dana anggaran diatas dialokasikan dari rekening {fundAccount.namaLembaga}</p>
                <p><span className="font-semibold">Atas nama:</span> {fundAccount.accountName}</p>
                <p><span className="font-semibold">No. Rekening:</span> {fundAccount.accountNumber}</p>
                <p><span className="font-semibold">Nama Bank:</span> {fundAccount.bankName} ({fundAccount.cabang})</p>
            </div>
            <p className="mt-2">Dengan ini, Kami mohon kepada Kasir, agar dapat merealisasikan anggaran yang telah disetujui oleh Ketua Yayasan dengan cara:</p>
            <p className="font-bold uppercase">{reimbursementText}</p>

            <div className="mt-2 space-y-1">
                <p>Demikian permohonan ini kami sampaikan, atas perhatian dan kerjasamanya, kami haturkan Jazakumullahu Khairan Katsiran</p>
                <p>Wassalamu'alaikum Warahmatullahi Wabarakaatuh</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="h-28 relative flex flex-col justify-between">
                    <p>Menyetujui,</p>
                    <div className="h-16 relative">
                        {isApproved && <ApprovedStamp date={firstRequest.managerActionAt} />}
                        {fundAccount.pejabatSignatureUrl && <Image src={fundAccount.pejabatSignatureUrl} alt="Signature" layout="fill" objectFit="contain" />}
                    </div>
                    <p className="font-semibold underline">({fundAccount.pejabatNama || '........................'})</p>
                    <p>{fundAccount.pejabatJabatan}</p>
                </div>
                <div className="h-28 relative flex flex-col justify-between">
                    <p>Mengetahui,</p>
                    <div className="h-16 relative">
                       {isApproved && fundAccount.bendaharaSignatureUrl && <Image src={fundAccount.bendaharaSignatureUrl} alt="Signature" layout="fill" objectFit="contain" />}
                       <p className="text-center text-gray-400 text-xs absolute bottom-0 w-full">{isApproved ? format(new Date(firstRequest.managerActionAt!), 'dd-MM-yyyy HH:mm') : ''}</p>
                    </div>
                    <p className="font-semibold underline">({fundAccount.namaBendahara || '........................'})</p>
                    <p>Bendahara</p>
                </div>
                <div className="h-28 relative flex flex-col justify-between">
                    <p>Pemohon,</p>
                     <div className="h-16 relative">
                        {requesterProfile?.signatureUrl && <Image src={requesterProfile.signatureUrl} alt="Signature" layout="fill" objectFit="contain" />}
                        <p className="text-center text-gray-400 text-xs absolute bottom-0 w-full">{format(new Date(firstRequest.createdAt), 'dd-MM-yyyy HH:mm')}</p>
                    </div>
                    <p className="font-semibold underline">({firstRequest.requester.name || '........................'})</p>
                    <p>{unitKerja}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="border-2 border-black p-1">
                    <p className="font-bold">Catatan/Disposisi:</p>
                    <div className="border border-black h-20 mt-1 p-1 text-center font-bold">KOLOM KHUSUS DIISI OLEH KETUA YAYASAN</div>
                </div>
                 <div className="border-2 border-black p-1 text-center">
                    <p className="font-bold">Diproses & Dicairkan Oleh:</p>
                    <p className="mt-1">{fundAccount.petugas || 'Dede'}</p>
                    <p>Tanggal: ......................</p>
                    <p className="mt-1">Paraf</p>
                    <div className="h-10"></div>
                </div>
            </div>

             <div className="grid grid-cols-4 gap-px mt-px">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="border-2 border-black p-1">
                        <p className="font-bold text-center">Pencairan Tahap Ke-{i}</p>
                        <p>Nama Penerima: ..............................</p>
                        <p>Tgl. Terima Dana: ..............................</p>
                        <p>Jumlah Diterima: Rp. ....................</p>
                        <p>Metode Pencairan: TUNAI / ................</p>
                        <p>Tanda Tangan Penerima:</p>
                        <div className="h-8"></div>
                    </div>
                ))}
            </div>

            <footer className="printable-footer pt-4 text-gray-500 flex justify-between items-center">
                <span className="text-[8px]">Pengguna: {firstRequest?.requester.name} - Tgl. Cetak: {format(new Date(), 'PPpp', {locale: id})}</span>
                 <span className="text-[8px] italic">*) coret salah satu</span>
            </footer>
        </div>
    )
}
