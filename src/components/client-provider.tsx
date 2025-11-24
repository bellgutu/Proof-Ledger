'use client';

import React from 'react';
import { config } from '@/config/web3';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type State, WagmiProvider } from 'wagmi';

// Setup queryClient
const queryClient = new QueryClient();

export default function ClientProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
