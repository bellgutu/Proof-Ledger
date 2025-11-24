'use client';
import { http, createConfig } from 'wagmi';
import { walletConnect, injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

const getUrl = () => {
  if (typeof window === 'undefined') {
    return 'https://proof-ledger.app';
  }
  return window.location.origin;
}

export const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: getUrl(),
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

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
