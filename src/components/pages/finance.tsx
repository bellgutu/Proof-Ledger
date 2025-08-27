
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCcw, ArrowDown, History, ChevronsUpDown, BrainCircuit, ArrowUp, Handshake, Vote, CheckCircle, XCircle, Loader2, Send, ShieldCheck } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { ERC20_CONTRACTS } from '@/services/blockchain-service';

export interface VaultStrategy {
    name: string;
    value: number;
    asset: 'WETH';
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


type Token = 'ETH' | keyof typeof ERC20_CONTRACTS;

const tokenNames: Token[] = ['ETH', ...Object.keys(ERC20_CONTRACTS) as Array<keyof typeof ERC20_CONTRACTS>];


export default function FinancePage() {
  const { walletState, walletActions } = useWallet();
  const { 
    isConnected, 
    balances, 
    marketData,
    vaultWeth,
    activeStrategy,
    proposals,
    allowances
  } = walletState;
  const { 
    updateBalance,
    addTransaction,
    setVaultWeth,
    setActiveStrategy,
    setProposals,
    swapTokens,
    depositToVault,
    withdrawFromVault,
    voteOnProposal,
    approveToken,
    checkAllowance
  } = walletActions;
  const { toast } = useToast();
  const router = useRouter();

  const [vaultLoading, setVaultLoading] = useState(false);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);

  const [fromToken, setFromToken] = useState<Token>('USDT');
  const [toToken, setToToken] = useState<Token>('WETH');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const fromAmountNum = useMemo(() => parseFloat(fromAmount) || 0, [fromAmount]);
  const allowance = useMemo(() => allowances[fromToken] || 0, [allowances, fromToken]);
  const needsApproval = useMemo(() => {
    if (fromToken === 'ETH' || fromAmountNum <= 0) return false;
    return allowance < fromAmountNum;
  }, [allowance, fromAmountNum, fromToken]);
  
