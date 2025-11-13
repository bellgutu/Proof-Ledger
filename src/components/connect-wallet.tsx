
"use client";

import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { Button, type ButtonProps } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function ConnectWallet({ variant = "default", className }: { variant?: ButtonProps["variant"], className?: string }) {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

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
          <DropdownMenuItem onClick={() => disconnect()}>
            <LogOut size={16} className="mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={() => open()} 
      variant={variant}
      className={cn(
        "bg-cyan-600 hover:bg-cyan-700 text-white",
        variant === 'outline' && "border-cyan-600 text-cyan-600 hover:bg-cyan-600/10 hover:text-cyan-500",
        className
    )}>
      Connect Wallet
    </Button>
  );
}
