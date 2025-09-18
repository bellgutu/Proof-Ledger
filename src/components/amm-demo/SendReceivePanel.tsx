
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAmmDemo, type MockTokenSymbol, MOCK_TOKENS } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Loader2, RefreshCw } from 'lucide-react';
import { isValidAddress } from '@/lib/utils';
import { type Address } from 'viem';
import { useWallet } from '@/contexts/wallet-context';

export function SendReceivePanel() {
    const { state, actions } = useAmmDemo();
    const { walletState } = useWallet();
    const [token, setToken] = useState<MockTokenSymbol | 'ETH'>('ETH');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isAddressValid, setIsAddressValid] = useState(false);
    
    const tokenOptions = useMemo(() => ['ETH', ...Object.keys(MOCK_TOKENS)] as const, []);
    
    useEffect(() => {
        if (!recipient) {
            setIsValidAddress(false);
            return;
        }
        setIsValidAddress(isValidAddress(recipient));
    }, [recipient]);
    
    const handleSend = () => {
        if (!isAddressValid || !amount || parseFloat(amount) <= 0) return;
        actions.send(token, recipient as Address, amount);
    };
    
    const handleSetMax = () => {
        if (token === 'ETH') {
            setAmount(state.ethBalance);
        } else {
            setAmount(state.tokenBalances[token as MockTokenSymbol]);
        }
    };
    
    const getBalance = () => {
        if (token === 'ETH') return state.ethBalance;
        return state.tokenBalances[token as MockTokenSymbol];
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><RefreshCw /> Send & Receive</CardTitle>
                <CardDescription>Send tokens or ETH to any address on Sepolia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select value={token} onValueChange={(value) => setToken(value as MockTokenSymbol | 'ETH')}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ETH">
                                <div className="flex items-center gap-2">
                                    <Image src={getTokenLogo('ETH')} alt={'ETH'} width={24} height={24} />
                                    ETH
                                </div>
                            </SelectItem>
                            {tokenOptions.slice(1).map(t => (
                                <SelectItem key={t as string} value={t as string}>
                                    <div className="flex items-center gap-2">
                                        <Image src={getTokenLogo(t as string)} alt={t as string} width={24} height={24} />
                                        {t}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <Label>Recipient Address</Label>
                    <Input 
                        value={recipient} 
                        onChange={(e) => setRecipient(e.target.value)} 
                        placeholder="0x..." 
                        className={isAddressValid || !recipient ? "" : "border-red-500"}
                    />
                    {!isAddressValid && recipient && (
                        <p className="text-xs text-red-500">Please enter a valid Ethereum address</p>
                    )}
                </div>
                
                <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="0.0" 
                        />
                        <Button size="sm" variant="outline" onClick={handleSetMax}>
                            MAX
                        </Button>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Balance: {getBalance()}</span>
                        {amount && parseFloat(amount) > parseFloat(getBalance()) && (
                            <span className="text-red-500">Insufficient balance</span>
                        )}
                    </div>
                </div>
                
                {recipient && amount && isAddressValid && (
                    <div className="p-3 bg-muted rounded-md space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Network Fee</span>
                            <span>~{state.gasPrice} Gwei</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total</span>
                            <span>{amount} {token}</span>
                        </div>
                    </div>
                )}
                
                <Button 
                    onClick={handleSend} 
                    disabled={!isAddressValid || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(getBalance()) || !walletState.isConnected || state.isProcessing(`Send_${token}_${amount}`)} 
                    className="w-full"
                >
                    {state.isProcessing(`Send_${token}_${amount}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                    Send {token}
                </Button>
            </CardContent>
        </Card>
    );
}
