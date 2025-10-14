
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAmmDemo, type MockTokenSymbol, MOCK_TOKENS } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Droplets, RefreshCw, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getViemPublicClient } from '@/services/blockchain-service'; // Import this
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';

export function PoolManagementPanel() {
    const { state, actions } = useAmmDemo();
    const [tokenA, setTokenA] = useState<MockTokenSymbol|'' >('');
    const [tokenB, setTokenB] = useState<MockTokenSymbol|'' >('');
    const [isCheckingExisting, setIsCheckingExisting] = useState(false);
    const [poolExists, setPoolExists] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState(false);
    const { toast } = useToast();
    const publicClient = getViemPublicClient();

    const handleCreatePool = () => {
        if (!tokenA || !tokenB || tokenA === tokenB) return;
        // Simple check before calling action
        const existing = state.pools.some(pool => 
            (pool.tokenA.symbol === tokenA && pool.tokenB.symbol === tokenB) ||
            (pool.tokenA.symbol === tokenB && pool.tokenB.symbol === tokenA)
        );
        if (existing) {
            toast({ variant: 'destructive', title: "Pool Exists", description: `A pool for ${tokenA}/${tokenB} already exists.`});
            return;
        }
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
                    
                    {tokenA && tokenB && tokenA === tokenB && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-sm text-red-400">
                                Please select two different tokens.
                            </p>
                        </div>
                    )}
                    
                    <Button 
                        onClick={handleCreatePool} 
                        disabled={!tokenA || !tokenB || tokenA === tokenB || !state.isConnected || state.isProcessing(`CreatePool_${tokenA}_${tokenB}`)} 
                        className="w-full"
                    >
                        {state.isProcessing(`CreatePool_${tokenA}_${tokenB}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                        Create Pool
                    </Button>

                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-3"><Droplets /> Existing Pools</CardTitle>
                            <CardDescription>View and manage liquidity pools.</CardDescription>
                        </div>
                        <Button size="sm" variant="outline" onClick={actions.refreshData} disabled={state.isProcessing('refresh')}>
                            {state.isProcessing('refresh') ? <Loader2 size={14} className="mr-1 animate-spin"/> : <RefreshCw size={14} className="mr-1" />} Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {state.pools.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Droplets className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-2">No pools found.</p>
                            <p className="text-sm">Create your first pool to get started!</p>
                        </div>
                    ) : (
                        <div className="h-60 overflow-y-auto">
                            {state.pools.map(pool => (
                                <div key={pool.address} className="p-3 border rounded-md mb-2 hover:bg-muted/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    <Image src={getTokenLogo(pool.tokenA.symbol)} alt="" width={20} height={20} className="rounded-full border-2 border-background"/>
                                                    <Image src={getTokenLogo(pool.tokenB.symbol)} alt="" width={20} height={20} className="rounded-full border-2 border-background"/>
                                                </div>
                                                <p className="font-bold">{pool.name}</p>
                                                <Badge variant="outline">{pool.feeRate.toFixed(2)}% fee</Badge>
                                                <Badge variant="outline">{pool.apy.toFixed(1)}% APY</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Pool ID: {pool.id}
                                            </p>
                                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>Reserve {pool.tokenA.symbol}: {parseFloat(pool.reserveA).toLocaleString()}</span>
                                                <span>Reserve {pool.tokenB.symbol}: {parseFloat(pool.reserveB).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">
                                                TVL: ${(
                                                    parseFloat(pool.reserveA) * (pool.tokenA.symbol.includes('WETH') ? 1800 : 1) + 
                                                    parseFloat(pool.reserveB) * (pool.tokenB.symbol.includes('WETH') ? 1800 : 1)
                                                ).toLocaleString(undefined, {maximumFractionDigits: 0})}
                                            </p>
                                            {parseFloat(pool.userLpBalance) > 0 && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    Your LP: {parseFloat(pool.userLpBalance).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
