
"use client";

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button, type ButtonProps } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ConnectWallet({ variant = "default", className }: { variant?: ButtonProps["variant"], className?: string }) {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} className={cn("w-full md:w-auto", className)}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => disconnect()}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
             <Button variant={variant} className={cn("w-full md:w-auto", className)}>
                Connect Wallet
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Connect with</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {connectors.map((connector) => (
                <DropdownMenuItem key={connector.uid} onClick={() => connect({ connector })}>
                    {connector.name}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
