'use client';
import { createWeb3Modal } from '@web3modal/ethers/react';
import { http, createConfig } from 'wagmi';
import { walletConnect, injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

// 1. Get projectId
export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

// 2. Create a metadata object
const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://proof-ledger.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 3. Create a unified config
export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
  ssr: false, // Ensure client-side only state management
});

// 4. Create a Web3Modal instance. This is called only once.
createWeb3Modal({
  ethersConfig: config,
  chains: [sepolia],
  projectId,
  enableAnalytics: true,
  themeVariables: {
    '--w3m-accent': 'hsl(250 80% 60%)',
    '--w3m-color-mix': 'hsl(220 10% 18%)',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '1px',
    '--w3m-font-family': 'Inter, sans-serif',
  }
});
