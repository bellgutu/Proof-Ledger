
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import * as feeFixer from '@/lib/feeFixer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Loader2, HardHat } from 'lucide-react';
import { type Address } from 'viem';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const FeeFixerPanel = () => {
    const [account, setAccount] = useState<Address | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'fixing' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<{ status: string, message: string } | null>(null);
    const [feeToAddress, setFeeToAddress] = useState<Address | 'Error' | 'Not Connected' | 'Loading'>('Not Connected');
    
    const formatAddress = (address: string | undefined) => {
        if (!address) return 'N/A';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const fetchStatus = useCallback(async () => {
        setFeeToAddress('Loading');
        try {
            const recipient = await feeFixer.getFactoryFeeTo();
            setFeeToAddress(recipient);
        } catch (e) {
            setFeeToAddress('Error');
        }
    }, []);
    
    useEffect(() => {
        if (isConnected) {
            fetchStatus();
        }
    }, [isConnected, fetchStatus]);

    const connectWallet = async () => {
        setStatus('connecting');
        try {
            const address = await feeFixer.connect();
            setAccount(address);
            setIsConnected(true);
            setStatus('connected');
        } catch (error: any) {
            console.error('Connection error:', error);
            setStatus('error');
            setResult({ status: 'error', message: error.message });
        }
    };

    const fixFeeRecipient = async () => {
        if (!isConnected) return;
        
        setIsFixing(true);
        setStatus('fixing');
        setResult(null);
        
        try {
            const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as Address;
            if(!treasuryAddress) throw new Error("Treasury address is not configured in environment variables.");
            
            const { hash } = await feeFixer.setFactoryFeeTo(treasuryAddress);
            
            setResult({ status: 'success', message: `Fee recipient set successfully! Tx: ${formatAddress(hash)}` });
            setStatus('success');
            
            await fetchStatus();
        } catch (error: any) {
            console.error('Fix error:', error);
            setStatus('error');
            setResult({ status: 'error', message: error.shortMessage || error.message });
        } finally {
            setIsFixing(false);
        }
    };

    const StatusIndicator = () => {
        if (feeToAddress === 'Loading') {
            return <span className="flex items-center text-muted-foreground"><Loader2 className="mr-2 animate-spin"/> Checking...</span>
        }
        if (feeToAddress === 'Error' || feeToAddress === 'Not Connected') {
            return <span className="flex items-center text-destructive"><XCircle className="mr-2"/> {feeToAddress}</span>
        }
        if (feeToAddress === ZERO_ADDRESS) {
            return <span className="flex items-center text-yellow-500"><AlertTriangle className="mr-2"/> Not Set (Zero Address)</span>
        }
        return <span className="flex items-center text-green-500"><CheckCircle className="mr-2"/> Set: {formatAddress(feeToAddress)}</span>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <HardHat className="text-primary"/>
                    DEX Factory Fee Fixer
                </CardTitle>
                <CardDescription>
                    This tool corrects the protocol fee destination for the DEX Factory contract. This is required for liquidity pools to function correctly.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-2">Factory Status</h4>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Fee Recipient:</span>
                        <StatusIndicator />
                    </div>
                </div>

                {!isConnected ? (
                    <Button onClick={connectWallet} disabled={status === 'connecting'} className="w-full">
                        {status === 'connecting' ? <Loader2 className="animate-spin" /> : 'Connect Wallet to Begin'}
                    </Button>
                ) : (
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Connected as: <span className="font-mono">{formatAddress(account!)}</span></p>
                        <Button 
                            onClick={fixFeeRecipient}
                            disabled={isFixing || feeToAddress === 'Error' || (feeToAddress !== ZERO_ADDRESS && feeToAddress !== 'Loading')}
                            className="w-full"
                        >
                            {isFixing ? <Loader2 className="mr-2 animate-spin"/> : <HardHat className="mr-2"/>}
                            {isFixing ? 'Setting Recipient...' : 'Set Fee Recipient to Treasury'}
                        </Button>
                    </div>
                )}
                
                {result && (
                    <Alert variant={result.status === 'error' ? 'destructive' : 'default'} className={result.status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-700' : ''}>
                        {result.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle>{result.status === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};
