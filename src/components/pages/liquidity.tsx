
"use client";

import React, { useState, useMemo } from 'react';
import { Loader2, Handshake, Vote, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletHeader } from '@/components/shared/wallet-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import { Alert } from '../ui/alert';

interface Transaction {
  id: string;
  type: 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote';
  details: string | React.ReactNode;
  status: 'Completed' | 'Pending';
}

type Pool = 'ETH/USDT' | 'ETH/USDC' | 'SOL/USDT' | 'SOL/USDC';

export default function LiquidityPage() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, ethBalance, usdcBalance, usdtBalance, solBalance } = walletState;
  const { setEthBalance, setUsdcBalance, setUsdtBalance, setSolBalance } = walletActions;
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isLiquidityLoading, setIsLiquidityLoading] = useState(false);
  const [lpTokens, setLpTokens] = useState(0);
  const [selectedPool, setSelectedPool] = useState<Pool>('ETH/USDT');

  const [proposal, setProposal] = useState({
      title: 'Upgrade Protocol v2.0',
      description: 'This proposal suggests a major protocol upgrade to improve efficiency and reduce gas fees by 30%.',
      votesYes: 520,
      votesNo: 280,
      hasVoted: false,
    });
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'status'>) => {
    setTransactions(prev => [{ id: new Date().toISOString(), status: 'Completed', ...transaction }, ...prev]);
  };

  const liquidityAmounts: {[key in Pool]: { amount1: number, asset1: string, amount2: number, asset2: string}} = {
      'ETH/USDT': { amount1: 0.5, asset1: 'ETH', amount2: 1750, asset2: 'USDT' },
      'ETH/USDC': { amount1: 0.5, asset1: 'ETH', amount2: 1750, asset2: 'USDC' },
      'SOL/USDT': { amount1: 5, asset1: 'SOL', amount2: 750, asset2: 'USDT' },
      'SOL/USDC': { amount1: 5, asset1: 'SOL', amount2: 750, asset2: 'USDC' },
    }

    const hasSufficientBalance = () => {
      if (!isConnected) return false;
      const {amount1, asset1, amount2, asset2} = liquidityAmounts[selectedPool];
      const balance1 = asset1 === 'ETH' ? ethBalance : solBalance;
      const balance2 = asset2 === 'USDT' ? usdtBalance : usdcBalance;
      return balance1 >= amount1 && balance2 >= amount2;
    }

    const handleAddLiquidity = () => {
      if (!hasSufficientBalance()) {
        toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: "You don't have enough funds to add to this liquidity pool.",
        });
        return;
      }
      setIsLiquidityLoading(true);
      const { amount1, asset1, amount2, asset2 } = liquidityAmounts[selectedPool];

      setTimeout(() => {
        if(asset1 === 'ETH') setEthBalance(prev => parseFloat((prev - amount1).toFixed(4)));
        if(asset1 === 'SOL') setSolBalance(prev => parseFloat((prev - amount1).toFixed(4)));
        
        if(asset2 === 'USDT') setUsdtBalance(prev => parseFloat((prev - amount2).toFixed(4)));
        if(asset2 === 'USDC') setUsdcBalance(prev => parseFloat((prev - amount2).toFixed(4)));

        setLpTokens(prev => prev + 100);
        addTransaction({ type: 'Add Liquidity', details: `Added ${amount1.toLocaleString('en-US', {maximumFractionDigits: 4})} ${asset1} and ${amount2.toLocaleString('en-US', {maximumFractionDigits: 4})} ${asset2}` });
        setIsLiquidityLoading(false);
      }, 2000);
    };

    const handleRemoveLiquidity = () => {
        if (lpTokens <= 0) return;
        setIsLiquidityLoading(true);
        const { amount1, asset1, amount2, asset2 } = liquidityAmounts[selectedPool];

        setTimeout(() => {
            if(asset1 === 'ETH') setEthBalance(prev => parseFloat((prev + amount1).toFixed(4)));
            if(asset1 === 'SOL') setSolBalance(prev => parseFloat((prev + amount1).toFixed(4)));
            
            if(asset2 === 'USDT') setUsdtBalance(prev => parseFloat((prev + amount2).toFixed(4)));
            if(asset2 === 'USDC') setUsdcBalance(prev => parseFloat((prev + amount2).toFixed(4)));

            setLpTokens(0);
            addTransaction({ type: 'Remove Liquidity', details: `Removed ${amount1.toLocaleString('en-US', {maximumFractionDigits: 4})} ${asset1} and ${amount2.toLocaleString('en-US', {maximumFractionDigits: 4})} ${asset2}` });
            setIsLiquidityLoading(false);
        }, 2000);
    }

    const handleVote = (voteType: 'yes' | 'no') => {
      if (!isConnected || proposal.hasVoted) return;
      setProposal(prev => ({
        ...prev,
        votesYes: voteType === 'yes' ? prev.votesYes + 1 : prev.votesYes,
        votesNo: voteType === 'no' ? prev.votesNo + 1 : prev.votesNo,
        hasVoted: true,
      }));
       addTransaction({ type: 'Vote', details: `Voted ${voteType} on proposal '${proposal.title}'` });
    };

    const totalVotes = proposal.votesYes + proposal.votesNo;
    const yesPercentage = totalVotes > 0 ? ((proposal.votesYes / totalVotes) * 100) : 0;
    
    const {amount1, asset1, amount2, asset2} = liquidityAmounts[selectedPool];

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-primary"><Handshake size={24} className="mr-2"/> Liquidity Pool</CardTitle>
            <CardDescription>Provide liquidity to earn trading fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-md border space-y-4">
                <div>
                <p className="text-sm text-muted-foreground">Your LP Tokens:</p>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-foreground">{lpTokens.toLocaleString('en-US', {maximumFractionDigits: 2})} LP</span>
                    <span className="text-green-400 font-semibold">0.3% Trading Fees</span>
                </div>
                </div>
                <div>
                <label htmlFor="pool-select" className="block text-sm font-medium text-muted-foreground mb-1">Select Pool</label>
                <Select value={selectedPool} onValueChange={(v) => setSelectedPool(v as Pool)}>
                    <SelectTrigger id="pool-select" className="w-full">
                        <SelectValue placeholder="Select Pool" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                        <SelectItem value="ETH/USDC">ETH/USDC</SelectItem>
                        <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                        <SelectItem value="SOL/USDC">SOL/USDC</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button
                    onClick={handleAddLiquidity}
                    disabled={!isConnected || isLiquidityLoading || !hasSufficientBalance()}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                    {isLiquidityLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    `Add ${amount1.toLocaleString('en-US', {maximumFractionDigits: 4})} ${asset1} + ${amount2.toLocaleString('en-US', {maximumFractionDigits: 0})} ${asset2}`
                    )}
                </Button>
                <Button
                    onClick={handleRemoveLiquidity}
                    disabled={!isConnected || isLiquidityLoading || lpTokens <= 0}
                    className="w-full"
                    variant="destructive"
                >
                    {isLiquidityLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    `Remove Liquidity`
                    )}
                </Button>
            </div>
                {!isConnected && <Alert variant="destructive"><CardDescription className="text-center">Please connect your wallet to manage liquidity.</CardDescription></Alert>}
                {isConnected && !hasSufficientBalance() && lpTokens <= 0 && <Alert variant="destructive"><CardDescription className="text-center">Insufficient balance to add liquidity to this pool.</CardDescription></Alert>}
            </CardContent>
        </Card>
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-primary"><Vote size={24} className="mr-2"/> Governance</CardTitle>
            <CardDescription>Participate in the future of the protocol.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-md border space-y-4">
                <h3 className="text-lg font-bold text-foreground">{proposal.title}</h3>
                <p className="text-sm text-muted-foreground">{proposal.description}</p>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="flex items-center text-green-400 font-medium"><CheckCircle size={16} className="mr-2"/>Yes</span>
                            <span className="text-muted-foreground">{proposal.votesYes.toLocaleString('en-US')} ({yesPercentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={yesPercentage} className="h-2 [&>div]:bg-green-500" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="flex items-center text-red-400 font-medium"><XCircle size={16} className="mr-2"/>No</span>
                            <span className="text-muted-foreground">{proposal.votesNo.toLocaleString('en-US')} ({(100-yesPercentage).toFixed(1)}%)</span>
                        </div>
                        <Progress value={100-yesPercentage} className="h-2 [&>div]:bg-red-500" />
                    </div>
                </div>
                {!proposal.hasVoted ? (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-2">
                        <Button onClick={() => handleVote('yes')} disabled={!isConnected} className="w-full bg-green-600 hover:bg-green-700 text-white">Vote Yes</Button>
                        <Button onClick={() => handleVote('no')} disabled={!isConnected} className="w-full bg-red-600 hover:bg-red-700 text-white">Vote No</Button>
                    </div>
                ) : (
                <p className="text-center text-sm text-primary pt-2">Thank you for your vote!</p>
                )}
                {!isConnected && <Alert variant="destructive"><CardDescription className="text-center">Please connect your wallet to vote.</CardDescription></Alert>}
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
