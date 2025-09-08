
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { sepolia, mainnet } from 'wagmi/chains';

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
  url: process.env.NEXT_PUBLIC_APP_URL || 
       (typeof window !== 'undefined' ? window.location.origin : 'https://profitforge.com'),
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, sepolia] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  autoConnect: true,
});
