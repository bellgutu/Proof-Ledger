'use client';

import { WalletDashboard } from '@/components/wallet/WalletDashboard';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-bold tracking-tight text-primary">Enterprise Asset Platform</h1>
      
      {/* Main Wallet Interface */}
      <WalletDashboard />
      
    </div>
  );
}
