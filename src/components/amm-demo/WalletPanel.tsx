
"use client";
import React from 'react';
import Image from 'next/image';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useSwitchChain } from 'wagmi';
import { Wallet, CheckCircle, XCircle, RefreshCw, Loader2, LogOut } from 'lucide-react';
import { getTokenLogo, MOCK_TOKENS } from '@/lib/tokenLogos';

export function WalletPanel() {
    const { state, actions } = useAmmDemo();
    const { isConnected, address, ethBalance, tokenBalances, gasPrice, networkStats, isProcessing } = state;
    const { chain } = useAccount();
    const { switchChain } = useSwitchChain();
    
    const isSepolia = chain?.id === 11155111;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Wallet />Wallet & Network</CardTitle>
                <CardDescription>Connect to Sepolia testnet and manage your mock tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isConnected ? (
                    <Button onClick={actions.connectWallet} className="w-full">Connect Wallet</Button>
                ) : (
                    <div className="p-3 bg-background rounded-lg border space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Status</span>
                             <div className="flex items-center gap-2">
                                <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} />Connected</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={actions.disconnectWallet}>
                                    <LogOut size={14} />
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Address</span>
                            <span className="font-mono text-xs">{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Network</span>
                            {isSepolia ? (
                                <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} />{chain?.name || 'Sepolia'}</span>
                            ) : (
                                <Button size="sm" variant="destructive" onClick={() => switchChain?.({ chainId: 11155111 })}>
                                    <XCircle size={16} className="mr-2"/>
                                    Switch to Sepolia
                                </Button>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">ETH Balance</span>
                            <span className="font-mono">{ethBalance} ETH</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Gas Price</span>
                            <span className="font-mono">{gasPrice} Gwei</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Block Number</span>
                            <span className="font-mono">#{networkStats.blockNumber.toLocaleString()}</span>
                        </div>
                    </div>
                )}
                 {isConnected && isSepolia && (
                    <div className="space-y-3 pt-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Token Balances</h4>
                            <Button size="sm" variant="outline" onClick={actions.refreshData} disabled={isProcessing('refresh')}>
                                {isProcessing('refresh') ? <Loader2 size={14} className="mr-1 animate-spin"/> : <RefreshCw size={14} className="mr-1" />} Refresh
                            </Button>
                        </div>
                        <div className="space-y-2">
                           {(Object.keys(MOCK_TOKENS) as (keyof typeof MOCK_TOKENS)[]).map(symbol => (
                               <div key={symbol} className="flex justify-between items-center p-2 bg-background rounded-md border">
                                   <div className="flex items-center gap-3">
                                       <Image src={getTokenLogo(symbol)} alt={symbol} width={24} height={24} />
                                       <span className="font-bold">{symbol}</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                        <span className="font-mono">{parseFloat(tokenBalances[symbol]).toLocaleString(undefined, { maximumFractionDigits: MOCK_TOKENS[symbol].decimals > 6 ? 4 : MOCK_TOKENS[symbol].decimals })}</span>
                                        <Button size="sm" variant="outline" onClick={() => actions.getFaucetTokens(symbol)} disabled={isProcessing(`Faucet_${symbol}`)}>
                                            {isProcessing(`Faucet_${symbol}`) ? <Loader2 size={14} className="animate-spin"/> : "Faucet"}
                                        </Button>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
