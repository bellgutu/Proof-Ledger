
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ClientLayout } from '@/components/shared/client-layout';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Enterprise Verification Platform',
  description:
    'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ClientLayout>
          <AppShell>
            {children}
          </AppShell>
        </ClientLayout>
        <Toaster />
      </body>
    </html>
  );
}
