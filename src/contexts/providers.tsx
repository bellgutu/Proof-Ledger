
"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { wagmiConfig } from './wagmi-config';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const metadata = {
  name: 'Enterprise Verification Platform',
  description: 'A closed-loop system for end-to-end verification of shipping, insurance, and quality control.',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

createWeb3Modal({
  wagmiConfig,
  projectId,
  metadata,
  enableAnalytics: false
})

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
