
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCcw, ArrowDown, History, ChevronsUpDown, BrainCircuit, ArrowUp, Handshake, Vote, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { getRebalanceAction, type RebalanceAction } from '@/ai/flows/rebalance-narrator-flow';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletHeader } from '@/components/shared/wallet-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';

export interface Transaction {
  id: string;
  type: 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote';
  details: string | React.ReactNode;
  status: 'Completed' | 'Pending';
}

export interface VaultStrategy {
    name: string;
    value: number;
    asset: 'WETH' | 'USDC';
    apy: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  userVote?: 'for' | 'against';
}


type Token = 'ETH' | 'USDC' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'WETH' | 'LINK';

const tokenNames: Token[] = ['ETH', 'USDC', 'USDT', 'BNB', 'XRP', 'SOL', 'WETH', 'LINK'];

export default function FinancePage() {
  const { walletState, walletActions } = useWallet();
  const { 
    isConnected, 
    balances, 
    marketData,
    transactions,
    vaultWeth,
    vaultUsdc,
    activeStrategy,
    proposals
  } = walletState;
  const { 
    updateBalance,
    addTransaction,
    setVaultWeth,
    setVaultUsdc,
    setActiveStrategy,
    setProposals
  } = walletActions;
  const { toast } = useToast();

  const [vaultLoading, setVaultLoading] = useState(false);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);

  const [fromToken, setFromToken] = useState<Token>('ETH');
  const [toToken, setToToken] = useState<Token>('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  
  const exchangeRates = useMemo(() => {
    return Object.keys(marketData).reduce((acc, key) => {
        acc[key as Token] = marketData[key].price;
        return acc;
    }, {} as Record<Token, number>);
  }, [marketData]);

  const conversionRate = useMemo(() => {
    if (!fromToken || !toToken || !exchangeRates[fromToken] || !exchangeRates[toToken]) return 1;
    return exchangeRates[fromToken] / exchangeRates[toToken];
  }, [fromToken, toToken, exchangeRates]);
  
  const vaultTotalUsd = useMemo(() => {
    const wethValue = vaultWeth * (exchangeRates.WETH || 0);
    const usdcValue = vaultUsdc * (exchangeRates.USDC || 0);
    let strategyValue = 0;
    if (activeStrategy) {
      const assetPrice = activeStrategy.asset === 'WETH' ? exchangeRates.WETH : exchangeRates.USDC;
      strategyValue = activeStrategy.value * (assetPrice || 0);
    }
    return wethValue + usdcValue + strategyValue;
  }, [vaultWeth, vaultUsdc, activeStrategy, exchangeRates]);

  const handleAmountChange = (val: string) => {
    if (val === '' || parseFloat(val) < 0) {
      setFromAmount('');
      setToAmount('');
      return;
    }
    const numVal = parseFloat(val);
    setFromAmount(val);
    setToAmount((numVal * conversionRate).toFixed(4));
  };

  const handleSwapTokens = () => {
    if (fromToken === toToken) return;
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };
  
  const handleSwap = () => {
    const amountToSwap = parseFloat(fromAmount);
    if (!fromToken || !toToken || amountToSwap <= 0 || amountToSwap > (balances[fromToken] || 0)) {
        toast({ variant: "destructive", title: "Invalid Swap", description: "Check your balance or input amount." });
        return;
    }
    
    setSwapping(true);
    setTimeout(() => {
      const amountReceived = parseFloat(toAmount);
      updateBalance(fromToken, -amountToSwap);
      updateBalance(toToken, amountReceived);
      
      addTransaction({
        type: 'Swap',
        details: `Swapped ${amountToSwap.toLocaleString('en-US', {maximumFractionDigits: 4})} ${fromToken} for ${amountReceived.toLocaleString('en-US', {maximumFractionDigits: 2})} ${toToken}`
      });
      setFromAmount('');
      setToAmount('');
      setSwapping(false);
    }, 1500);
  };
  
  const handleVote = (proposalId: string, vote: 'for' | 'against') => {
    setProposals(prev => prev.map(p => {
        if (p.id === proposalId && !p.userVote) {
            const simulatedVotingPower = (Math.random() * 50000) + 10000;
            return {
                ...p,
                userVote: vote,
                votesFor: p.votesFor + (vote === 'for' ? simulatedVotingPower : 0),
                votesAgainst: p.votesAgainst + (vote === 'against' ? simulatedVotingPower : 0)
            };
        }
        return p;
    }));
    addTransaction({ type: 'Vote', details: `Voted ${vote} on proposal "${proposals.find(p => p.id === proposalId)?.title}"` });
  };


  const handleDepositToVault = () => {
    const amountToDeposit = 0.5;
    if ((balances['WETH'] || 0) < amountToDeposit) {
       toast({ variant: "destructive", title: "Insufficient WETH balance" });
       return;
    }
    setVaultLoading(true);
    setTimeout(() => {
      updateBalance('WETH', -amountToDeposit);
      setVaultWeth(prev => prev + amountToDeposit);
      addTransaction({
        type: 'Vault Deposit',
        details: `Deposited 0.5 WETH to AI Strategy Vault`
      });
      setVaultLoading(false);
    }, 2000);
  };

  const handleWithdrawFromVault = () => {
    if (vaultTotalUsd <= 0) return;
    setVaultLoading(true);
    setTimeout(() => {
        updateBalance('WETH', vaultWeth);
        updateBalance('USDC', vaultUsdc);

        if (activeStrategy) {
            updateBalance(activeStrategy.asset, activeStrategy.value);
        }

        setVaultWeth(0);
        setVaultUsdc(0);
        setActiveStrategy(null);

        addTransaction({
            type: 'Vault Withdraw',
            details: `Withdrew all assets from AI Strategy Vault`
        });
        setVaultLoading(false);
    }, 2000);
  }
  
  const handleAiRebalance = useCallback(async () => {
    if(rebalanceLoading) return;
    setRebalanceLoading(true);
    try {
        const currentEth = balances['ETH'] || 0;
        // Ensure there are assets to rebalance.
        if (vaultWeth <= 0 && vaultUsdc <= 0 && currentEth <= 0) {
            toast({ variant: "destructive", title: "Vault is empty", description: "Deposit WETH/USDC or hold ETH to enable AI rebalancing." });
            setRebalanceLoading(false);
            return;
        }

        const action = await getRebalanceAction({ currentEth: currentEth, currentWeth: vaultWeth, currentUsdc: vaultUsdc });
        
        let amount = action.amount;
        if (action.fromToken === 'WETH' && action.toToken === 'USDC') {
            const wethAmount = Math.min(amount, vaultWeth);
            if (wethAmount > 0) {
                setVaultWeth(prev => prev - wethAmount);
                const usdcAmount = wethAmount * exchangeRates.WETH / exchangeRates.USDC;
                setVaultUsdc(prev => prev + usdcAmount);
                setActiveStrategy({name: action.strategyName, value: usdcAmount, asset: 'USDC', apy: action.expectedApy});
                 addTransaction({
                    type: 'AI Rebalance',
                    details: (
                        <div className="text-xs space-y-1">
                            <p><strong>Strategy:</strong> {action.strategyName}</p>
                            <p><strong>Action:</strong> Swapped {wethAmount.toFixed(4)} WETH for {usdcAmount.toFixed(2)} USDC.</p>
                            <p><strong>Justification:</strong> {action.justification}</p>
                        </div>
                    )
                });
            }
        } else if (action.fromToken === 'USDC' && action.toToken === 'WETH') {
            const usdcAmount = Math.min(amount, vaultUsdc);
            if (usdcAmount > 0) {
                setVaultUsdc(prev => prev - usdcAmount);
                const wethAmount = usdcAmount * exchangeRates.USDC / exchangeRates.WETH;
                setVaultWeth(prev => prev + wethAmount);
                setActiveStrategy({name: action.strategyName, value: wethAmount, asset: 'WETH', apy: action.expectedApy});
                 addTransaction({
                    type: 'AI Rebalance',
                    details: (
                         <div className="text-xs space-y-1">
                            <p><strong>Strategy:</strong> {action.strategyName}</p>
                            <p><strong>Action:</strong> Swapped {usdcAmount.toFixed(2)} USDC for {wethAmount.toFixed(4)} WETH.</p>
                            <p><strong>Justification:</strong> {action.justification}</p>
                        </div>
                    )
                });
            }
        } else if (action.fromToken === 'ETH' && action.toToken === 'WETH') {
             const ethAmount = Math.min(currentEth, action.amount);
             if (ethAmount > 0) {
                updateBalance('ETH', -ethAmount);
                setVaultWeth(prev => prev + ethAmount);
                 addTransaction({
                    type: 'AI Rebalance',
                    details: (
                         <div className="text-xs space-y-1">
                            <p><strong>Strategy:</strong> {action.strategyName}</p>
                            <p><strong>Action:</strong> Wrapped {ethAmount.toFixed(4)} ETH to WETH and deposited to vault.</p>
                            <p><strong>Justification:</strong> {action.justification}</p>
                        </div>
                    )
                });
             }
        }

    } catch (e) {
        console.error("Failed to get rebalance detail:", e);
         toast({
            variant: "destructive",
            title: "Rebalance Error",
            description: "Could not get rebalancing strategy from AI.",
        });
    } finally {
        setRebalanceLoading(false);
    }
  }, [vaultWeth, vaultUsdc, rebalanceLoading, exchangeRates, toast, balances, updateBalance, addTransaction, setVaultWeth, setVaultUsdc, setActiveStrategy]);

  const hasVaultBalance = vaultTotalUsd > 0;

  const TokenSelectItem = ({ token }: { token: Token }) => (
    <SelectItem value={token}>
      <div className="flex items-center">
        <Image src={getTokenLogo(token)} alt={token} width={20} height={20} className="mr-2" />
        {token}
      </div>
    </SelectItem>
  );

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">Token Swap</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                    <div className="p-4 bg-background rounded-md border space-y-2">
                      <div className="flex justify-between items-center">
                         <label htmlFor="from-token" className="block text-sm font-medium text-muted-foreground mb-1">From</label>
                         <p className="text-xs text-muted-foreground mt-1">Balance: {(balances[fromToken] || 0).toLocaleString('en-US', {maximumFractionDigits: 4})}</p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                            id="from-token"
                            type="number"
                            value={fromAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            disabled={!isConnected}
                            placeholder="0.0"
                        />
                         <Select value={fromToken} onValueChange={(v) => setFromToken(v as Token)}>
                            <SelectTrigger className="w-[150px]">
                               <SelectValue placeholder="Select Token" />
                            </SelectTrigger>
                            <SelectContent>
                              {tokenNames.map(t => <TokenSelectItem key={t} token={t} />)}
                            </SelectContent>
                          </Select>
                      </div>
                    </div>

                    <div className="flex justify-center my-2">
                      <Button variant="ghost" size="icon" onClick={handleSwapTokens} disabled={!isConnected}>
                        <ChevronsUpDown size={20} className="text-muted-foreground" />
                      </Button>
                    </div>

                    <div className="p-4 bg-background rounded-md border space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="to-token" className="block text-sm font-medium text-muted-foreground mb-1">To</label>
                        <p className="text-xs text-muted-foreground mt-1">Balance: {(balances[toToken] || 0).toLocaleString('en-US', {maximumFractionDigits: 4})}</p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                            id="to-token"
                            type="number"
                            value={toAmount}
                            readOnly
                            disabled={!isConnected}
                            placeholder="0.0"
                        />
                        <Select value={toToken} onValueChange={(v) => setToToken(v as Token)}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Token" />
                          </SelectTrigger>
                          <SelectContent>
                            {tokenNames.map(t => <TokenSelectItem key={t} token={t} />)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                    onClick={handleSwap}
                    disabled={!isConnected || swapping || !fromAmount || parseFloat(fromAmount) <= 0 || fromToken === toToken}
                    className="w-full mt-6"
                    variant="default"
                    >
                    {swapping ? (
                        <span className="flex items-center">
                        <RefreshCcw size={16} className="mr-2 animate-spin" /> Swapping...
                        </span>
                    ) : (
                        'Swap Tokens'
                    )}
                    </Button>
                </CardContent>
                </Card>

                <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
                        <div className="flex items-center">
                          <BrainCircuit className="mr-2" /> AI Strategy Vault
                        </div>
                        <Button onClick={handleAiRebalance} disabled={rebalanceLoading || vaultLoading} size="icon" variant="ghost">
                          {rebalanceLoading ? <RefreshCcw className="animate-spin"/> :<BrainCircuit />}
                          <span className="sr-only">Rebalance Vault</span>
                        </Button>
                      </CardTitle>
                       <CardDescription>Deposit WETH or USDC and let the AI manage your funds.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-background rounded-md border">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Total Vault Value:</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">${vaultTotalUsd.toLocaleString('en-US', {maximumFractionDigits: 2})}</p>
                             <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                {activeStrategy ? (
                                    <div className="p-3 bg-primary/10 rounded-md">
                                        <p className="font-bold text-primary">{activeStrategy.name}</p>
                                        <div className="flex justify-between items-center">
                                            <span>{activeStrategy.value.toLocaleString('en-US', {maximumFractionDigits: 4})} {activeStrategy.asset}</span>
                                            <span className="text-green-400 font-semibold">{activeStrategy.apy}% APY</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-xs py-2">No active strategy. Click the AI button to deploy funds.</p>
                                )}
                                <p className="text-sm font-bold pt-2">Idle Assets:</p>
                                <div className="flex justify-between"><span>WETH:</span> <span className="font-mono">{vaultWeth.toLocaleString('en-US', {maximumFractionDigits: 4})}</span></div>
                                <div className="flex justify-between"><span>USDC:</span> <span className="font-mono">{vaultUsdc.toLocaleString('en-US', {maximumFractionDigits: 4})}</span></div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={handleDepositToVault}
                              disabled={!isConnected || vaultLoading || (balances['WETH'] || 0) <= 0}
                              className="w-full bg-green-600 text-white hover:bg-green-700"
                            >
                              {vaultLoading ? (
                                  <span className="flex items-center">
                                  <RefreshCcw size={16} className="mr-2 animate-spin" /> Working...
                                  </span>
                              ) : (
                                  <span className="flex items-center"><ArrowDown size={16} className="mr-2" />Deposit WETH</span>
                              )}
                            </Button>
                             <Button
                              onClick={handleWithdrawFromVault}
                              disabled={!isConnected || vaultLoading || !hasVaultBalance}
                              className="w-full"
                              variant="destructive"
                            >
                              {vaultLoading ? (
                                  <span className="flex items-center">
                                  <RefreshCcw size={16} className="mr-2 animate-spin" /> Working...
                                  </span>
                              ) : (
                                  <span className="flex items-center"><ArrowUp size={16} className="mr-2" />Withdraw All</span>
                              )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary flex items-center">
                        <Vote className="mr-3" /> Governance
                    </CardTitle>
                    <CardDescription>Use your token power to vote on protocol proposals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {proposals.map(p => {
                        const totalVotes = p.votesFor + p.votesAgainst;
                        const forPercentage = totalVotes > 0 ? (p.votesFor / totalVotes) * 100 : 0;
                        const againstPercentage = totalVotes > 0 ? (p.votesAgainst / totalVotes) * 100 : 0;
                        
                        return (
                            <div key={p.id} className="p-4 border rounded-lg bg-background">
                                <h4 className="font-semibold text-foreground">{p.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1 mb-3">{p.description}</p>
                                <Progress value={forPercentage} className="h-2" />
                                <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                                    <span className="text-green-400">For: {forPercentage.toFixed(1)}%</span>
                                    <span className="text-red-400">Against: {againstPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button 
                                        onClick={() => handleVote(p.id, 'for')}
                                        disabled={!!p.userVote}
                                        variant={p.userVote === 'for' ? 'default' : 'outline'}
                                        className="w-full"
                                    >
                                        <CheckCircle className="mr-2" /> Vote For
                                    </Button>
                                    <Button 
                                        onClick={() => handleVote(p.id, 'against')}
                                        disabled={!!p.userVote}
                                         variant={p.userVote === 'against' ? 'destructive' : 'outline'}
                                        className="w-full"
                                    >
                                        <XCircle className="mr-2" /> Vote Against
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
        <Card className="transform transition-transform duration-300 hover:scale-[1.01] lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-primary"><History className="mr-2" /> Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[40rem]">
                    {transactions.length > 0 ? (
                        <div className="space-y-4 pr-4">
                            {transactions.map(tx => (
                                <div key={tx.id} className="p-3 bg-background rounded-md border">
                                    <div className="flex justify-between items-center">
                                        <span className={`font-semibold text-sm ${tx.type === 'AI Rebalance' ? 'text-primary' : ''}`}>{tx.type}</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tx.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground text-xs mt-1">{tx.details}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center text-sm py-16">No transactions yet.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
