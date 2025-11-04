
"use client";

import { createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

// 2. Create wagmiConfig with dynamic URL
const metadata = {
  name: 'ProfitForge',
  description: 'AI-powered tools for DeFi and crypto trading.',
  // Use dynamic URL based on environment
  url: typeof window !== 'undefined' ? window.location.origin : 'https://profitforge.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, sepolia] as const;

// Explicitly create the config to disable auto-reconnect
export const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
  // This is the critical fix: stop trying to reconnect on every page load.
  reconnectOnMount: false,
});
