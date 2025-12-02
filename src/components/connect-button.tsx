
'use client';

import { useWallet } from '@/components/wallet-provider';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectButton() {
  const { 
    isConnected, 
    account, 
    disconnectWallet, 
    connectWallet, 
    isBalanceLoading,
    currentChain 
  } = useWallet();

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        {currentChain && (
          <div className="hidden sm:block px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
            {currentChain.name}
          </div>
        )}
        <div className="px-4 py-2 bg-secondary text-primary-foreground rounded-md font-mono text-sm">
          {formatAddress(account)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnectWallet}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Disconnect</span>
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => connectWallet()}>
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
