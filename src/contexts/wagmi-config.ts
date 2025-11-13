
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { createWeb3Modal } from '@web3modal/wagmi/react';

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = '31813a0ae27ceca0a29e97b32c31739b';

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set')
}

// 2. Create wagmiConfig
const metadata = {
  name: 'Enterprise Verification Platform',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, sepolia] as const

export const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  // Required: Set to false for Web3Modal + App Router
  ssr: false, 
});

// 3. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  metadata,
  enableAnalytics: false // Optional - defaults to your Cloud configuration
});
