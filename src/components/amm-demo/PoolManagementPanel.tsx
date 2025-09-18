
"use client";
import React, { useState, useMemo } from 'react';
import { useAmmDemo, type MockTokenSymbol } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Droplets, Eye, Loader2, PlusCircle } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

export function PoolManagementPanel() {
     const { state, actions } = useAmmDemo();
     const { walletState } = useWallet();
     const [tokenA, setTokenA] = useState<MockTokenSymbol|''>('');
     const [tokenB, setTokenB] = useState<MockTokenSymbol|''>('');

     const handleCreatePool = () => {
        if (!tokenA || !tokenB || tokenA === tokenB) return;
        actions.createPool(tokenA, tokenB);
     }
     
     const tokenOptions = useMemo(() => Object.keys(state.tokenBalances) as MockTokenSymbol[], [state.tokenBalances]);

     return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><PlusCircle /> Create New Pool</CardTitle>
                    <CardDescription>Bootstrap a new AI-AMM pool.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Select onValueChange={(v) => setTokenA(v as MockTokenSymbol)} value={tokenA}>
                            <SelectTrigger><SelectValue placeholder="Token A"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={(v) => setTokenB(v as MockTokenSymbol)} value={tokenB}>
                            <SelectTrigger><SelectValue placeholder="Token B"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreatePool} disabled={!tokenA || !tokenB || !walletState.isConnected || state.isProcessing(`CreatePool_${tokenA}_${tokenB}`)} className="w-full">
                        {state.isProcessing(`CreatePool_${tokenA}/${tokenB}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                        Create Pool
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Droplets /> Existing Pools</CardTitle>
                    <CardDescription>View and manage liquidity pools.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-60">
                        {state.pools.length > 0 ? state.pools.map(pool => (
                            <div key={pool.address} className="p-3 border rounded-md mb-2 hover:bg-muted/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{pool.name}</p>
                                        <p className="text-xs text-muted-foreground">{`${pool.address.slice(0,6)}...${pool.address.slice(-4)}`}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline">{pool.feeRate.toFixed(2)}% fee</Badge>
                                            <Badge variant="outline">{pool.apy.toFixed(1)}% APY</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                      <p className="text-xs text-muted-foreground mr-2">TVL: ${ (parseFloat(pool.reserveA) * (pool.tokenA.symbol.includes('WETH') ? 1800: 1) + parseFloat(pool.reserveB) * (pool.tokenB.symbol.includes('WETH') ? 1800: 1) ).toLocaleString(undefined, {maximumFractionDigits: 0}) }</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No pools found. Create your first pool!
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
