"use client";

import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCcw } from 'lucide-react';

export function WalletHeader() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, isConnecting, walletAddress, walletBalance } = walletState;
  const { connectWallet, disconnectWallet } = walletActions;

  return (
    <Card className="bg-card text-card-foreground transform transition-transform duration-300 hover:scale-[1.01]">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <Wallet size={48} className="text-primary" />
          {!isConnected ? (
            <h3 className="text-xl font-bold">Connect your wallet</h3>
          ) : (
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-foreground">Connected Wallet</h3>
              <p className="text-muted-foreground text-sm break-all">{walletAddress}</p>
            </div>
          )}
        </div>
        {isConnected ? (
          <div className="flex flex-col items-center md:items-end space-y-2">
            <div className="text-2xl font-bold text-foreground">${walletBalance}</div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <Button onClick={disconnectWallet} variant="secondary">
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={connectWallet} disabled={isConnecting} variant="default" size="lg">
            {isConnecting ? (
              <span className="flex items-center">
                <RefreshCcw size={16} className="mr-2 animate-spin" /> Connecting...
              </span>
            ) : (
              'Connect Wallet'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
