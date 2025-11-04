
"use client";
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { config } from '@/lib/wagmi';

// Setup queryClient
const queryClient = new QueryClient();

// Create modal outside of the component to ensure it's only called once.
createWeb3Modal({
  wagmiConfig: config,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  enableAnalytics: true,
  enableOnramp: true,
  featuredWalletIds: [],
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#00DCFF',
    '--w3m-color-mix-strength': 20
  },
  enableAccountView: false,
  defaultChain: config.chains[0],
});

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
