import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'BudgetFlow',
  description: 'Aplikasi permintaan dan persetujuan anggaran profesional.',
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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#12745a" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
