"use client";

import { WalletProvider } from '@/contexts/wallet-context';
import { Web3ModalProvider } from '@/contexts/web3modal-provider';
import { AmmDemoProvider } from './amm-demo-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3ModalProvider>
      <WalletProvider>
          <AmmDemoProvider>
            {children}
          </AmmDemoProvider>
      </WalletProvider>
    </Web3ModalProvider>
  );
}
