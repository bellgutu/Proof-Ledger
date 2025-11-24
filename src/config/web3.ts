'use client';
import { createWeb3Modal } from '@web3modal/ethers/react';
import { http, createConfig } from 'wagmi';
import { walletConnect, injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

// 1. Get projectId
export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

// Determine the URL dynamically
const url = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'https://proof-ledger.app';

// 2. Create a metadata object
const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: url,
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
  ssr: false, 
});

// 4. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig: config,
  chains: [sepolia],
  projectId,
  enableAnalytics: true,
  themeVariables: {
    '--w3m-accent': 'hsl(250 80% 60%)',
    '--w-color-mix': 'hsl(220 10% 18%)',
    '--w-color-mix-strength': 20,
    '--w-border-radius-master': '1px',
    '--w-font-family': 'Inter, sans-serif',
  }
});
