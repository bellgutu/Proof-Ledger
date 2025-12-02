
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  mainnet, 
  sepolia, 
  polygon, 
  arbitrum,
  bsc
} from 'wagmi/chains';

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Configure chains
export const supportedChains = [sepolia, mainnet];

// Create RainbowKit config
export const config = getDefaultConfig({
  appName: 'Enterprise Asset Platform',
  projectId: projectId,
  chains: supportedChains as any,
  ssr: true,
});
