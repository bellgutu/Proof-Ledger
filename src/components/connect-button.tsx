
'use client';

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';

export function ConnectButton() {
  const { open } = useWeb3Modal()
  const { address, isConnecting, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
     return (
        <Button onClick={() => disconnect()}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
        </Button>
    )
  }

  return (
    <Button onClick={() => open()} disabled={isConnecting}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
