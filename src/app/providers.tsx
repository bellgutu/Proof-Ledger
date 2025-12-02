
'use client';

import { Web3ProviderWrapper } from '@/components/wallet-provider';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { WagmiConfig } from 'wagmi';
import { config } from '@/config/web3';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
            <Web3ProviderWrapper>
                {children}
            </Web3ProviderWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
