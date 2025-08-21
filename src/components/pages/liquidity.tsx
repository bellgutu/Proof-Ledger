
"use client";

import React, { useState } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { WalletHeader } from '@/components/shared/wallet-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PoolCard } from '@/components/liquidity/pool-card';
import { PlusCircle, ChevronsUpDown, BrainCircuit, Loader2, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { getLpStrategy, type LPStrategy } from '@/ai/flows/lp-advisor-flow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp } from 'lucide-react';
import { LiquidityAnalytics } from '../liquidity/liquidity-analytics';


export interface Pool {
  id: string;
  name: string;
  type: 'V2' | 'V3' | 'Stable'; // V2 = Standard, V3 = Concentrated, Stable = Stable-Swap
  token1: string;
  token2: string;
  tvl: number;
  volume24h: number;
  apr: number;
  feeTier?: number;
  priceRange?: { min: number; max: number };
}

export interface UserPosition extends Pool {
  lpTokens: number;
  share: number;
  unclaimedRewards: number;
  impermanentLoss: number; // Added for IL tracking
}

export default function LiquidityPage() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, marketData, availablePools, userPositions } = walletState;
  const { updateBalance, addTransaction, setAvailablePools, setUserPositions } = walletActions;
  const { toast } = useToast();
  
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LPStrategy[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // State for creating a new pool
  const [newPoolType, setNewPoolType] = useState<'V2' | 'V3' | 'Stable'>('V2');
  const [newToken1, setNewToken1] = useState('');
  const [newToken2, setNewToken2] = useState('');
  const [newFeeTier, setNewFeeTier] = useState<number | undefined>(0.3);
  const [newPriceRange, setNewPriceRange] = useState({ min: '', max: '' });
  
  const tokenOptions = Object.keys(marketData);

  const handleAddPosition = (pool: Pool, lpTokens: number, share: number, amount1: number, amount2: number) => {
    setUserPositions(prev => {
      const existingPositionIndex = prev.findIndex(p => p.id === pool.id);
      if (existingPositionIndex > -1) {
        const updatedPositions = [...prev];
        updatedPositions[existingPositionIndex].lpTokens += lpTokens;
        updatedPositions[existingPositionIndex].share += share;
        return updatedPositions;
      }
      return [...prev, { ...pool, lpTokens, share, unclaimedRewards: Math.random() * 50, impermanentLoss: Math.random() * -5 }];
    });

    addTransaction({
      type: 'Add Liquidity',
      details: `Added ${amount1.toFixed(2)} ${pool.token1} and ${amount2.toFixed(2)} ${pool.token2} to ${pool.name} pool`,
    });
  };

  const handleUpdatePosition = (poolId: string, lpAmount: number, shareChange: number) => {
     setUserPositions(prev => prev.map(p => {
      if (p.id === poolId) {
        if(p.lpTokens + lpAmount > 0.00001) {
          addTransaction({
            type: 'Remove Liquidity',
            details: `Removed ${(shareChange / p.share * 100).toFixed(2)}% of liquidity from ${p.name} pool`
          });
        }
        return { ...p, lpTokens: p.lpTokens + lpAmount, share: p.share + shareChange };
      }
      return p;
    }).filter(p => p.lpTokens > 0.00001));
  };

  const handleClaimRewards = (positionId: string, rewards: number) => {
    const position = userPositions.find(p => p.id === positionId);
    if(!position) return;

    updateBalance('USDT', rewards); // Assuming rewards are in USDT
    setUserPositions(prev => prev.map(p => {
      if (p.id === positionId) {
        return { ...p, unclaimedRewards: 0 };
      }
      return p;
    }));

    addTransaction({
      type: 'Add Liquidity',
      details: `Claimed $${rewards.toFixed(2)} rewards from ${position.name} pool.`
    });

    toast({ title: 'Rewards Claimed!', description: `$${rewards.toFixed(2)} has been added to your wallet.`});
  };

  const handleCreatePool = () => {
    if (!newToken1 || !newToken2 || (newPoolType !== 'Stable' && !newFeeTier) || newToken1 === newToken2) {
      toast({ variant: 'destructive', title: 'Invalid Pool Data', description: 'Please select two different tokens and a fee tier.'});
      return;
    }
     if (newPoolType === 'V3' && (!newPriceRange.min || !newPriceRange.max || parseFloat(newPriceRange.min) >= parseFloat(newPriceRange.max))) {
      toast({ variant: 'destructive', title: 'Invalid Price Range', description: 'Please set a valid price range for the concentrated pool.'});
      return;
    }

    const newPool: Pool = {
      id: (availablePools.length + 1).toString(),
      name: `${newToken1}/${newToken2}`,
      type: newPoolType,
      token1: newToken1,
      token2: newToken2,
      tvl: 0,
      volume24h: 0,
      apr: Math.random() * (newPoolType === 'Stable' ? 5 : 20),
      ...(newPoolType !== 'Stable' && { feeTier: newFeeTier }),
      ...(newPoolType === 'V3' && { priceRange: { min: parseFloat(newPriceRange.min), max: parseFloat(newPriceRange.max) } }),
    };

    setAvailablePools(prev => [...prev, newPool]);
    toast({ title: 'Pool Created!', description: `The ${newPool.name} pool is now available.`});

    // Reset form
    setNewToken1('');
    setNewToken2('');
    setNewFeeTier(0.3);
    setNewPoolType('V2');
    setNewPriceRange({ min: '', max: '' });
  };
  
  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestionError(null);
    setSuggestions([]);
    try {
      const result = await getLpStrategy();
      if (!result || !result.strategies) {
        throw new Error("AI did not return valid strategies.");
      }
      setSuggestions(result.strategies);
    } catch (e: any) {
      console.error(e);
      setSuggestionError(e.message || 'Could not fetch suggestions.');
      toast({ variant: 'destructive', title: 'AI Error', description: e.message || 'Could not fetch suggestions.' });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }

  const useSuggestion = (strategy: LPStrategy) => {
    const [t1, t2] = strategy.pair.split('/');
    if (!tokenOptions.includes(t1) || !tokenOptions.includes(t2)) {
      toast({ variant: 'destructive', title: 'Unsupported Token', description: `The AI suggested an unsupported token pair: ${strategy.pair}.`});
      return;
    }
    setNewToken1(t1);
    setNewToken2(t2);
    setNewFeeTier(strategy.feeTier);
    setNewPoolType('V2'); // Default suggestion to V2 for simplicity
  }

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positions"><TrendingUp className="mr-2" />Positions & Pools</TabsTrigger>
          <TabsTrigger value="create"><PlusCircle className="mr-2" />Create & Advise</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart2 className="mr-2" />Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="positions" className="mt-6 space-y-8">
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
                        onClaimRewards={handleClaimRewards}
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
                        onClaimRewards={handleClaimRewards}
                      />
                  ))}
                </CardContent>
              </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-6 space-y-8">
           <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>AI Strategy Advisor</span>
                  <Button size="sm" onClick={fetchSuggestions} disabled={isLoadingSuggestions}>
                    {isLoadingSuggestions ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                  </Button>
                </CardTitle>
                <CardDescription>Get AI-powered suggestions for new liquidity pools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingSuggestions && <div className="text-sm text-center text-muted-foreground">Looking for opportunities...</div>}
                {suggestionError && <p className="text-sm text-center text-destructive">{suggestionError}</p>}
                {suggestions.length > 0 ? (
                  suggestions.map((strat, i) => (
                      <Alert key={i}>
                        <AlertTitle className="font-bold">{strat.pair} at {strat.feeTier}%</AlertTitle>
                        <AlertDescription>{strat.justification}</AlertDescription>
                        <Button size="sm" variant="link" className="p-0 h-auto mt-2" onClick={() => useSuggestion(strat)}>Use this pair</Button>
                      </Alert>
                  ))
                ) : !isLoadingSuggestions && !suggestionError && (
                    <p className="text-sm text-center text-muted-foreground py-4">Click the AI button for suggestions.</p>
                )}
              </CardContent>
            </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Create a New Pool</CardTitle>
                  <CardDescription>Bootstrap a new pool by providing the initial liquidity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                    <Label>Pool Type</Label>
                    <RadioGroup defaultValue="V2" onValueChange={(val) => setNewPoolType(val as 'V2' | 'V3' | 'Stable')} className="grid grid-cols-3 gap-4 pt-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="V2" id="v2"/><Label htmlFor="v2">V2 Standard</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="V3" id="v3"/><Label htmlFor="v3">V3 Concentrated</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="Stable" id="stable"/><Label htmlFor="stable">Stable</Label></div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Token Pair</Label>
                    <div className="flex items-center gap-2">
                      <Select value={newToken1} onValueChange={setNewToken1}>
                        <SelectTrigger><SelectValue placeholder="Token A"/></SelectTrigger>
                        <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                        <Select value={newToken2} onValueChange={setNewToken2}>
                          <SelectTrigger><SelectValue placeholder="Token B"/></SelectTrigger>
                          <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                  </div>
                    
                  {newPoolType !== 'Stable' && (
                    <div className="space-y-2">
                      <Label>Fee Tier</Label>
                      <Select value={newFeeTier?.toString()} onValueChange={(val) => setNewFeeTier(parseFloat(val))}>
                        <SelectTrigger><SelectValue placeholder="Select Fee Tier"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.05">0.05%</SelectItem>
                          <SelectItem value="0.3">0.30%</SelectItem>
                          <SelectItem value="1">1.00%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newPoolType === 'V3' && (
                      <div className="space-y-2">
                      <Label>Price Range</Label>
                        <div className="flex items-center gap-2">
                        <Input type="number" value={newPriceRange.min} onChange={(e) => setNewPriceRange(p => ({...p, min: e.target.value}))} placeholder={`Min Price (${newToken2 || '...'})`}/>
                        <Input type="number" value={newPriceRange.max} onChange={(e) => setNewPriceRange(p => ({...p, max: e.target.value}))} placeholder={`Max Price (${newToken2 || '...'})`}/>
                      </div>
                      </div>
                  )}
                    
                    <Button onClick={handleCreatePool} disabled={!isConnected} className="w-full"><PlusCircle className="mr-2"/>Create Pool</Button>
              </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <LiquidityAnalytics userPositions={userPositions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
