'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <div>
            {!connected ? (
              <Button onClick={openConnectModal}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={openChainModal}
                  variant="outline"
                  size="sm"
                >
                  {chain.name}
                </Button>
                <Button
                  onClick={openAccountModal}
                  size="sm"
                >
                  {account.displayName}
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
