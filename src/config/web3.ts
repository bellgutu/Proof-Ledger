'use client';
import { http, createConfig } from 'wagmi';
import { walletConnect, injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

export const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://proof-ledger.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

export const chains = [sepolia] as const;

export const config = createConfig({
  chains: chains,
  transports: {
    [sepolia.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
  ssr: false, // Explicitly disable SSR for maximum stability in App Router
});
