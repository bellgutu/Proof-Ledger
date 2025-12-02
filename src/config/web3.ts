
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { sepolia, mainnet } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

const metadata = {
  name: 'Proof Ledger',
  description: 'Enterprise Grade Digital Asset Platform',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const chains = [sepolia, mainnet];

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 40,
  },
});
