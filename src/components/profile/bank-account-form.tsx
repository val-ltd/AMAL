
'use client';

import { useState } from 'react';
import type { UserBankAccount } from '@/lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface BankAccountFormProps {
    account: UserBankAccount | null;
    onSave: (account: UserBankAccount) => void;
    onCancel: () => void;
}

export function BankAccountForm({ account, onSave, onCancel }: BankAccountFormProps) {
    const [formData, setFormData] = useState<UserBankAccount>({
        bankName: account?.bankName || '',
        accountNumber: account?.accountNumber || '',
        accountHolderName: account?.accountHolderName || '',
        bankCode: account?.bankCode || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName) {
            alert('Harap isi semua field yang wajib diisi.');
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg animate-in fade-in-50 space-y-8 flex-1 flex flex-col">
            <div className='flex-1 space-y-4'>
                <h3 className="font-semibold text-lg">{account ? 'Ubah' : 'Tambah'} Rekening Bank</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="accountHolderName">Nama Pemilik Rekening</Label>
                        <Input id="accountHolderName" name="accountHolderName" value={formData.accountHolderName} onChange={handleInputChange} required/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="accountNumber">Nomor Rekening</Label>
                        <Input id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required disabled={!!account} />
                        {account && <p className="text-xs text-muted-foreground">Nomor rekening tidak dapat diubah.</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="bankName">Nama Bank</Label>
                        <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleInputChange} required/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bankCode">Kode Bank (Opsional)</Label>
                        <Input id="bankCode" name="bankCode" value={formData.bankCode} onChange={handleInputChange} />
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Batal
                </Button>
                <Button type="submit">Simpan Rekening</Button>
            </div>
        </form>
    );
}