  useEffect(() => {
    if (isConnected && fromToken !== 'ETH') {
      checkAllowance(fromToken);
    }
  }, [isConnected, fromToken, fromAmountNum, checkAllowance]);
  
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
    let strategyValue = 0;
    if (activeStrategy) {
      const assetPrice = activeStrategy.asset === 'WETH' ? exchangeRates.WETH : 0;
      strategyValue = activeStrategy.value * (assetPrice || 0);
    }
    return wethValue + strategyValue;
  }, [vaultWeth, activeStrategy, exchangeRates]);

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
  
  const handleApprove = async () => {
    const amountToApprove = parseFloat(fromAmount);
    if (!fromToken || fromToken === 'ETH' || isNaN(amountToApprove) || amountToApprove <= 0) return;
    setIsApproving(true);
    try {
      await approveToken(fromToken, amountToApprove);
      toast({ title: "Approval Submitted!", description: "Your transaction is processing."});
    } catch(e) {
      // Error handled by context
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    const amountToSwap = parseFloat(fromAmount);
    if (!fromToken || !toToken || isNaN(amountToSwap) || amountToSwap <= 0 || amountToSwap > (balances[fromToken] || 0)) {
        toast({ variant: "destructive", title: "Invalid Swap", description: "Check your balance or input amount." });
        return;
    }
    
    setIsSwapping(true);
    try {
      await swapTokens(fromToken, toToken, amountToSwap);
      
      setFromAmount('');
      setToAmount('');
      toast({ title: "Swap Submitted!", description: `Your transaction is being processed.`});
    } catch(e: any) {
        // Error is handled by the wallet context dialog
    } finally {
      setIsSwapping(false);
    }
  };
  
  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    const support = vote === 'for' ? 1 : 0;
    try {
      await voteOnProposal(proposalId, support);
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, userVote: vote } : p));
      toast({ title: "Vote Cast!", description: `Your vote for proposal #${proposalId} has been submitted.`});
    } catch (e: any) {
      // error handled by context
    }
  };


  const handleDepositToVault = async () => {
    const amountToDeposit = 0.5;
    if ((balances['WETH'] || 0) < amountToDeposit) {
       toast({ variant: "destructive", title: "Insufficient WETH balance" });
       return;
    }
    setVaultLoading(true);
    try {
      await depositToVault(amountToDeposit);
      setVaultWeth(prev => prev + amountToDeposit); // Optimistic update
      toast({ title: "Deposit Submitted", description: `Depositing ${amountToDeposit} WETH to vault.`});
    } catch (e) {
      // error handled by context
    } finally {
        setVaultLoading(false);
    }
  };

  const handleWithdrawFromVault = async () => {
    if (vaultWeth <= 0) return;
    setVaultLoading(true);
    try {
      await withdrawFromVault(vaultWeth);
      setVaultWeth(0); // Optimistic update
      setActiveStrategy(null);
      toast({ title: "Withdraw Submitted", description: `Withdrawing all assets from vault.`});
    } catch(e) {
       // error handled by context
    } finally {
      setVaultLoading(false);
    }
  }
  
  const handleAiRebalance = useCallback(async () => {
    if(rebalanceLoading) return;
    setRebalanceLoading(true);
    try {
        const currentEth = balances['ETH'] || 0;
        if (vaultWeth <= 0 && currentEth <= 0) {
            toast({ variant: "destructive", title: "Vault is empty", description: "Deposit WETH or hold ETH to enable AI rebalancing." });
            setRebalanceLoading(false);
            return;
        }

        const action = await getRebalanceAction({ currentEth: currentEth, currentWeth: vaultWeth });
        
        if (!action) {
          throw new Error("AI failed to provide a rebalancing action.");
        }

        // This remains a simulation for now, as it's a complex multi-step process
        if (action.fromToken === 'WETH' && action.toToken === 'WETH') {
            const wethAmount = Math.min(action.amount, vaultWeth);
            if (wethAmount > 0) {
                setVaultWeth(prev => prev - wethAmount);
                setActiveStrategy({name: action.strategyName, value: wethAmount, asset: 'WETH', apy: action.expectedApy});
                 addTransaction({
                    type: 'AI Rebalance',
                    details: (
                        <div className="text-xs space-y-1">
                            <p><strong>Strategy:</strong> {action.strategyName}</p>
                            <p><strong>Action:</strong> Deployed {wethAmount.toFixed(4)} WETH.</p>
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

    } catch (e: any) {
        console.error("Failed to get rebalance detail:", e);
         toast({
            variant: "destructive",
            title: "Rebalance Error",
            description: e.message || "Could not get rebalancing strategy from AI.",
        });
    } finally {
        setRebalanceLoading(false);
    }
  }, [vaultWeth, rebalanceLoading, toast, balances, updateBalance, addTransaction, setVaultWeth, setActiveStrategy]);

  const hasVaultBalance = vaultTotalUsd > 0;

  const TokenSelectItem = ({ token }: { token: Token }) => (
    <SelectItem value={token}>
      <div className="flex items-center">
        <Image src={getTokenLogo(token)} alt={token} width={20} height={20} className="mr-2" />
        {token}
      </div>
    </SelectItem>
  );
  
  useEffect(() => {
    handleAmountChange(fromAmount);
  }, [fromToken, toToken, conversionRate, fromAmount]);

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-2xl font-bold text-primary">Token Swap</CardTitle>
                <Button variant="outline" onClick={() => router.push('/portfolio/history')}>
                  <History className="mr-2"/>
                  History
                </Button>
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
                <div className="flex gap-2 mt-4">
                  {needsApproval ? (
                    <Button onClick={handleApprove} disabled={isApproving || !isConnected} className="w-full">
                      {isApproving ? <Loader2 className="animate-spin mr-2"/> : <ShieldCheck className="mr-2"/>}
                      Approve {fromToken}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSwap}
                      disabled={!isConnected || isSwapping || !fromAmount || parseFloat(fromAmount) <= 0 || fromToken === toToken}
                      className="w-full"
                      variant="default"
                    >
                      {isSwapping ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCcw size={16} className="mr-2" />}
                       Swap Tokens
                    </Button>
                  )}
                </div>
            </CardContent>
            </Card>

            <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
                    <div className="flex items-center">
                        <BrainCircuit className="mr-2" /> AI Strategy Vault
                    </div>
                    <Button onClick={handleAiRebalance} disabled={rebalanceLoading || vaultLoading} size="icon" variant="ghost">
                        {rebalanceLoading ? <Loader2 className="animate-spin"/> :<BrainCircuit />}
                        <span className="sr-only">Rebalance Vault</span>
                    </Button>
                    </CardTitle>
                    <CardDescription>Deposit WETH and let the AI manage your funds.</CardDescription>
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
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={handleDepositToVault}
                            disabled={!isConnected || vaultLoading || (balances['WETH'] || 0) < 0.5}
                            className="w-full bg-green-600 text-white hover:bg-green-700"
                        >
                            {vaultLoading ? (
                                <span className="flex items-center">
                                <RefreshCcw size={16} className="mr-2 animate-spin" /> Working...
                                </span>
                            ) : (
                                <span className="flex items-center"><ArrowDown size={16} className="mr-2" />Deposit 0.5 WETH</span>
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
                    <Vote className="mr-2" /> Governance
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
  );
};
