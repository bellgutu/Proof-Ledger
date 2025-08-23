
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { RefreshCcw, TrendingUp, TrendingDown, Loader2, ShieldCheck, Copy, Info, PlusCircle, MinusCircle, PiggyBank } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletHeader } from '@/components/shared/wallet-header';
import TradingViewWidget from '@/components/trading/tradingview-widget';
import { OrderBook } from '@/components/trading/order-book';
import { WhaleWatch } from '@/components/trading/whale-watch';
import { Skeleton } from '../ui/skeleton';
import { getActivePosition, getVaultCollateral } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';
import type { Position } from '@/services/blockchain-service';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';


const TradingPageContent = () => {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, marketData, walletAddress, vaultCollateral } = walletState;
  const { depositCollateral, withdrawCollateral, openPosition, closePosition } = walletActions;
  const { toast } = useToast();

  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [tradeSize, setTradeSize] = useState('');
  const [tradeCollateral, setTradeCollateral] = useState('');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const [activePosition, setActivePosition] = useState<Position | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  
  const [currentPrice, setCurrentPrice] = useState(marketData['ETH']?.price || 0);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const usdtBalance = balances['USDT'] || 0;
  
  const asset = selectedPair.split('/[0]');
  const tradingViewSymbol = `BINANCE:${selectedPair.split('/')[0]}USDT`;
  

  useEffect(() => {
    const pairAsset = selectedPair.split('/')[0];
    if (marketData[pairAsset]) {
      setCurrentPrice(marketData[pairAsset].price);
    }
    const interval = setInterval(() => {
         if (marketData[pairAsset]) {
            setCurrentPrice(marketData[pairAsset].price);
         }
    }, 2000);
    return () => clearInterval(interval);

  }, [marketData, selectedPair]);


  const fetchPosition = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    setIsLoadingPosition(true);
    try {
      const position = await getActivePosition(walletAddress);
      setActivePosition(position);
    } catch (e) {
      console.error("Failed to fetch active position:", e);
    }
    setIsLoadingPosition(false);
  }, [isConnected, walletAddress]);

  useEffect(() => {
    fetchPosition();
    const interval = setInterval(() => {
      fetchPosition();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPosition]);

  const handlePairChange = (pair: string) => {
    if(activePosition) {
      toast({ title: "Action blocked", description: "Close your active position before changing pairs."});
      return;
    }
    setSelectedPair(pair);
    const pairAsset = pair.split('/')[0];
    if (marketData[pairAsset]) {
        setCurrentPrice(marketData[pairAsset].price);
    }
    setTradeSize('');
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if(isNaN(amount) || amount <= 0) {
        toast({variant: 'destructive', title: 'Invalid amount'});
        return;
    }
    if(amount > usdtBalance) {
        toast({variant: 'destructive', title: 'Insufficient USDT balance'});
        return;
    }
    setIsDepositing(true);
    try {
        await depositCollateral(depositAmount);
        setDepositAmount('');
    } catch(e) {
        // error handled by context
    } finally {
        setIsDepositing(false);
    }
  }
  
  const handleWithdraw = async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
          toast({ variant: 'destructive', title: 'Invalid amount' });
          return;
      }
      if (amount > vaultCollateral.available) {
          toast({ variant: 'destructive', title: 'Insufficient available collateral' });
          return;
      }
      setIsWithdrawing(true);
      try {
          await withdrawCollateral(withdrawAmount);
          setWithdrawAmount('');
      } catch (e) {
          // error handled by context
      } finally {
          setIsWithdrawing(false);
      }
  }


  const handlePlaceTradeReview = () => {
    const collateralNum = parseFloat(tradeCollateral);
    const sizeNum = parseFloat(tradeSize);

    if (isNaN(sizeNum) || sizeNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid trade size' });
        return;
    };
    if (isNaN(collateralNum) || collateralNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid collateral amount' });
        return;
    };
    if (collateralNum > vaultCollateral.available) {
      toast({ variant: 'destructive', title: 'Insufficient Available Collateral', description: `You need to have at least ${collateralNum.toFixed(2)} USDT deposited in the vault and available.` });
      return;
    }
    
    const positionValue = sizeNum * currentPrice;
    const maxLeverage = 10;
    if (positionValue > collateralNum * maxLeverage) {
        toast({ variant: 'destructive', title: 'Leverage Too High', description: `Your collateral is too low for this position size. Max leverage is ${maxLeverage}x.`});
        return;
    }

    setIsConfirmOpen(true);
  };
  
  const executeTrade = async () => {
    if (!walletAddress) return;

    setIsConfirmOpen(false);
    setIsProcessing(true);

    try {
      await openPosition({
          side: tradeDirection === 'long' ? 0 : 1,
          size: tradeSize.toString(),
          collateral: tradeCollateral.toString()
      });
      
      setTradeSize('');
      setTradeCollateral('');
      await fetchPosition();

    } catch(e: any) {
        // Error is handled by the wallet context dialog
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCloseTrade = async () => {
    if (!walletAddress || !activePosition) return;
    setIsProcessing(true);
    try {
        await closePosition();
        setActivePosition(null); 
        await fetchPosition(); 
    } catch(e: any) {
        // Error is handled by the wallet context dialog
    } finally {
        setIsProcessing(false);
    }
  };

  const calculatePnl = (position: Position) => {
    if (!position.active) return 0;
    
    const priceDifference = currentPrice - position.entryPrice;
    let pnl = position.size * priceDifference;
    
    if (position.side === 'short') {
      pnl = -pnl;
    }
    
    return pnl;
  };

  const leverage = useMemo(() => {
    const sizeNum = parseFloat(tradeSize);
    const collateralNum = parseFloat(tradeCollateral);
    if (!sizeNum || !collateralNum || !currentPrice) return 0;
    const positionValue = sizeNum * currentPrice;
    return positionValue / collateralNum;
  }, [tradeSize, tradeCollateral, currentPrice]);
  
  const tradeablePairs = ['ETH/USDT', 'WETH/USDC', 'BNB/USDT', 'SOL/USDT', 'LINK/USDT'];
  const initialPriceForChart = marketData[selectedPair.split('/')[0]]?.price;
  
  if (!initialPriceForChart) {
    return null;
  }

  return (
    <TooltipProvider>
    <WalletHeader />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      <div className="lg:col-span-2 space-y-8">
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
              <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-foreground">Futures</h2>
                  <Select value={selectedPair} onValueChange={handlePairChange} disabled={!!activePosition}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Pair" />
                      </SelectTrigger>
                      <SelectContent>
                          {tradeablePairs.map(pair => (
                              <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
            <span className="text-3xl font-bold text-foreground">${currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</span>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-card rounded-md">
                <TradingViewWidget symbol={tradingViewSymbol} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Active Position</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingPosition ? (
                    <Skeleton className="h-24 w-full"/>
                ) : activePosition ? (
                    <div className="space-y-4">
                    {(pos => {
                        const pnl = calculatePnl(pos);
                        const positionValue = pos.size * currentPrice;
                        const leverage = pos.collateral > 0 ? positionValue / pos.collateral : 0;
                        return (
                            <div key={pos.entryPrice} className="p-4 bg-background rounded-md border">
                                <div className="flex flex-wrap items-center justify-between mt-1 gap-4">
                                <span className={`text-lg font-bold ${pos.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                    {pos.side.toUpperCase()} {pos.size.toLocaleString('en-US', {maximumFractionDigits: 4})} {selectedPair.split('/')[0]}
                                </span>
                                <div className="flex items-center gap-4">
                                  <span className="text-foreground font-semibold">Entry: ${pos.entryPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</span>
                                  <span className="text-foreground font-semibold">Leverage: {leverage.toFixed(2)}x</span>
                                </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                  <div><span className="text-muted-foreground">Collateral: </span><span className="font-mono">${pos.collateral.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                  <div className="text-right"><span className="text-muted-foreground">Value: </span><span className="font-mono">${positionValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                </div>
                                <div className="mt-2 text-2xl font-bold">
                                P&L: <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    ${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                                </div>
                                <Button onClick={handleCloseTrade} className="w-full mt-4" variant="destructive" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin"/> : 'Close Position'}
                                </Button>
                            </div>
                        );
                    })(activePosition)}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No active position.</p>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary"><PiggyBank/> Collateral Vault</CardTitle>
                <CardDescription>Deposit USDT here to use as collateral for trades.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-lg bg-background border mb-4 text-center space-y-1">
                    <Label className="text-muted-foreground">Available to Trade</Label>
                    <p className="text-2xl font-bold">${vaultCollateral.available.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total: ${vaultCollateral.total.toLocaleString()} | Locked: ${vaultCollateral.locked.toLocaleString()}</p>
                </div>
                <Tabs defaultValue="deposit">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="deposit"><PlusCircle/> Deposit</TabsTrigger>
                        <TabsTrigger value="withdraw"><MinusCircle/> Withdraw</TabsTrigger>
                    </TabsList>
                    <TabsContent value="deposit" className="pt-4 space-y-2">
                        <Label htmlFor="deposit-amount">Amount to Deposit (USDT)</Label>
                        <Input id="deposit-amount" type="number" placeholder="0.0" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                        <p className="text-xs text-muted-foreground text-right">Wallet Balance: {usdtBalance.toLocaleString()}</p>
                        <Button onClick={handleDeposit} disabled={isDepositing} className="w-full">
                           {isDepositing ? <Loader2 className="animate-spin" /> : "Deposit Collateral"}
                        </Button>
                    </TabsContent>
                    <TabsContent value="withdraw" className="pt-4 space-y-2">
                        <Label htmlFor="withdraw-amount">Amount to Withdraw (USDT)</Label>
                        <Input id="withdraw-amount" type="number" placeholder="0.0" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                        <p className="text-xs text-muted-foreground text-right">Available in Vault: {vaultCollateral.available.toLocaleString()}</p>
                        <Button onClick={handleWithdraw} disabled={isWithdrawing} variant="destructive" className="w-full">
                           {isWithdrawing ? <Loader2 className="animate-spin" /> : "Withdraw Collateral"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Open Position</CardTitle>
             <CardDescription>Use your deposited collateral to open a leveraged position.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trade-amount">Trade Size ({selectedPair.split('/')[0]})</Label>
              <Input
                id="trade-amount"
                type="number"
                value={tradeSize}
                onChange={(e) => setTradeSize(e.target.value)}
                disabled={!isConnected || !!activePosition}
                placeholder="0.0"
                className="mt-1"
              />
            </div>
             <div>
              <Label htmlFor="collateral-amount">Collateral to Lock (USDT)</Label>
              <Input
                id="collateral-amount"
                type="number"
                value={tradeCollateral}
                onChange={(e) => setTradeCollateral(e.target.value)}
                disabled={!isConnected || !!activePosition}
                placeholder="0.0"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Available in Vault: {vaultCollateral.available.toLocaleString()}</p>
            </div>
            
            <div className="p-2 bg-muted/50 rounded-md text-sm text-center font-semibold">
                Leverage: <span className={leverage > 10 ? "text-destructive" : "text-primary"}>{leverage.toFixed(2)}x</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground cursor-help"/>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Max leverage is 10x.</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => setTradeDirection('long')} className={`w-full ${tradeDirection === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-secondary hover:bg-green-600/50'}`} disabled={!isConnected || !!activePosition}><TrendingUp size={16} className="mr-2" /> Long</Button>
              <Button onClick={() => setTradeDirection('short')} className={`w-full ${tradeDirection === 'short' ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary hover:bg-red-600/50'}`} disabled={!isConnected || !!activePosition}><TrendingDown size={16} className="mr-2" /> Short</Button>
            </div>

            <Button onClick={handlePlaceTradeReview} disabled={!isConnected || isProcessing || !!activePosition} className="w-full">
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Open Position'}
            </Button>
          </CardContent>
        </Card>

        <WhaleWatch key={`whale-watch-${selectedPair}`} pair={selectedPair} />
        
        <OrderBook currentPrice={currentPrice} assetSymbol={selectedPair.split('/')[0]} />
      </div>
    </div>
    
     <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the details of your trade before submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Action:</span>
              <span className={`font-bold ${tradeDirection === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                {tradeDirection.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pair:</span>
              <span className="font-bold">{selectedPair}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-mono">{tradeSize} {selectedPair.split('/')[0]}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Collateral to Lock:</span>
              <span className="font-mono">{tradeCollateral} USDT</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Leverage:</span>
              <span className="font-mono">{leverage.toFixed(2)}x</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-mono">${currentPrice.toLocaleString()}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeTrade} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Open Position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}


export default function TradingPage() {
  const { walletState } = useWallet();
  const { isMarketDataLoaded } = walletState;

  if (!isMarketDataLoaded) {
    return (
      <div className="container mx-auto p-0 space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-[30rem] w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
      </div>
    )
  }

  return <TradingPageContent />;
}
