
'use client';

import { Web3ModalProvider } from '@/config/web3';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react';

const queryClient = new QueryClient()

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3ModalProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Web3ModalProvider>
  );
}
