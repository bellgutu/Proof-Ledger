

"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCcw, ChevronsUpDown, Loader2, ShieldCheck, AlertTriangle, XCircleIcon, History } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletHeader } from '@/components/shared/wallet-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { useToast } from '@/hooks/use-toast';
import { DEX_CONTRACT_ADDRESS, DEX_ABI, getViemPublicClient } from '@/services/blockchain-service';
import { ContractStatusPanel } from '../shared/ContractStatusPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { TransactionDetailDialog } from '@/components/shared/transaction-detail-dialog';
import type { Transaction } from '@/contexts/wallet-context';
import { ScrollArea } from '../ui/scroll-area';
import { formatUnits, parseUnits } from 'viem';

type Token = 'USDT' | 'USDC';

export default function SwapPage() {
  const { walletState, walletActions } = useWallet();
  const { 
    isConnected, 
    balances, 
    decimals,
    allowances,
    transactions
  } = walletState;
  const { 
    swapTokens,
    approveToken,
    checkAllowance,
  } = walletActions;
  const { toast } = useToast();
  const publicClient = getViemPublicClient();

  const [fromToken, setFromToken] = useState<Token>('USDT');
  const [toToken, setToToken] = useState<Token>('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fromAmountNum = useMemo(() => parseFloat(fromAmount) || 0, [fromAmount]);
  const allowance = useMemo(() => allowances[fromToken] || 0, [allowances, fromToken]);
  const needsApproval = useMemo(() => {
    if (fromToken === 'ETH' || fromAmountNum <= 0) return false;
    return allowance < fromAmountNum;
  }, [allowance, fromAmountNum, fromToken]);
  
  useEffect(() => {
    if (isConnected && fromToken !== 'ETH' && fromAmountNum > 0) {
      checkAllowance(fromToken, DEX_CONTRACT_ADDRESS);
    }
  }, [isConnected, fromToken, fromAmountNum, checkAllowance]);
  
  const tokenNames: Token[] = useMemo(() => ['USDT', 'USDC'], []);

  const handleAmountChange = useCallback(async (val: string) => {
    setFromAmount(val);
    if (val === '' || parseFloat(val) <= 0 || !publicClient) {
      setToAmount('');
      return;
    }

    try {
      const fromTokenDecimals = decimals[fromToken];
      const toTokenDecimals = decimals[toToken];
      if (fromTokenDecimals === undefined || toTokenDecimals === undefined) {
        throw new Error("Token decimals not loaded");
      }

      const amountInWei = parseUnits(val, fromTokenDecimals);
      
      const [reserveA, reserveB, contractTokenA] = await Promise.all([
          publicClient.readContract({ address: DEX_CONTRACT_ADDRESS, abi: DEX_ABI, functionName: 'reserveA' }),
          publicClient.readContract({ address: DEX_CONTRACT_ADDRESS, abi: DEX_ABI, functionName: 'reserveB' }),
          publicClient.readContract({ address: DEX_CONTRACT_ADDRESS, abi: DEX_ABI, functionName: 'tokenA' }),
      ]);

      const fromIsTokenA = walletState.marketData[fromToken]?.address?.toLowerCase() === contractTokenA.toLowerCase();

      const reserveIn = fromIsTokenA ? reserveA : reserveB;
      const reserveOut = fromIsTokenA ? reserveB : reserveA;

      const amountOutWei = await publicClient.readContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: 'getAmountOut',
        args: [amountInWei, reserveIn, reserveOut]
      });

      setToAmount(formatUnits(amountOutWei, toTokenDecimals));

    } catch (e) {
      console.error("Failed to get swap estimate:", e);
      setToAmount('0');
    }
  }, [publicClient, fromToken, toToken, decimals, walletState.marketData]);

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
    setSwapError(null);
    if (!fromToken || fromAmountNum <= 0) return;
    
    setIsApproving(true);
    try {
        await approveToken(fromToken, fromAmountNum, DEX_CONTRACT_ADDRESS);
        await checkAllowance(fromToken, DEX_CONTRACT_ADDRESS);
        toast({ title: "Approval Successful", description: `You can now swap your ${fromToken}.` });
    } catch(e: any) {
        setSwapError(e.message || "An unknown error occurred during approval.");
        console.error("Approve failed:", e);
    } finally {
        setIsApproving(false);
    }
  };
  
  const handleSwap = async () => {
    setSwapError(null);
    if (!fromToken || !toToken || fromAmountNum <= 0 || fromAmountNum > (balances[fromToken] || 0)) {
        toast({ variant: "destructive", title: "Invalid Swap", description: "Check your balance or input amount." });
        return;
    }
    
    setIsProcessing(true);
    try {
      await swapTokens(fromToken, toToken, fromAmountNum);
      
      setFromAmount('');
      setToAmount('');
      toast({ title: "Swap Submitted!", description: `Your transaction is being processed.`});
    } catch(e: any) {
        setSwapError(e.message || "An unknown error occurred during the swap.");
        console.error("Swap failed:", e);
    } finally {
      setIsProcessing(false);
    }
  };

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
  }, [fromToken, toToken, fromAmount, handleAmountChange]);


  const handleTxClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Completed</Badge>;
      case 'Pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'Failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const swapTransactions = useMemo(() => {
    return transactions.filter(tx => tx.type === 'Swap').sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);


  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      <ContractStatusPanel />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">Token Swap</CardTitle>
                    <CardDescription>Swap between USDT and USDC on the Sepolia testnet.</CardDescription>
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
                        <label htmlFor="to-token" className="block text-sm font-medium text-muted-foreground mb-1">To (estimated)</label>
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

                    {swapError ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 space-y-2 text-sm text-red-400">
                        <div className="flex items-center gap-2 font-medium">
                        <XCircleIcon className="h-5 w-5" /> Error
                        </div>
                        <p>{swapError}</p>
                    </div>
                    ) : (
                        <div className="mt-4 flex flex-col gap-2">
                            {needsApproval ? (
                                <Button onClick={handleApprove} disabled={isApproving || !isConnected || !fromAmountNum} className="w-full">
                                    {isApproving ? <><Loader2 size={16} className="mr-2 animate-spin" />Approving...</> : <><ShieldCheck size={16} className="mr-2" />Approve {fromToken}</>}
                                </Button>
                            ) : (
                                <Button onClick={handleSwap} disabled={!isConnected || isProcessing || !fromAmountNum || fromToken === toToken} className="w-full">
                                    {isProcessing ? <><Loader2 size={16} className="mr-2 animate-spin" />Swapping...</> : <><RefreshCcw size={16} className="mr-2" />Swap Tokens</>}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <History size={24} className="text-primary"/>
                        Swap History
                    </CardTitle>
                    <CardDescription>A log of your recent swap activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {swapTransactions.length > 0 ? (
                                swapTransactions.map((tx) => (
                                <TableRow key={tx.id} onClick={() => handleTxClick(tx)} className="cursor-pointer">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{tx.details}</span>
                                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(tx.timestamp, { addSuffix: true })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{getStatusBadge(tx.status)}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">
                                    No swaps yet.
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
      {selectedTx && (
        <TransactionDetailDialog 
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          transaction={selectedTx}
        />
      )}
    </div>
  );
};
