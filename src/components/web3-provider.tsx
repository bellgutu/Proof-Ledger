
'use client';

import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';

const config = createConfig({
  chains: [mainnet, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({
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
