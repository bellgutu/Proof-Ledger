
"use client";

import React, { ReactNode } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { mainnet, sepolia } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = 'b56e18d47c72ab683b10814fe9495694';
if (!projectId) throw new Error('Project ID is not defined');

// 2. Create a metadata object
const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://proof-ledger.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// 3. Create wagmiConfig
const chains = [mainnet, sepolia] as const;
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
});

// 4. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
