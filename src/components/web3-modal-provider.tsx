'use client';

import React, { type ReactNode } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet, arbitrum } from 'viem/chains';
import { createConfig, http } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification.',
  url: 'https://proof-ledger.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, arbitrum] as const;

const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  metadata,
  enableAnalytics: true,
  enableOnramp: true
});

const queryClient = new QueryClient();

export function Web3ModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
