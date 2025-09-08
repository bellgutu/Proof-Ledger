
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { sepolia, localhost, mainnet } from 'wagmi/chains';
import { cookieStorage, createStorage } from 'wagmi';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

// 2. Create wagmiConfig
const metadata = {
  name: 'ProfitForge',
  description: 'AI-powered tools for DeFi and crypto trading.',
  url: 'https://localhost:3000', // origin domain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, sepolia, localhost] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  // Setting enableInjected to false prevents the app from automatically trying to connect
  // to a browser-injected wallet (like MetaMask) on load. Users can still select it
  // from the Web3Modal. This gives users full control over the connection process.
  enableInjected: false,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
