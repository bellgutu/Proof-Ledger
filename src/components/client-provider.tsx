'use client';

import React from 'react';
import Web3Provider from './web3-provider';
import { type State } from 'wagmi';
import { createWeb3Modal } from '@web3modal/ethers/react';
import { projectId, metadata } from '@/config/web3';
import { config } from '@/config/web3';
import { sepolia } from 'wagmi/chains';

// Create the modal outside the component to ensure it's only created once.
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

export default function ClientProvider({
  children,
  initialState
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <Web3Provider initialState={initialState}>
      {children}
    </Web3Provider>
  );
}
