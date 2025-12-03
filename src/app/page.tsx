'use client';

import { AssetDashboard } from '@/components/dashboard/AssetDashboard';
import { QuickMintTest } from '@/components/contracts/QuickMintTest';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-bold tracking-tight text-primary">
        Proof Ledger Dashboard
      </h1>

      {/* Wallet Overview */}
      <WalletDashboard />

      {/* Main Asset Dashboard */}
      <AssetDashboard />

      {/* Quick Test Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickMintTest />
        <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Contract Owner Notes</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>As contract owner, you may need to:</p>
            <ul className="list-disc list-inside">
              <li>Sign messages with your owner wallet</li>
              <li>Grant minter role to your address</li>
              <li>Check contract permissions in Remix/Etherscan</li>
              <li>Use contract's admin functions for testing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
