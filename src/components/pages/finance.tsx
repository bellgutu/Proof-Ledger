
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
import { Alert } from '../ui/alert';

interface Transaction {
  id: string;
  type: 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote';
  details: string | React.ReactNode;
  status: 'Completed' | 'Pending';
}

interface VaultStrategy {
    name: string;
    value: number;
    asset: 'WETH' | 'USDC';
    apy: number;
}

type Token = 'ETH' | 'USDC' | 'USDT' | 'BNB' | 'XRP' | 'SOL';

const tokenNames: Token[] = ['ETH', 'USDC', 'USDT', 'BNB', 'XRP', 'SOL'];

export default function FinancePage() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, ethBalance, usdcBalance, bnbBalance, usdtBalance, xrpBalance, wethBalance, solBalance, marketData } = walletState;
  const { setEthBalance, setUsdcBalance, setWethBalance, setSolBalance } = walletActions;
  const { toast } = useToast();

  const [vaultWeth, setVaultWeth] = useState(0);
  const [vaultUsdc, setVaultUsdc] = useState(0);
  const [activeStrategy, setActiveStrategy] = useState<VaultStrategy | null>(null);


  const [vaultLoading, setVaultLoading] = useState(false);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);

  const [fromToken, setFromToken] = useState<Token>('ETH');
  const [toToken, setToToken] = useState<Token>('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const balances: { [key in Token]: number } = {
    ETH: ethBalance,
    USDC: usdcBalance,
    USDT: usdtBalance,
    BNB: bnbBalance,
    XRP: xrpBalance,
    SOL: solBalance,
  };

  const balanceSetters: { [key in Token]: (updater: React.SetStateAction<number>) => void } = {
    ETH: walletActions.setEthBalance,
    USDC: walletActions.setUsdcBalance,
    USDT: walletActions.setUsdtBalance,
    BNB: walletActions.setBnbBalance,
    XRP: walletActions.setXrpBalance,
    SOL: walletActions.setSolBalance,
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'status'>) => {
    setTransactions(prev => [{ id: new Date().toISOString(), status: 'Completed', ...transaction }, ...prev]);
  };

  const exchangeRates = useMemo(() => {
    return {
      ETH: marketData.ETH.price,
      USDC: marketData.USDC.price,
      USDT: marketData.USDT.price,
      BNB: marketData.BNB.price,
      XRP: marketData.XRP.price,
      WETH: marketData.WETH.price,
      SOL: marketData.SOL.price,
    };
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
    if (!fromToken || !toToken || amountToSwap <= 0 || amountToSwap > balances[fromToken]) return;
    
    setSwapping(true);
    setTimeout(() => {
      const amountReceived = parseFloat(toAmount);
      balanceSetters[fromToken](prev => parseFloat((prev - amountToSwap).toFixed(4)));
      balanceSetters[toToken](prev => parseFloat((prev + amountReceived).toFixed(4)));
      addTransaction({
        type: 'Swap',
        details: `Swapped ${amountToSwap.toLocaleString('en-US', {maximumFractionDigits: 4})} ${fromToken} for ${amountReceived.toLocaleString('en-US', {maximumFractionDigits: 2})} ${toToken}`
      });
      setFromAmount('');
      setToAmount('');
      setSwapping(false);
    }, 1500);
  };

  const handleDepositToVault = () => {
    const amountToDeposit = 0.5;
    if (walletState.ethBalance < amountToDeposit) {
      return;
    }
    setVaultLoading(true);
    setTimeout(() => {
      setEthBalance(prev => parseFloat((prev - amountToDeposit).toFixed(4)));
      setWethBalance(prev => parseFloat((prev + amountToDeposit).toFixed(4)));
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
        setWethBalance(prev => parseFloat((prev + vaultWeth).toFixed(4)));
        setUsdcBalance(prev => parseFloat((prev + vaultUsdc).toFixed(4)));
        if (activeStrategy) {
            if (activeStrategy.asset === 'WETH') {
                setWethBalance(prev => parseFloat((prev + activeStrategy.value).toFixed(4)));
            } else {
                 setUsdcBalance(prev => parseFloat((prev + activeStrategy.value).toFixed(4)));
            }
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
        const action = await getRebalanceAction({ currentEth: 0, currentWeth: vaultWeth, currentUsdc: vaultUsdc });
        
        let amount = action.amount;
        if (action.fromToken === 'WETH' && action.toToken === 'USDC') {
            const wethAmount = Math.min(amount, vaultWeth);
            setVaultWeth(prev => prev - wethAmount);
            const usdcAmount = wethAmount * exchangeRates.WETH / exchangeRates.USDC;
            setVaultUsdc(prev => prev + usdcAmount);
            setActiveStrategy({name: action.strategyName, value: usdcAmount, asset: 'USDC', apy: action.expectedApy});
        } else if (action.fromToken === 'USDC' && action.toToken === 'WETH') {
            const usdcAmount = Math.min(amount, vaultUsdc);
            setVaultUsdc(prev => prev - usdcAmount);
            const wethAmount = usdcAmount * exchangeRates.USDC / exchangeRates.WETH;
            setVaultWeth(prev => prev + wethAmount);
            setActiveStrategy({name: action.strategyName, value: wethAmount, asset: 'WETH', apy: action.expectedApy});
        }
        
        addTransaction({
            type: 'AI Rebalance',
            details: (
                <div className="text-xs space-y-1">
                    <p><strong>Strategy:</strong> {action.strategyName}</p>
                    <p><strong>Justification:</strong> {action.justification}</p>
                    <p><strong>Risk Analysis:</strong> {action.riskAnalysis}</p>
                    <p><strong>Expected APY:</strong> {action.expectedApy}%</p>
                </div>
            )
        });

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
  }, [vaultWeth, vaultUsdc, rebalanceLoading, exchangeRates.WETH, exchangeRates.USDC, toast]);

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
                     <p className="text-xs text-muted-foreground mt-1">Balance: {balances[fromToken].toLocaleString('en-US', {maximumFractionDigits: 4})}</p>
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
                    <p className="text-xs text-muted-foreground mt-1">Balance: {balances[toToken].toLocaleString('en-US', {maximumFractionDigits: 4})}</p>
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
                    <Button onClick={handleAiRebalance} disabled={rebalanceLoading || !hasVaultBalance} size="icon" variant="ghost">
                      {rebalanceLoading ? <RefreshCcw className="animate-spin"/> :<BrainCircuit />}
                      <span className="sr-only">Rebalance Vault</span>
                    </Button>
                  </CardTitle>
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
                                <p className="text-center text-xs">No active strategy. Click the AI button to deploy funds.</p>
                            )}
                            <p className="text-sm font-bold pt-2">Idle Assets:</p>
                            <div className="flex justify-between"><span>WETH:</span> <span className="font-mono">{vaultWeth.toLocaleString('en-US', {maximumFractionDigits: 4})}</span></div>
                            <div className="flex justify-between"><span>USDC:</span> <span className="font-mono">{vaultUsdc.toLocaleString('en-US', {maximumFractionDigits: 4})}</span></div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleDepositToVault}
                          disabled={!isConnected || vaultLoading || walletState.ethBalance < 0.5}
                          className="w-full bg-green-600 text-white hover:bg-green-700"
                        >
                          {vaultLoading ? (
                              <span className="flex items-center">
                              <RefreshCcw size={16} className="mr-2 animate-spin" /> Working...
                              </span>
                          ) : (
                              <span className="flex items-center"><ArrowDown size={16} className="mr-2" />Deposit 0.5 ETH</span>
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
                        <p className="text-muted-foreground text-center text-sm">No transactions yet.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
