
"use client";
import React, { useState } from 'react';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, PieChart, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

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
        actions.removeLiquidity(pool.address, lpAmount);
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
                            
                            <div className="space-y-2">
                                <Label>Amount {pool.tokenB.symbol}</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={amountB} onChange={e => setAmountB(e.target.value)} placeholder="0.0" />
                                    <Button size="sm" variant="outline" onClick={handleSetMaxB}>MAX</Button>
                                </div>
                                <div className="text-xs text-muted-foreground">Balance: {parseFloat(state.tokenBalances[pool.tokenB.symbol]).toLocaleString()}</div>
                            </div>
                            
                            <Button onClick={handleAddLiquidity} disabled={!amountA || !amountB || !walletState.isConnected || state.isProcessing(`AddLiquidity_${pool.address}`)} className="w-full">
                                {state.isProcessing(`AddLiquidity_${pool.address}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null} Add Liquidity
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
                                    <div className="flex justify-between"><span>{pool.tokenA.symbol}:</span> <span>{(parseFloat(lpAmount) / parseFloat(pool.totalLiquidity) * parseFloat(pool.reserveA)).toFixed(6)}</span></div>
                                    <div className="flex justify-between"><span>{pool.tokenB.symbol}:</span> <span>{(parseFloat(lpAmount) / parseFloat(pool.totalLiquidity) * parseFloat(pool.reserveB)).toFixed(6)}</span></div>
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
