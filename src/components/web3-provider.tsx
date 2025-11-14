
'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { walletConnect, injected } from 'wagmi/connectors'

const queryClient = new QueryClient();

// 1. Get project ID from WalletConnect Cloud
const projectId = '72ce27d6c08f163e01daa618f3175370';

// 2. Create wagmiConfig
const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://proof-ledger.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const config = createConfig({
  chains: [mainnet, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
});

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true // Optional - false as default
})

export function Web3Provider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies?: string | null;
}) {
  const initialState = cookieToInitialState(config, cookies);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
