
"use client";

import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { cookieStorage, createStorage } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

export const metadata = {
  name: 'ProfitForge',
  description: 'AI-powered tools for DeFi and crypto trading.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://profitforge.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create wagmiConfig
export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
});
