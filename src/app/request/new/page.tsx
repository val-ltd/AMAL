
'use client'

import { NewRequestForm } from '@/components/new-request-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Suspense } from 'react';

function NewRequestPageContent() {
  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Buat Permintaan Anggaran</CardTitle>
          <CardDescription>
            Isi formulir di bawah ini untuk mengajukan permintaan anggaran baru untuk persetujuan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewRequestForm />
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <NewRequestPageContent />
    </Suspense>
  );
}
