
import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';

// This file is no longer used by the new ethers-based wallet provider.
// It is kept here for reference but is not active in the application.

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});
