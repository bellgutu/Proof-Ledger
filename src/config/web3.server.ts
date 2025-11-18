
import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');

// This is a server-safe configuration that does not include client-side logic
// like createWeb3Modal. It's used in the root layout for server-side rendering.
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    walletConnect({ projectId, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})
