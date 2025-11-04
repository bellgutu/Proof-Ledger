
"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { cookieStorage, createStorage } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

const metadata = {
  name: 'ProfitForge',
  description: 'AI-powered tools for DeFi and crypto trading.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://profitforge.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create wagmiConfig
export const config = defaultWagmiConfig({
  chains: [mainnet, sepolia],
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
});

// Create modal outside of the component
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
  featuredWalletIds: [],
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#00DCFF',
    '--w3m-color-mix-strength': 20
  },
  enableAccountView: false,
  defaultChain: sepolia,
});
