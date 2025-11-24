
'use client';

import React from 'react';
import { config, projectId, metadata } from '@/config/web3';
import { createWeb3Modal } from '@web3modal/ethers/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { State } from 'wagmi';

// Setup queryClient
const queryClient = new QueryClient();

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

// Create modal outside of the component to ensure it's created only once.
createWeb3Modal({
  ethersConfig: config,
  chains: config.chains,
  projectId,
  metadata,
  enableAnalytics: true,
  themeVariables: {
    '--w3m-accent': 'hsl(250 80% 60%)',
    '--w3m-color-mix': 'hsl(220 10% 18%)',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '1px',
    '--w3m-font-family': 'Inter, sans-serif',
  }
});

export default function Web3Provider({
  children,
  initialState
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
