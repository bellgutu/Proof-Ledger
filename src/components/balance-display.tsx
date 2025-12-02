
'use client';

import { useWalletBalances } from '@/components/wallet-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Coins } from 'lucide-react';

export function BalanceDisplay() {
  const { balances, isLoading } = useWalletBalances();

  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Coins className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">Native Token</span>
                </div>
                <Skeleton className="h-6 w-24" />
            </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                    <span className="font-medium">USDC</span>
                </div>
                 <Skeleton className="h-6 w-20" />
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Coins className="h-5 w-5 mr-2 text-primary" />
          <span className="font-medium">Native Token</span>
        </div>
        <span className="font-semibold">{balances.eth}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-500" />
          <span className="font-medium">USDC</span>
        </div>
        <span className="font-semibold">{balances.usdc}</span>
      </div>
    </div>
  );
}
