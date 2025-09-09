

"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCcw, ArrowDown, History, ChevronsUpDown, BrainCircuit, ArrowUp, Handshake, Vote, CheckCircle, XCircle, Loader2, Send, ShieldCheck, AlertTriangle, XCircleIcon } from 'lucide-react';
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
import { ERC20_CONTRACTS, DEX_CONTRACT_ADDRESS } from '@/services/blockchain-service';
import { isValidAddress } from '@/lib/utils';
import { ContractStatusPanel } from '../shared/ContractStatusPanel';

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

export default function FinancePage() {
  const { walletState, walletActions } = useWallet();
  const { 
    isConnected, 
    balances, 
    marketData,
    vaultWeth,
    activeStrategy,
    proposals
  } = walletState;
  const { 
    updateBalance,
    addTransaction,
    setVaultWeth,
    setActiveStrategy,
    setProposals,
    depositToVault,
    withdrawFromVault,
    voteOnProposal
  } = walletActions;
  const { toast } = useToast();

  const [vaultLoading, setVaultLoading] = useState(false);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);

  const exchangeRates = useMemo(() => {
    return Object.keys(marketData).reduce((acc, key) => {
        acc[key as keyof typeof marketData] = marketData[key].price;
        return acc;
    }, {} as Record<keyof typeof marketData, number>);
  }, [marketData]);

  const vaultTotalUsd = useMemo(() => {
    const wethValue = vaultWeth * (exchangeRates.WETH || 0);
    let strategyValue = 0;
    if (activeStrategy) {
      const assetPrice = activeStrategy.asset === 'WETH' ? exchangeRates.WETH : 0;
      strategyValue = activeStrategy.value * (assetPrice || 0);
    }
    return wethValue + strategyValue;
  }, [vaultWeth, activeStrategy, exchangeRates]);

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

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <ContractStatusPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
    </div>
  );
};
