
'use client';

import { useWeb3Modal, useWeb3ModalState } from '@web3modal/ethers/react';
import { useWeb3ModalProvider, useDisconnect, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';
import { useState } from 'react';

export function ConnectButton() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useWeb3ModalAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
     return (
        <Button onClick={() => disconnect()}>
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
