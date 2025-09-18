
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useAmmDemo, type MockTokenSymbol, MOCK_TOKENS } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Droplets, RefreshCw, Loader2, PlusCircle } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { AMM_CONTRACT_ADDRESS } from '@/contexts/amm-demo-context';
import { parseAbi, usePublicClient } from 'viem';

export function PoolManagementPanel() {
    const { state, actions } = useAmmDemo();
    const { walletState } = useWallet();
    const [tokenA, setTokenA] = useState<MockTokenSymbol|''>('');
    const [tokenB, setTokenB] = useState<MockTokenSymbol|''>('');
    const [isCheckingExisting, setIsCheckingExisting] = useState(false);
    const [poolExists, setPoolExists] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const { toast } = useToast();
    const publicClient = usePublicClient();

    useEffect(() => {
        const info = {
            poolsCount: state.pools.length,
            pools: state.pools.map(p => ({
                name: p.name,
                address: p.address,
                tokenA: p.tokenA.symbol,
                tokenB: p.tokenB.symbol
            })),
            tokenBalances: state.tokenBalances,
            processingStates: state.processingStates,
            isConnected: state.isConnected
        };
        setDebugInfo(JSON.stringify(info, null, 2));
    }, [state.pools, state.tokenBalances, state.processingStates, state.isConnected]);

    useEffect(() => {
        const checkExistingPool = async () => {
            if (!tokenA || !tokenB || tokenA === tokenB) {
                setPoolExists(false);
                return;
            }
            
            setIsCheckingExisting(true);
            try {
                const existing = state.pools.some(pool => 
                    (pool.tokenA.symbol === tokenA && pool.tokenB.symbol === tokenB) ||
                    (pool.tokenA.symbol === tokenB && pool.tokenB.symbol === tokenA)
                );
                setPoolExists(existing);
            } catch (e) {
                console.error("Failed to check existing pool", e);
            } finally {
                setIsCheckingExisting(false);
            }
        };
        
        checkExistingPool();
    }, [tokenA, tokenB, state.pools]);

    const handleCreatePool = () => {
        if (!tokenA || !tokenB || tokenA === tokenB) return;
        actions.createPool(tokenA, tokenB);
    }

    const handleTestCreatePool = async () => {
        try {
            console.log("Creating test pool...");
            await actions.createPool('USDT', 'USDC');
        } catch (e: any) {
            console.error("Failed to create test pool:", e);
            toast({
                variant: "destructive",
                title: "Pool Creation Failed",
                description: e.message
            });
        }
    };

    const handleManualFetch = async () => {
        if (!publicClient) return;
        try {
            const AMM_ABI = parseAbi(["function getPool(address, address) view returns (address)"]);
            const usdtAddress = '0xC9569792794d40C612C6E4cd97b767EeE4708f24';
            const usdcAddress = '0xc4733C1fbdB1Ccd9d2Da26743F21fd3Fe12ECD37';

            let poolAddress = await publicClient.readContract({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'getPool',
                args: [usdtAddress, usdcAddress]
            });
            
            if (poolAddress === '0x0000000000000000000000000000000000000000') {
                 poolAddress = await publicClient.readContract({
                    address: AMM_CONTRACT_ADDRESS,
                    abi: AMM_ABI,
                    functionName: 'getPool',
                    args: [usdcAddress, usdtAddress]
                });
            }
            
            console.log("Manual fetch result:", poolAddress);
            
            if (poolAddress !== '0x0000000000000000000000000000000000000000') {
                toast({ title: "Pool Found", description: `Pool address: ${poolAddress}` });
                await actions.refreshData();
            } else {
                toast({ variant: "destructive", title: "Pool Not Found", description: "The pool does not exist" });
            }
        } catch (e: any) {
            console.error("Manual fetch error:", e);
            toast({ variant: "destructive", title: "Error", description: e.message || "Failed to fetch pool" });
        }
    };
     
    const tokenOptions = useMemo(() => Object.keys(state.tokenBalances) as MockTokenSymbol[], [state.tokenBalances]);

    const verifyPoolCreated = useCallback(async () => {
        if (!publicClient) return;
        
        try {
            const AMM_ABI = parseAbi(["function poolCount() view returns (uint256)", "function pools(uint256) view returns (address)"]);
            const poolCount = await publicClient.readContract({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'poolCount'
            });
            
            console.log("Pool count:", Number(poolCount));
            
            if (Number(poolCount) > 0) {
                const poolAddress = await publicClient.readContract({
                    address: AMM_CONTRACT_ADDRESS,
                    abi: AMM_ABI,
                    functionName: 'pools',
                    args: [BigInt(Number(poolCount) - 1)]
                });
                console.log("Latest pool address:", poolAddress);
                toast({ title: "Verification", description: `Latest pool is at ${poolAddress}`});
                await actions.refreshData();
            } else {
                toast({ title: "Verification", description: "Pool count is zero."});
            }
        } catch (e: any) {
            console.error("Failed to verify pool creation:", e);
             toast({ variant: "destructive", title: "Verification Error", description: e.message });
        }
    }, [publicClient, actions, toast]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><PlusCircle /> Create New Pool</CardTitle>
                    <CardDescription>Bootstrap a new AI-AMM pool.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Button onClick={handleTestCreatePool} variant="outline" className="w-full">
                        Create Test Pool (USDT/USDC)
                    </Button>
                    <Button onClick={handleManualFetch} variant="outline" className="w-full">
                        Manual Fetch USDT/USDC Pool
                    </Button>
                     <Button onClick={verifyPoolCreated} variant="outline" className="w-full">
                        Verify Pool Creation
                    </Button>
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
                    
                    {isCheckingExisting && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 size={14} className="animate-spin" />
                            Checking if pool exists...
                        </div>
                    )}
                    
                    {poolExists && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                            <p className="text-sm text-yellow-300">
                                A pool for {tokenA}/{tokenB} already exists. Please select a different token pair.
                            </p>
                        </div>
                    )}
                    
                    {tokenA && tokenB && tokenA === tokenB && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-sm text-red-400">
                                Please select two different tokens.
                            </p>
                        </div>
                    )}
                    
                    <Button 
                        onClick={handleCreatePool} 
                        disabled={!tokenA || !tokenB || tokenA === tokenB || poolExists || !state.isConnected || state.isProcessing(`CreatePool_${tokenA}_${tokenB}`)} 
                        className="w-full"
                    >
                        {state.isProcessing(`CreatePool_${tokenA}_${tokenB}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                        Create Pool
                    </Button>

                    {debugInfo && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <h4 className="font-semibold mb-2">Debug Information</h4>
                            <pre className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto">{debugInfo}</pre>
                        </div>
                    )}
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
                        <ScrollArea className="h-60">
                            {state.pools.map(pool => (
                                <div key={pool.address} className="p-3 border rounded-md mb-2 hover:bg-muted/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold">{pool.name}</p>
                                                <Badge variant="outline">{pool.feeRate.toFixed(2)}% fee</Badge>
                                                <Badge variant="outline">{pool.apy.toFixed(1)}% APY</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {`${pool.address.slice(0,6)}...${pool.address.slice(-4)}`}
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
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    