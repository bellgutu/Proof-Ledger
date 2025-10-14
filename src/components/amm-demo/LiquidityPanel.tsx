
"use client";
import React, { useState, useMemo } from 'react';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, PieChart, Loader2, ShieldCheck } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { parseUnits } from 'viem';

export function LiquidityPanel() {
    const { state, actions } = useAmmDemo();
    const { walletState } = useWallet();
    const [selectedPool, setSelectedPool] = useState<string>('');
    const [amountA, setAmountA] = useState('');
    const [amountB, setAmountB] = useState('');
    const [lpAmount, setLpAmount] = useState('');
    
    const pool = state.pools.find(p => p.address === selectedPool);
    
    const handleAddLiquidity = () => {
        if (!pool || !amountA || !amountB) return;
        actions.addLiquidity(pool.id, amountA, amountB);
    };
    
    const handleRemoveLiquidity = () => {
        if (!pool || !lpAmount) return;
        actions.removeLiquidity(pool.id, lpAmount);
    };
    
    const handleSetMaxA = () => {
        if (!pool) return;
        setAmountA(state.tokenBalances[pool.tokenA.symbol]);
    };
    
    const handleSetMaxB = () => {
        if (!pool) return;
        setAmountB(state.tokenBalances[pool.tokenB.symbol]);
    };

    const handleSetMaxLP = () => {
        if (!pool) return;
        setLpAmount(pool.userLpBalance);
    };

    const needsApprovalA = useMemo(() => {
        if (!pool || !amountA) return false;
        const required = parseUnits(amountA, pool.tokenA.decimals);
        const allowance = state.tokenAllowances[pool.tokenA.symbol] || 0n;
        return required > allowance;
    }, [pool, amountA, state.tokenAllowances]);

    const needsApprovalB = useMemo(() => {
        if (!pool || !amountB) return false;
        const required = parseUnits(amountB, pool.tokenB.decimals);
        const allowance = state.tokenAllowances[pool.tokenB.symbol] || 0n;
        return required > allowance;
    }, [pool, amountB, state.tokenAllowances]);

    const handleApproveA = () => {
        if (!pool || !amountA) return;
        actions.approveToken(pool.tokenA.symbol, amountA);
    };
    
    const handleApproveB = () => {
        if (!pool || !amountB) return;
        actions.approveToken(pool.tokenB.symbol, amountB);
    };

    const isAddLiquidityDisabled = !amountA || !amountB || !walletState.isConnected || state.isProcessing(`AddLiquidity_${pool?.address}`) || needsApprovalA || needsApprovalB;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Droplets /> Add Liquidity</CardTitle>
                    <CardDescription>Provide liquidity to earn fees and LP tokens.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Pool</Label>
                        <Select onValueChange={setSelectedPool} value={selectedPool} disabled={state.pools.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={state.pools.length === 0 ? "No pools available" : "Select a pool"} />
                            </SelectTrigger>
                            <SelectContent>
                                {state.pools.map(p => <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {pool && (
                        <>
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <span>Reserve {pool.tokenA.symbol}</span><span className="font-mono text-right">{parseFloat(pool.reserveA).toLocaleString()}</span>
                                    <span>Reserve {pool.tokenB.symbol}</span><span className="font-mono text-right">{parseFloat(pool.reserveB).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Amount {pool.tokenA.symbol}</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={amountA} onChange={e => setAmountA(e.target.value)} placeholder="0.0" />
                                    <Button size="sm" variant="outline" onClick={handleSetMaxA}>MAX</Button>
                                </div>
                                <div className="text-xs text-muted-foreground">Balance: {parseFloat(state.tokenBalances[pool.tokenA.symbol]).toLocaleString()}</div>
                            </div>

                            {needsApprovalA && amountA && (
                                <Button onClick={handleApproveA} disabled={state.isProcessing(`Approve_${pool.tokenA.symbol}`)} className="w-full">
                                    {state.isProcessing(`Approve_${pool.tokenA.symbol}`) ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                                    Approve {pool.tokenA.symbol}
                                </Button>
                            )}
                            
                            <div className="space-y-2">
                                <Label>Amount {pool.tokenB.symbol}</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={amountB} onChange={e => setAmountB(e.target.value)} placeholder="0.0" />
                                    <Button size="sm" variant="outline" onClick={handleSetMaxB}>MAX</Button>
                                </div>
                                <div className="text-xs text-muted-foreground">Balance: {parseFloat(state.tokenBalances[pool.tokenB.symbol]).toLocaleString()}</div>
                            </div>
                            
                             {needsApprovalB && amountB && (
                                <Button onClick={handleApproveB} disabled={state.isProcessing(`Approve_${pool.tokenB.symbol}`)} className="w-full">
                                    {state.isProcessing(`Approve_${pool.tokenB.symbol}`) ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                                    Approve {pool.tokenB.symbol}
                                </Button>
                            )}

                            <Button onClick={handleAddLiquidity} disabled={isAddLiquidityDisabled} className="w-full">
                                {state.isProcessing(`AddLiquidity_${pool.address}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null} 
                                {needsApprovalA || needsApprovalB ? 'Approval Required' : 'Add Liquidity'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><PieChart /> Remove Liquidity</CardTitle>
                    <CardDescription>Remove liquidity and receive your tokens back.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label>Select Pool</Label>
                        <Select onValueChange={setSelectedPool} value={selectedPool} disabled={state.pools.filter(p => parseFloat(p.userLpBalance) > 0).length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a pool with LP" />
                            </SelectTrigger>
                            <SelectContent>
                                {state.pools.filter(p => parseFloat(p.userLpBalance) > 0).map(p => <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {pool && parseFloat(pool.userLpBalance) > 0 && (
                        <>
                            <div className="space-y-2">
                                <Label>LP Token Amount</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={lpAmount} onChange={e => setLpAmount(e.target.value)} placeholder="0.0" />
                                    <Button size="sm" variant="outline" onClick={handleSetMaxLP}>MAX</Button>
                                </div>
                                <div className="text-xs text-muted-foreground">Balance: {parseFloat(pool.userLpBalance).toLocaleString()}</div>
                            </div>
                            
                            {lpAmount && (
                                <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                                    <p>You'll receive (est.):</p>
                                    {/* <div className="flex justify-between"><span>{pool.tokenA.symbol}:</span> <span>{(parseFloat(lpAmount) / parseFloat(pool.totalLiquidity) * parseFloat(pool.reserveA)).toFixed(6)}</span></div> */}
                                    {/* <div className="flex justify-between"><span>{pool.tokenB.symbol}:</span> <span>{(parseFloat(lpAmount) / parseFloat(pool.totalLiquidity) * parseFloat(pool.reserveB)).toFixed(6)}</span></div> */}
                                </div>
                            )}
                            
                            <Button onClick={handleRemoveLiquidity} disabled={!lpAmount || !walletState.isConnected || state.isProcessing(`RemoveLiquidity_${pool.address}`)} className="w-full" variant="destructive">
                                {state.isProcessing(`RemoveLiquidity_${pool.address}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null} Remove Liquidity
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
