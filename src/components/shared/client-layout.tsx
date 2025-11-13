
"use client";

import { Providers } from '@/contexts/providers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/contexts/wagmi-config';

const queryClient = new QueryClient();

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
     <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Providers>
            {children}
        </Providers>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
