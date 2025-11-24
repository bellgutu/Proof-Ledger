import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://proof-ledger.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
})
