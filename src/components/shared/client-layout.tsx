
"use client";

import { Providers } from '@/contexts/providers';
import React from 'react';
import dynamic from 'next/dynamic';
import { Logo } from '../logo';

const DynamicProviders = dynamic(() => import('@/contexts/providers').then(mod => mod.Providers), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="animate-pulse-strong">
        <Logo />
      </div>
      <p className="text-sm text-muted-foreground mt-4">Initializing Platform...</p>
    </div>
  )
});


export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DynamicProviders>
        {children}
    </DynamicProviders>
  );
}
