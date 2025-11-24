
'use client';

import React from 'react';
import { config, projectId } from '@/config/web3';
import { createWeb3Modal } from '@web3modal/ethers/react';
import { WagmiProvider, type State } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sepolia } from 'wagmi/chains';

// Setup queryClient
const queryClient = new QueryClient()

// Create a Web3Modal instance
createWeb3Modal({
  ethersConfig: config,
  chains: [sepolia],
  projectId: projectId!,
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
  )
}
