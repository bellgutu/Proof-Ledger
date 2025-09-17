
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAmmDemo, type MockTokenSymbol } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTokenLogo } from '@/lib/tokenLogos';
import { ArrowRightLeft, Calculator, Loader2 } from 'lucide-react';

export function SwapPanel() {
    const { state, actions } = useAmmDemo();
    const [fromToken, setFromToken] = useState<MockTokenSymbol>('USDT');
    const [toToken, setToToken] = useState<MockTokenSymbol>('USDC');
    const [amount, setAmount] = useState('');
    const [minAmountOut, setMinAmountOut] = useState('');
    const [estimatedOut, setEstimatedOut] = useState('0');
    const [priceImpact, setPriceImpact] = useState(0);
    
    const tokenOptions = useMemo(() => Object.keys(state.tokenBalances) as MockTokenSymbol[], [state.tokenBalances]);
    
    useEffect(() => {
        if (!amount || !fromToken || !toToken) {
            setEstimatedOut('0');
            setPriceImpact(0);
            return;
        }
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
            setEstimatedOut('0');
            setPriceImpact(0);
            return;
        }
        
        const fromTokenInfo = MOCK_TOKENS[fromToken];
        const toTokenInfo = MOCK_TOKENS[toToken];
        const mockRate = fromTokenInfo.name.includes('WETH') ? 1800 : 1;
        const toTokenRate = toTokenInfo.name.includes('WETH') ? 1800 : 1;
        const rate = mockRate / toTokenRate;
        const estimated = amountNum * rate * 0.997; 
        const impact = Math.min(5, amountNum / 10000 * 0.5);
        
        setEstimatedOut(estimated.toFixed(6));
        setPriceImpact(impact);
    }, [amount, fromToken, toToken]);
    
    const handleSwap = () => {
        if (!fromToken || !toToken || !amount || !minAmountOut) return;
        actions.swap(fromToken, toToken, amount, minAmountOut);
    };
    
    const handleSetMax = () => {
        setAmount(state.tokenBalances[fromToken]);
    };
    
    const handleSetMinOut = () => {
        const minOut = parseFloat(estimatedOut) * 0.95;
        setMinAmountOut(minOut.toFixed(6));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><ArrowRightLeft /> Token Swap</CardTitle>
                <CardDescription>Swap tokens through the AI-AMM with optimized fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>From</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.0" />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Balance: {parseFloat(state.tokenBalances[fromToken]).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                <button type="button" className="text-primary hover:underline" onClick={handleSetMax}>MAX</button>
                            </div>
                        </div>
                        <Select value={fromToken} onValueChange={(v) => setFromToken(v as MockTokenSymbol)}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {tokenOptions.map(token => (
                                    <SelectItem key={token} value={token}>
                                        <div className="flex items-center gap-2">
                                            <Image src={getTokenLogo(token)} alt={token} width={16} height={16} />{token}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="flex justify-center">
                    <Button size="sm" variant="ghost" onClick={() => {
                        const temp = fromToken; setFromToken(toToken); setToToken(temp);
                        setAmount(''); setMinAmountOut('');
                    }}>
                        <ArrowRightLeft size={16} />
                    </Button>
                </div>
                
                 <div className="space-y-2">
                    <Label>To (Estimated)</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input type="number" value={estimatedOut} readOnly placeholder="0.0" />
                            <div className="text-xs text-muted-foreground mt-1">
                                Balance: {parseFloat(state.tokenBalances[toToken]).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                        </div>
                        <Select value={toToken} onValueChange={(v) => setToToken(v as MockTokenSymbol)}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {tokenOptions.map(token => (
                                    <SelectItem key={token} value={token}>
                                        <div className="flex items-center gap-2">
                                            <Image src={getTokenLogo(token)} alt={token} width={16} height={16} />{token}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>Minimum Output</Label>
                    <div className="flex gap-2">
                        <Input type="number" value={minAmountOut} onChange={e => setMinAmountOut(e.target.value)} placeholder="0.0" />
                        <Button size="sm" variant="outline" onClick={handleSetMinOut}><Calculator size={14} /></Button>
                    </div>
                    <div className="text-xs text-muted-foreground">Minimum amount you'll receive. Adjust for slippage tolerance.</div>
                </div>
                
                {amount && (
                    <div className="p-3 bg-muted rounded-md space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Exchange Rate</span>
                            <span>1 {fromToken} = {(parseFloat(estimatedOut) / parseFloat(amount)).toFixed(6)} {toToken}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Price Impact</span>
                            <span className={priceImpact > 1 ? "text-orange-500" : ""}>{priceImpact.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Network Fee</span>
                            <span>~{state.gasPrice} Gwei</span>
                        </div>
                    </div>
                )}
                
                <Button onClick={handleSwap} disabled={!fromToken || !toToken || !amount || !minAmountOut || !state.isConnected || state.isProcessing(`Swap_${fromToken}_${toToken}`)} className="w-full">
                    {state.isProcessing(`Swap_${fromToken}_${toToken}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null} Swap
                </Button>
            </CardContent>
        </Card>
    );
}
