
"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { walletConnect, injected } from 'wagmi/connectors';
import { createConfig, http } from 'wagmi';
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

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
});

// The createWeb3Modal function is moved to the provider to ensure it only runs on the client.
