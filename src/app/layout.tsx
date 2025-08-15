import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseAuthHandler } from '@/components/firebase-auth-handler';
import { WalletProvider } from '@/contexts/wallet-context';
import AppShell from '@/components/app-shell';
import { TransactionStatusDialogController } from '@/components/shared/transaction-status-dialog';

export const metadata: Metadata = {
  title: 'ProfitForge',
  description: 'AI-powered tools for DeFi and crypto trading.',
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
        <FirebaseAuthHandler />
        <WalletProvider>
          <AppShell>
            {children}
          </AppShell>
          <TransactionStatusDialogController />
        </WalletProvider>
        <Toaster />
      </body>
    </html>
  );
}
