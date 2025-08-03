
"use client";

import React, { useState } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { WalletHeader } from '@/components/shared/wallet-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PoolCard } from '@/components/liquidity/pool-card';
import { PlusCircle, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface Pool {
  id: string;
  name: string;
  token1: { symbol: 'ETH' | 'WETH' | 'SOL' | 'USDC' | 'USDT' | 'BTC' | 'BNB' | 'XRP'; amount: number };
  token2: { symbol: 'ETH' | 'WETH' | 'SOL' | 'USDC' | 'USDT' | 'BTC' | 'BNB' | 'XRP'; amount: number };
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
  const { toast } = useToast();

  const [availablePools, setAvailablePools] = useState<Pool[]>([
    { id: '1', name: 'WETH/USDC', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5 },
    { id: '2', name: 'WETH/USDT', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDT', amount: 0 }, tvl: 120_000_000, volume24h: 25_000_000, apr: 11.8 },
    { id: '3', name: 'SOL/USDC', token1: { symbol: 'SOL', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 80_000_000, volume24h: 40_000_000, apr: 18.2 },
  ]);

  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);

  // State for creating a new pool
  const [newToken1, setNewToken1] = useState('');
  const [newToken2, setNewToken2] = useState('');
  const [newToken1Amount, setNewToken1Amount] = useState('');
  
  const tokenOptions = Object.keys(walletState.marketData) as (keyof typeof walletState.marketData)[];


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

  const handleCreatePool = () => {
    if (!newToken1 || !newToken2 || !newToken1Amount || parseFloat(newToken1Amount) <= 0 || newToken1 === newToken2) {
      toast({ variant: 'destructive', title: 'Invalid Pool Data', description: 'Please select two different tokens and enter a valid initial deposit.'});
      return;
    }

    const amount1 = parseFloat(newToken1Amount);
    const price1 = marketData[newToken1 as keyof typeof marketData].price;
    const price2 = marketData[newToken2 as keyof typeof marketData].price;
    const amount2 = amount1 * price1 / price2;

    const newPool: Pool = {
      id: (availablePools.length + 1).toString(),
      name: `${newToken1}/${newToken2}`,
      token1: { symbol: newToken1 as any, amount: amount1 },
      token2: { symbol: newToken2 as any, amount: amount2 },
      tvl: amount1 * price1 + amount2 * price2,
      volume24h: 0,
      apr: Math.random() * 20, // Simulate APR
    };

    setAvailablePools(prev => [...prev, newPool]);
    toast({ title: 'Pool Created!', description: `The ${newPool.name} pool is now available.`});

    // Reset form
    setNewToken1('');
    setNewToken2('');
    setNewToken1Amount('');
  };


  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
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
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Available Liquidity Pools</CardTitle>
                <CardDescription>Provide liquidity to earn trading fees and rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availablePools.map(pool => (
                <PoolCard 
                    key={`avail-${pool.id}`} 
                    pool={pool} 
                    onAddPosition={handleAddPosition}
                    onUpdatePosition={handleUpdatePosition}
                    userPosition={userPositions.find(p => p.id === pool.id)}
                  />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Pool</CardTitle>
                    <CardDescription>Bootstrap a new pool by providing the initial liquidity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token 1</label>
                       <Select value={newToken1} onValueChange={setNewToken1}>
                        <SelectTrigger><SelectValue placeholder="Select Token"/></SelectTrigger>
                        <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" value={newToken1Amount} onChange={(e) => setNewToken1Amount(e.target.value)} placeholder="Initial deposit amount"/>
                    </div>
                     <div className="flex justify-center -my-2"><ChevronsUpDown size={16} className="text-muted-foreground"/></div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Token 2</label>
                        <Select value={newToken2} onValueChange={setNewToken2}>
                          <SelectTrigger><SelectValue placeholder="Select Token"/></SelectTrigger>
                          <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input type="number" readOnly placeholder="Amount calculated automatically" />
                     </div>
                     <Button onClick={handleCreatePool} disabled={!isConnected} className="w-full"><PlusCircle className="mr-2"/>Create Pool</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
