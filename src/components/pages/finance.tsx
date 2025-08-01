
"use client";

import React, { useState, useMemo } from 'react';
import { RefreshCcw, ArrowDown, History, ChevronsUpDown } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletHeader } from '@/components/shared/wallet-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';

interface Transaction {
  id: string;
  type: 'Swap' | 'Stake';
  details: string;
  status: 'Completed' | 'Pending';
}

type Token = 'ETH' | 'USDC' | 'USDT' | 'BNB' | 'XRP';

const tokenNames: Token[] = ['ETH', 'USDC', 'USDT', 'BNB', 'XRP'];

const exchangeRates: { [key in Token]: number } = {
    ETH: 3500,
    USDC: 1,
    USDT: 1,
    BNB: 600,
    XRP: 0.5,
};

export default function FinancePage() {
  const { walletState, walletActions } = useWallet();
  const { isConnected } = walletState;
  const { setEthBalance, setUsdcBalance, setBnbBalance, setUsdtBalance, setXrpBalance } = walletActions;

  const [stakedAmount, setStakedAmount] = useState(0);
  const [stakingLoading, setStakingLoading] = useState(false);
  const [fromToken, setFromToken] = useState<Token>('ETH');
  const [toToken, setToToken] = useState<Token>('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const balances: { [key in Token]: number } = {
    ETH: walletState.ethBalance,
    USDC: walletState.usdcBalance,
    USDT: walletState.usdtBalance,
    BNB: walletState.bnbBalance,
    XRP: walletState.xrpBalance,
  };

  const balanceSetters: { [key in Token]: (updater: React.SetStateAction<number>) => void } = {
    ETH: setEthBalance,
    USDC: setUsdcBalance,
    USDT: setUsdtBalance,
    BNB: setBnbBalance,
    XRP: setXrpBalance,
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ id: new Date().toISOString(), ...transaction }, ...prev]);
  };

  const conversionRate = useMemo(() => {
    if (!fromToken || !toToken) return 1;
    return exchangeRates[fromToken] / exchangeRates[toToken];
  }, [fromToken, toToken]);

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
    // Also swap amounts if they exist
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };
  
  const handleSwap = () => {
    const amountToSwap = parseFloat(fromAmount);
    if (!fromToken || !toToken || amountToSwap <= 0 || amountToSwap > balances[fromToken]) return;
    
    setSwapping(true);
    addTransaction({
        type: 'Swap',
        details: `Swapping ${amountToSwap.toFixed(4)} ${fromToken} for ${toToken}...`,
        status: 'Pending'
    });

    setTimeout(() => {
      const amountReceived = parseFloat(toAmount);
      balanceSetters[fromToken](prev => parseFloat((prev - amountToSwap).toFixed(4)));
      balanceSetters[toToken](prev => parseFloat((prev + amountReceived).toFixed(4)));
      
      addTransaction({
        type: 'Swap',
        details: `Swapped ${amountToSwap.toFixed(4)} ${fromToken} for ${amountReceived.toFixed(2)} ${toToken}`,
        status: 'Completed'
      });
      setFromAmount('');
      setToAmount('');
      setSwapping(false);
    }, 1500);
  };

  const handleStake = () => {
    const amountToStake = 0.5;
    if (walletState.ethBalance < amountToStake) {
      console.log('Not enough ETH to stake!');
      return;
    }
    setStakingLoading(true);
    addTransaction({
        type: 'Stake',
        details: 'Staking 0.5 ETH...',
        status: 'Pending'
    });
    setTimeout(() => {
      setEthBalance(prev => parseFloat((prev - amountToStake).toFixed(4)));
      setStakedAmount(prev => parseFloat((prev + amountToStake).toFixed(4)));
      addTransaction({
        type: 'Stake',
        details: 'Staked 0.5 ETH',
        status: 'Completed'
      });
      setStakingLoading(false);
    }, 2000);
  };

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
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Token Swap</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
                <div className="p-4 bg-background rounded-md border space-y-2">
                  <div className="flex justify-between items-center">
                     <label htmlFor="from-token" className="block text-sm font-medium text-muted-foreground mb-1">From</label>
                     <p className="text-xs text-muted-foreground mt-1">Balance: {balances[fromToken].toFixed(4)}</p>
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
                    <p className="text-xs text-muted-foreground mt-1">Balance: {balances[toToken].toFixed(4)}</p>
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
                <CardTitle className="text-2xl font-bold text-primary">Staking Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-background rounded-md border">
                <p className="text-sm text-muted-foreground">Your Staked Assets:</p>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-foreground">{stakedAmount.toFixed(4)} ETH</span>
                    <span className="text-green-400 font-semibold">12% APY (Simulated)</span>
                </div>
                </div>
                <div>
                <label htmlFor="stake-amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount to Stake (ETH)</label>
                <Input
                    id="stake-amount"
                    type="number"
                    value={0.5}
                    readOnly
                    disabled={!isConnected}
                />
                </div>
                <Button
                onClick={handleStake}
                disabled={!isConnected || stakingLoading || walletState.ethBalance < 0.5}
                className="w-full bg-green-600 text-white hover:bg-green-700"
                >
                {stakingLoading ? (
                    <span className="flex items-center">
                    <RefreshCcw size={16} className="mr-2 animate-spin" /> Staking...
                    </span>
                ) : (
                    'Stake 0.5 ETH'
                )}
                </Button>
            </CardContent>
            </Card>
        </div>
        <Card className="transform transition-transform duration-300 hover:scale-[1.01] lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-primary"><History className="mr-2" /> Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    {transactions.length > 0 ? (
                        <div className="space-y-4 pr-4">
                            {transactions.map(tx => (
                                <div key={tx.id} className="p-3 bg-background rounded-md border">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-sm">{tx.type}</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tx.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs mt-1">{tx.details}</p>
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
