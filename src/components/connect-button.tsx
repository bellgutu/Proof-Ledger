
'use client';

import { useWeb3Modal } from '@web3modal/ethers/react';
import { useDisconnect, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';

export function ConnectButton() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useWeb3ModalAccount()
  const { disconnect } = useDisconnect()

  const handleDisconnect = () => {
    disconnect();
  };

  if (isConnected && address) {
     return (
        <Button onClick={handleDisconnect}>
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
