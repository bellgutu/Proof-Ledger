"use client";

import React, { useState } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { WalletHeader } from '@/components/shared/wallet-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PoolCard } from '@/components/liquidity/pool-card';
import { PlusCircle } from 'lucide-react';

export interface Pool {
  id: string;
  name: string;
  token1: { symbol: 'ETH' | 'WETH' | 'SOL'; amount: number };
  token2: { symbol: 'USDC' | 'USDT'; amount: number };
  tvl: number;
  volume24h: number;
  apr: number;
}

export interface UserPosition extends Pool {
  lpTokens: number;
  share: number;
  unclaimedRewards: number;
}

export default function LiquidityPage() {
  const { walletState } = useWallet();
  const { isConnected, marketData } = walletState;

  const [availablePools, setAvailablePools] = useState<Pool[]>([
    { id: '1', name: 'WETH/USDC', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5 },
    { id: '2', name: 'WETH/USDT', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDT', amount: 0 }, tvl: 120_000_000, volume24h: 25_000_000, apr: 11.8 },
    { id: '3', name: 'SOL/USDC', token1: { symbol: 'SOL', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 80_000_000, volume24h: 40_000_000, apr: 18.2 },
  ]);

  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);

  const handleAddPosition = (pool: Pool, lpTokens: number, share: number) => {
    setUserPositions(prev => {
      const existingPositionIndex = prev.findIndex(p => p.id === pool.id);
      if (existingPositionIndex > -1) {
        const updatedPositions = [...prev];
        updatedPositions[existingPositionIndex].lpTokens += lpTokens;
        updatedPositions[existingPositionIndex].share += share;
        return updatedPositions;
      }
      return [...prev, { ...pool, lpTokens, share, unclaimedRewards: 0 }];
    });
  };

  const handleUpdatePosition = (poolId: string, lpAmount: number, shareChange: number) => {
     setUserPositions(prev => prev.map(p => {
      if (p.id === poolId) {
        return { ...p, lpTokens: p.lpTokens + lpAmount, share: p.share + shareChange };
      }
      return p;
    }).filter(p => p.lpTokens > 0.00001)); // Remove if LP tokens are dust
  };


  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <div className="space-y-8">
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Your Liquidity Positions</CardTitle>
            <CardDescription>Manage your LP tokens and claim rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected && userPositions.length > 0 ? (
              userPositions.map(position => (
                <PoolCard 
                  key={`pos-${position.id}`} 
                  pool={position}
                  userPosition={position} 
                  onAddPosition={handleAddPosition}
                  onUpdatePosition={handleUpdatePosition}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">{isConnected ? "You have no active liquidity positions." : "Connect your wallet to see your positions."}</p>
            )}
          </CardContent>
        </Card>

        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-bold text-primary">Available Liquidity Pools</CardTitle>
                <CardDescription>Provide liquidity to earn trading fees and rewards.</CardDescription>
            </div>
            <Button disabled={!isConnected}><PlusCircle className="mr-2" />Create Pool</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {availablePools.map(pool => (
               <PoolCard 
                  key={`avail-${pool.id}`} 
                  pool={pool} 
                  onAddPosition={handleAddPosition}
                  onUpdatePosition={handleUpdatePosition}
                />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}