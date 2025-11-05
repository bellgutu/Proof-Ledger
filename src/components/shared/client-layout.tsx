
"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/components/app-shell';
import NetworkCheck from '@/components/shared/NetworkCheck';
import { TransactionStatusDialogController } from '@/components/shared/transaction-status-dialog';
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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <Providers>
        <NetworkCheck />
        <AppShell>
          {children}
        </AppShell>
        <TransactionStatusDialogController />
      </Providers>
    </Suspense>
  );
}
