
"use client";

import { WalletProvider } from '@/contexts/wallet-context';
import { Web3ModalProvider } from '@/contexts/web3modal-provider';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3ModalProvider>
      <WalletProvider>{children}</WalletProvider>
    </Web3ModalProvider>
  );
}
