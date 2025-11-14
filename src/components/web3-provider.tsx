
'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum } from '@reown/appkit/networks';
import type { Chain } from 'viem';

const queryClient = new QueryClient();

// 1. Get projectID
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined');
}

// 2. Create metadata
const metadata = {
  name: 'Proof Ledger',
  description:
    'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://proof-ledger.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// 3. Set the networks
const networks: [Chain, ...Chain[]] = [mainnet, arbitrum];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
  },
});

const config = wagmiAdapter.wagmiConfig;

export function Web3Provider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies?: string | null;
}) {
  const initialState = cookieToInitialState(config as Config, cookies);

  return (
    <WagmiProvider config={config as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
