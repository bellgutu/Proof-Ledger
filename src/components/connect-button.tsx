
'use client';

import { useWeb3Modal } from '@web3modal/ethers/react';
import { useDisconnect, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';
import { useClient } from 'wagmi';

export function ConnectButton() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useWeb3ModalAccount()
  const { disconnect } = useDisconnect()
  const client = useClient();

  const handleDisconnect = () => {
    // Force a clean disconnection by clearing the wagmi client's connections
    if (client) {
      client.storage?.removeItem('connections');
    }
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
