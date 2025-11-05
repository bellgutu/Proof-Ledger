
"use client";

import { Providers } from '@/contexts/providers';
import NetworkCheck from '@/components/shared/NetworkCheck';
import { TransactionStatusDialogController } from '@/components/shared/transaction-status-dialog';
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import providers to ensure they only run on the client
const DynamicProviders = dynamic(() => import('@/contexts/providers').then(mod => mod.Providers), {
  ssr: false,
  loading: () => <div className="h-screen w-full flex items-center justify-center">Loading...</div>
});


export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DynamicProviders>
        <NetworkCheck />
        {children}
        <TransactionStatusDialogController />
    </DynamicProviders>
  );
}
