
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
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { isValidAddress } from '@/lib/utils';
import { type Address } from 'viem';
import { useWallet } from '@/contexts/wallet-context';

export function SendReceivePanel() {
    const { state, actions } = useAmmDemo();
    const { walletState } = useWallet();
    const [token, setToken] = useState<MockTokenSymbol | 'ETH'>('ETH');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isAddressValid, setIsAddressValid] = useState(false); // FIX: Added missing state
    const [isCheckingAddress, setIsCheckingAddress] = useState(false);
    
    const tokenOptions = useMemo(() => ['ETH', ...Object.keys(state.tokenBalances)] as const, [state.tokenBalances]);
    
    // Validate address as user types
    useEffect(() => {
        if (!recipient) {
            setIsValidAddress(false);
            return;
        }
        
        setIsCheckingAddress(true);
        
        // Debounce the validation
        const timer = setTimeout(() => {
            setIsValidAddress(isValidAddress(recipient));
            setIsCheckingAddress(false);
        }, 300);
        
        return () => clearTimeout(timer);
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

    const isInsufficientBalance = amount && parseFloat(amount) > parseFloat(getBalance());
    const isSendDisabled = !isAddressValid || !amount || parseFloat(amount) <= 0 || isInsufficientBalance || !state.isConnected || state.isProcessing(`Send_${token}_${amount}`);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Send /> Send & Receive</CardTitle>
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
                    <div className="relative">
                        <Input 
                            value={recipient} 
                            onChange={(e) => setRecipient(e.target.value)} 
                            placeholder="0x..." 
                            className={isAddressValid || !recipient ? "" : "border-red-500"}
                        />
                        {isCheckingAddress && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    {recipient && !isCheckingAddress && (
                        <div className="flex justify-between items-center">
                            {isAddressValid ? (
                                <span className="text-xs text-green-600">Valid address</span>
                            ) : (
                                <span className="text-xs text-red-500">Invalid Ethereum address</span>
                            )}
                            {recipient.length > 0 && recipient.length < 42 && (
                                <span className="text-xs text-muted-foreground">Address too short</span>
                            )}
                        </div>
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
                            step="any"
                        />
                        <Button size="sm" variant="outline" onClick={handleSetMax}>
                            MAX
                        </Button>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Balance: {getBalance()}</span>
                        {isInsufficientBalance && (
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
                    disabled={isSendDisabled}
                    className="w-full"
                >
                    {state.isProcessing(`Send_${token}_${amount}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : <Send className="mr-2"/>}
                    Send {token}
                </Button>
            </CardContent>
        </Card>
    );
}
