
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import * as feeFixer from '@/lib/feeFixer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Loader2, HardHat, Zap } from 'lucide-react';
import { type Address } from 'viem';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Pool addresses from deployment
const POOL_ADDRESSES = [
  "0x56639dB16Ac50A89228026e42a316B30179A5376", // USDT/USDC
  "0x0665FbB86a3acECa91Df68388EC4BBE11556DDce", // USDT/WETH
];

export const FeeFixerPanel = () => {
    const [account, setAccount] = useState<Address | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'fixing' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<{ status: string, message: string } | null>(null);
    const [factoryFeeTo, setFactoryFeeTo] = useState<Address | 'Error' | 'Not Connected' | 'Loading'>('Not Connected');
    const [poolFeeRecipients, setPoolFeeRecipients] = useState<Record<string, Address | 'Error' | 'Loading'>>({});
    
    const formatAddress = (address: string | undefined) => {
        if (!address) return 'N/A';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const fetchStatus = useCallback(async () => {
        setFactoryFeeTo('Loading');
        POOL_ADDRESSES.forEach(address => {
            setPoolFeeRecipients(prev => ({...prev, [address]: 'Loading'}));
        });
        
        try {
            // Fetch factory fee recipient
            const factoryRecipient = await feeFixer.getFactoryFeeTo();
            setFactoryFeeTo(factoryRecipient);
            
            // Fetch pool fee recipients
            const poolRecipients: Record<string, Address | 'Error'> = {};
            for (const poolAddress of POOL_ADDRESSES) {
                try {
                    const recipient = await feeFixer.getPoolFeeRecipient(poolAddress as Address);
                    poolRecipients[poolAddress] = recipient;
                } catch (e) {
                    poolRecipients[poolAddress] = 'Error';
                }
            }
            setPoolFeeRecipients(poolRecipients);
        } catch (e) {
            setFactoryFeeTo('Error');
            POOL_ADDRESSES.forEach(address => {
                setPoolFeeRecipients(prev => ({...prev, [address]: 'Error'}));
            });
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

    const fixFeeRecipients = async () => {
        if (!isConnected) return;
        
        setIsFixing(true);
        setStatus('fixing');
        setResult(null);
        
        try {
            const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as Address;
            if(!treasuryAddress) throw new Error("Treasury address is not configured in environment variables.");
            
            // Fix factory fee recipient
            const factoryTx = await feeFixer.setFactoryFeeTo(treasuryAddress);
            
            // Fix pool fee recipients
            const poolTxs: string[] = [];
            for (const poolAddress of POOL_ADDRESSES) {
                try {
                    const { hash } = await feeFixer.setPoolFeeRecipient(poolAddress as Address, treasuryAddress);
                    poolTxs.push(hash);
                } catch (e) {
                    console.error(`Failed to set fee recipient for pool ${poolAddress}:`, e);
                }
            }
            
            setResult({ 
                status: 'success', 
                message: `Fee recipients set successfully! Factory TX: ${formatAddress(factoryTx.hash)}${poolTxs.length > 0 ? `, Pools: ${poolTxs.map(formatAddress).join(', ')}` : ''}` 
            });
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

    const handleResetCircuitBreaker = async () => {
        if (!isConnected) return;
        setIsResetting(true);
        setResult(null);
        try {
            const { hash } = await feeFixer.resetWethCircuitBreaker();
            setResult({ status: 'success', message: `WETH circuit breaker reset successfully! TX: ${formatAddress(hash)}` });
        } catch (error: any) {
            console.error('Reset error:', error);
            setResult({ status: 'error', message: error.shortMessage || error.message });
        } finally {
            setIsResetting(false);
        }
    }

    const FactoryStatusIndicator = () => {
        if (factoryFeeTo === 'Loading') {
            return <span className="flex items-center text-muted-foreground"><Loader2 className="mr-2 animate-spin"/> Checking...</span>
        }
        if (factoryFeeTo === 'Error' || factoryFeeTo === 'Not Connected') {
            return <span className="flex items-center text-destructive"><XCircle className="mr-2"/> {factoryFeeTo}</span>
        }
        if (factoryFeeTo === ZERO_ADDRESS) {
            return <span className="flex items-center text-yellow-500"><AlertTriangle className="mr-2"/> Not Set (Zero Address)</span>
        }
        return <span className="flex items-center text-green-500"><CheckCircle className="mr-2"/> Set: {formatAddress(factoryFeeTo)}</span>
    }

    const PoolStatusIndicator = ({ poolAddress }: { poolAddress: string }) => {
        const recipient = poolFeeRecipients[poolAddress];
        
        if (recipient === 'Loading') {
            return <span className="flex items-center text-muted-foreground"><Loader2 className="mr-2 animate-spin"/> Checking...</span>
        }
        if (recipient === 'Error') {
            return <span className="flex items-center text-destructive"><XCircle className="mr-2"/> Error</span>
        }
        if (!recipient || recipient === ZERO_ADDRESS) {
            return <span className="flex items-center text-yellow-500"><AlertTriangle className="mr-2"/> Not Set</span>
        }
        return <span className="flex items-center text-green-500"><CheckCircle className="mr-2"/> Set</span>
    }

    const allPoolsFixed = Object.values(poolFeeRecipients).every(
        recipient => recipient && recipient !== ZERO_ADDRESS && recipient !== 'Loading' && recipient !== 'Error'
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <HardHat className="text-primary"/>
                        DEX Fee Recipient Fixer
                    </CardTitle>
                    <CardDescription>
                        This tool corrects the fee recipient for both the DEX Factory and liquidity pools. This is required for liquidity pools to function correctly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Factory Status */}
                    <div className="p-4 bg-background rounded-lg border">
                        <h4 className="font-semibold mb-2">Factory Status</h4>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Current Fee Recipient:</span>
                            <FactoryStatusIndicator />
                        </div>
                    </div>
                    
                    {/* Pool Statuses */}
                    <div className="p-4 bg-background rounded-lg border">
                        <h4 className="font-semibold mb-2">Pool Statuses</h4>
                        <div className="space-y-2">
                            {POOL_ADDRESSES.map((poolAddress) => (
                                <div key={poolAddress} className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{formatAddress(poolAddress)}:</span>
                                    <PoolStatusIndicator poolAddress={poolAddress} />
                                </div>
                            ))}
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
                                onClick={fixFeeRecipients}
                                disabled={isFixing || factoryFeeTo === 'Error' || Object.values(poolFeeRecipients).includes('Error')}
                                className="w-full"
                            >
                                {isFixing ? <Loader2 className="mr-2 animate-spin"/> : <HardHat className="mr-2"/>}
                                {isFixing ? 'Setting Recipients...' : 'Set All Fee Recipients to Treasury'}
                            </Button>
                            {allPoolsFixed && factoryFeeTo !== ZERO_ADDRESS && factoryFeeTo !== 'Loading' && factoryFeeTo !== 'Error' && (
                                <p className="text-sm text-green-600">All fee recipients are properly set!</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Zap className="text-primary"/>
                        WETH Contract Tools
                    </CardTitle>
                    <CardDescription>
                        Use these tools to manage special states on the WETH contract.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {!isConnected ? (
                        <p className="text-sm text-muted-foreground text-center">Connect wallet to use tools.</p>
                     ) : (
                        <Button onClick={handleResetCircuitBreaker} disabled={isResetting} variant="destructive" className="w-full">
                            {isResetting ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2"/>}
                            Reset Circuit Breaker
                        </Button>
                     )}
                </CardContent>
            </Card>

            {result && (
                <Alert variant={result.status === 'error' ? 'destructive' : 'default'} className={result.status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-700' : ''}>
                    {result.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertTitle>{result.status === 'success' ? 'Success' : 'Error'}</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                </Alert>
            )}
        </div>
    );
};
