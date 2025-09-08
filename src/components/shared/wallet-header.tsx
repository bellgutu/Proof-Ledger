
"use client";

import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCcw, CircleDollarSign } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

export function WalletHeader() {
  const { open } = useWeb3Modal();
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { walletState } = useWallet();
  const { walletBalance } = walletState;

  // Add state to control initial connection check
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  
  // Only check for connection after component mounts
  useEffect(() => {
    setHasCheckedConnection(true);
  }, []);

  const clearWalletStorage = () => {
    if (process.env.NODE_ENV === 'development') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // Don't render anything until we've checked connection status
  if (!hasCheckedConnection) {
    return (
      <Card className="bg-card text-card-foreground transform transition-transform duration-300 hover:scale-[1.01] overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground transform transition-transform duration-300 hover:scale-[1.01] overflow-hidden">
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {isConnected && address ? (
          <>
            <div className="flex items-center space-x-4">
              <Wallet size={32} className="text-primary flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <p className="text-muted-foreground text-xs">Connected Wallet</p>
                <p className="font-mono text-sm break-all truncate">{address}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-right">
                    <CircleDollarSign size={32} className="text-primary"/>
                    <div>
                        <p className="text-muted-foreground text-xs">Total Balance</p>
                        <p className="text-2xl font-bold text-foreground">
                            ${walletBalance}
                        </p>
                    </div>
                </div>
                {process.env.NODE_ENV === 'development' && (
                  <Button onClick={clearWalletStorage} variant="outline" size="sm">
                    Clear Storage
                  </Button>
                )}
                <Button onClick={() => disconnect()} variant="secondary" size="sm">
                    Disconnect
                </Button>
            </div>
          </>
        ) : (
          <>
             <div className="flex items-center space-x-4">
              <Wallet size={32} className="text-muted-foreground flex-shrink-0" />
               <div>
                  <h3 className="text-lg font-bold">Connect Your Wallet</h3>
                  <p className="text-sm text-muted-foreground">To view and manage your assets.</p>
               </div>
            </div>
            <Button onClick={() => open()} disabled={isConnecting} variant="default" size="lg" className="animate-pulse-strong">
                {isConnecting ? (
                  <span className="flex items-center">
                    <RefreshCcw size={16} className="mr-2 animate-spin" /> Connecting...
                  </span>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
