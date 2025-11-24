
'use client';

import { useWallet } from '@/components/wallet-provider';
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';

export function ConnectButton() {
  const { connectWallet, disconnectWallet, account } = useWallet();

  if (account) {
    return (
      <Button onClick={disconnectWallet}>
        {account.slice(0, 6)}...{account.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={connectWallet}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
