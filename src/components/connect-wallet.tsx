
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';


export function ConnectWallet({ variant = "default", className }: { variant?: ButtonProps["variant"], className?: string }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockAddress = '0x84d436A568A5C2D3B24F3319808d928221B20A7B';
    setAddress(mockAddress);
    setIsConnected(true);
    setIsConnecting(false);
    localStorage.setItem('mockWalletConnected', 'true');
    localStorage.setItem('mockWalletAddress', mockAddress);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    localStorage.removeItem('mockWalletConnected');
    localStorage.removeItem('mockWalletAddress');
  }, []);

  useEffect(() => {
    if (localStorage.getItem('mockWalletConnected') === 'true') {
      setAddress(localStorage.getItem('mockWalletAddress'));
      setIsConnected(true);
    }
  }, []);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className={cn("flex items-center gap-2", className)}>
            <Wallet size={16} className="text-primary" />
            <span className="font-mono text-sm">{truncateAddress(address)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/compliance">
                <FileCheck size={16} className="mr-2" />
                View Compliance Status
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={disconnect}>
            <LogOut size={16} className="mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={connectWallet} 
      disabled={isConnecting}
      variant={variant}
      className={cn(
        "bg-cyan-600 hover:bg-cyan-700 text-white",
        variant === 'outline' && "border-cyan-600 text-cyan-600 hover:bg-cyan-600/10 hover:text-cyan-500",
        className
    )}>
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
