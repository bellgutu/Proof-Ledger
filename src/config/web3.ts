
// src/config/web3.ts
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dfb93c6682129035a09c4c7b5e4905a8'

// Define metadata for wallet connection
const metadata = {
  name: 'Enterprise Asset Platform',
  description: 'Digital Asset Management Platform',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Configure chains
export const supportedChains = [sepolia, mainnet, polygon, arbitrum]

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    walletConnect({ projectId, metadata, showQrModal: false }),
    coinbaseWallet({ appName: metadata.name })
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true
})
