

"use client";

import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, RefreshCcw, Orbit, Send } from 'lucide-react';
import Image from 'next/image';

export function WalletHeader() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, isConnecting, walletAddress, walletBalance } = walletState;
  const { connectWallet, disconnectWallet } = walletActions;

  return (
    <Card className="bg-card text-card-foreground transform transition-transform duration-300 hover:scale-[1.01]">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-4 mb-4 md:mb-0 w-full md:w-auto">
          <Wallet size={48} className="text-primary flex-shrink-0" />
          {!isConnected ? (
            <h3 className="text-xl font-bold">Connect your wallet</h3>
          ) : (
            <div className="flex flex-col min-w-0">
              <h3 className="text-xl font-bold text-foreground">Connected Wallet</h3>
              <p className="text-muted-foreground text-sm break-all truncate">{walletAddress}</p>
            </div>
          )}
        </div>
        {isConnected ? (
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <div className="text-2xl font-bold text-foreground">${walletBalance}</div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
            </div>
            <div className="flex flex-col gap-2">
                 <Button onClick={disconnectWallet} variant="secondary" size="sm">
                    Disconnect
                </Button>
            </div>
          </div>
        ) : (
           <Dialog>
              <DialogTrigger asChild>
                 <Button disabled={isConnecting} variant="default" size="lg">
                    {isConnecting ? (
                      <span className="flex items-center">
                        <RefreshCcw size={16} className="mr-2 animate-spin" /> Connecting...
                      </span>
                    ) : (
                      'Connect Wallet'
                    )}
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl">Connect a Wallet</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Button variant="outline" className="h-16 text-lg" onClick={connectWallet}>
                    <Orbit className="mr-4" size={28} />
                    Browser Wallet
                  </Button>
                   <Button variant="outline" className="h-16 text-lg" onClick={connectWallet}>
                    <Image src="https://explorer.walletconnect.com/logo.svg" alt="WalletConnect" width={28} height={28} className="mr-4"/>
                    WalletConnect
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
