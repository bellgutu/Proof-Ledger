
"use client";

import { config } from '@/lib/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ReactNode } from 'react';

// Create modal outside of the component to ensure it's created only once.
// This is the key to preventing the re-initialization loop.
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { mainnet, sepolia } from 'wagmi/chains';

if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    createWeb3Modal({
        wagmiConfig: config,
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        enableAnalytics: true,
        enableOnramp: true,
        featuredWalletIds: [],
        themeMode: 'dark',
        themeVariables: {
            '--w3m-color-mix': '#00DCFF',
            '--w3m-color-mix-strength': 20
        },
        enableAccountView: true, 
        defaultChain: sepolia,
    });
}


// Setup queryClient
const queryClient = new QueryClient();


export function Web3ModalProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
