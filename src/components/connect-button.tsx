
'use client';

import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Button } from './ui/button';
import { useAccount } from 'wagmi';
import { Wallet } from 'lucide-react';

export function ConnectButton() {
  const { open } = useWeb3Modal();
  const { address, isConnecting, isDisconnected } = useAccount();

  if (isConnecting) {
    return <Button disabled>Connecting...</Button>;
  }

  if (isDisconnected) {
    return (
      <Button onClick={() => open()}>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button onClick={() => open()}>
      {address?.slice(0, 6)}...{address?.slice(-4)}
    </Button>
  );
}
