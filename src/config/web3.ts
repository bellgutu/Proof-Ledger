
'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum } from 'wagmi/chains'

// 1. Get projectId from https://cloud.walletconnect.com
export const projectId = '72ce27d6c08f163e01daa618f3175370'

if (!projectId) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set')

// 2. Create wagmiConfig
const metadata = {
  name: 'Proof Ledger',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://proof-ledger.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, arbitrum] as const
export const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http()
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0]
    })
  ],
  ssr: true,
})

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  themeVariables: {
    '--w3m-accent': 'hsl(250 80% 60%)',
    '--w3m-color-mix': 'hsl(220 10% 18%)',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '1px',
    '--w3m-font-family': 'Inter, sans-serif',
  }
})
