
'use client';

import React, { type ReactNode } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { State, WagmiProvider, cookieToInitialState } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set');
}

const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification.',
  url: 'https://proofledger.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

const config = createConfig({
  chains: [mainnet, arbitrum],
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
});

const queryClient = new QueryClient();

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
