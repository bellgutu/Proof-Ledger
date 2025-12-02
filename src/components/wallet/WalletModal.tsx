
'use client';

import { useWallet } from '@/components/wallet-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import { useWeb3Modal } from '@web3modal/react';

export function WalletModal() {
  const { open } = useWeb3Modal();
  const { isConnected, account } = useWallet();

  if (isConnected && account) return null;

  return (
    <Button onClick={() => open()}>
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
