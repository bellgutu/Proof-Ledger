
'use client';

import { useWeb3Modal, useWeb3ModalState } from '@web3modal/ethers/react'
import { useWeb3ModalProvider, useDisconnect } from '@web3modal/ethers/react'
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';


export function ConnectButton() {
  const { open } = useWeb3Modal()
  const { open: isOpen } = useWeb3ModalState()
  const { walletProvider } = useWeb3ModalProvider()
  const { disconnect } = useDisconnect()

  // This is a bit of a hack to get the address, as ethers modal doesn't have a simple useAccount hook like wagmi
  const address = walletProvider?.provider?.accounts?.[0] as string | undefined;
  
  if (walletProvider && address) {
     return (
        <Button onClick={() => open()}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
        </Button>
    )
  }

  return (
    <Button onClick={() => open()}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
