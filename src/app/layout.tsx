
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/app-shell';
import { TransactionStatusDialogController } from '@/components/shared/transaction-status-dialog';
import NetworkCheck from '@/components/shared/NetworkCheck';
import { Skeleton } from '@/components/ui/skeleton';

const Providers = dynamic(
  () => import('@/contexts/providers').then((mod) => mod.Providers),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 space-y-8">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'ProfitForge - Your Autonomous Financial Platform',
  description: 'The infrastructure for communities, DAOs, and everyday users to run their own decentralized bank.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <Suspense>
          <Providers>
            <NetworkCheck />
            <AppShell>
              {children}
            </AppShell>
            <TransactionStatusDialogController />
          </Providers>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
