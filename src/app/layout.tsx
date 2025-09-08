import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'Amal',
  description: 'Aplikasi Manajemen Anggaran & Laporan Keuangan Pondok WM Versi',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#1c9cff" />
      </head>
      <body className="font-body antialiased max-w-full overflow-x-hidden">
        <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
