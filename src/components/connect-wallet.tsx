
"use client";

import React from 'react';
import type { ButtonProps } from '@/components/ui/button';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from './ui/button';
import { useWeb3Modal } from '@web3modal/wagmi/react';

export function ConnectWallet({ variant = "default", className }: { variant?: ButtonProps["variant"], className?: string }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  if (isConnected) {
    return (
      <Button onClick={() => disconnect()} variant={variant} className={className}>
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={() => open()} variant={variant} className={className}>
      Connect Wallet
    </Button>
  );
}
