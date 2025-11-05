
"use client";

import { Providers } from '@/contexts/providers';
import React from 'react';
import dynamic from 'next/dynamic';

const DynamicProviders = dynamic(() => import('@/contexts/providers').then(mod => mod.Providers), {
  ssr: false,
  loading: () => <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">Loading...</div>
});


export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DynamicProviders>
        {children}
    </DynamicProviders>
  );
}
