
"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const projectId = '31813a0ae27ceca0a29e97b32c31739b'

const metadata = {
  name: 'Proof Ledger',
  description: 'Enterprise Asset Verification & Trade Finance',
  url: 'https://app.proofledger.app',
  icons: ['https://app.proofledger.app/icon.png']
}

const chains = [mainnet, sepolia] as const
const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
})

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  metadata,
  enableAnalytics: false
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
