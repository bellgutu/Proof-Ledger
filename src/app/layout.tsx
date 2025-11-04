
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/app-shell';
import { TransactionStatusDialogController } from '@/components/shared/transaction-status-dialog';
import NetworkCheck from '@/components/shared/NetworkCheck';
import { Providers } from '@/contexts/providers';
import { Suspense } from 'react';


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
