
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

const chains = [mainnet, sepolia] as const

export const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
