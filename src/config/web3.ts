
'use client';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { type Chain } from 'wagmi';

// 1. Get projectId
export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

// 2. Set chains
const sepolia = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://rpc.sepolia.org'
} as const satisfies Chain;

// 3. Create a metadata object
const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://proof-ledger.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 4. Create Ethers config
export const config = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: false, // false by default
  rpcUrl: 'https://rpc.sepolia.org', // used for Readonly connections
  defaultChainId: 11155111, // used for Readonly connections
});


// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig: config,
  chains: [sepolia],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  themeVariables: {
    '--w3m-accent': 'hsl(250 80% 60%)',
    '--w3m-color-mix': 'hsl(220 10% 18%)',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '1px',
    '--w3m-font-family': 'Inter, sans-serif',
  }
});
