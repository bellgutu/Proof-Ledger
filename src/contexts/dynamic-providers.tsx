
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the main Providers component with SSR turned off.
// This is crucial for wallet-related libraries that depend on browser APIs.
const Providers = dynamic(
  () => import('@/contexts/providers').then((mod) => mod.Providers),
  {
    ssr: false,
    // Optional: show a loading skeleton while the providers are being loaded on the client.
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

export function DynamicProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
