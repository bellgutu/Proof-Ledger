
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { RefreshCcw, TrendingUp, TrendingDown, Loader2, ShieldCheck } from 'lucide-react';
import { parseUnits } from 'viem';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletHeader } from '@/components/shared/wallet-header';
import TradingViewWidget from '@/components/trading/tradingview-widget';
import { OrderBook } from '@/components/trading/order-book';
import { WhaleWatch } from '@/components/trading/whale-watch';
import { Skeleton } from '../ui/skeleton';
import { getActivePosition } from '@/services/blockchain-service';
import { approveCollateralAction, openPositionAction, closePositionAction } from '@/app/actions/trade';
import { useToast } from '@/hooks/use-toast';
import type { Position } from '@/services/blockchain-service';
import { Label } from '../ui/label';

const TradingPageContent = () => {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, marketData, walletAddress } = walletState;
  const { updateBalance } = walletActions;
  const { toast } = useToast();

  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [tradeAmount, setTradeAmount] = useState(''); // This is now 'size' of the asset in string format
  const [collateralAmount, setCollateralAmount] = useState(''); // Collateral in USDT
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [activePosition, setActivePosition] = useState<Position | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  
  const [currentPrice, setCurrentPrice] = useState(marketData['ETH']?.price || 0);

  const usdtBalance = balances['USDT'] || 0;
  
  const asset = selectedPair.split('/')[0];
  const tradingViewSymbol = `BINANCE:${asset}USDT`;
  
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
    const interval = setInterval(fetchPosition, 5000); // Poll for updates every 5s
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
    setTradeAmount('');
  };

  const handleApprove = async () => {
    const collateralNum = parseFloat(collateralAmount);
    if (isNaN(collateralNum) || collateralNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid collateral amount' });
        return;
    };
     if (collateralNum > usdtBalance) {
      toast({ variant: 'destructive', title: 'Insufficient Collateral', description: `You need at least ${collateralNum.toFixed(2)} USDT for this trade.` });
      return;
    }
    
    setIsApproving(true);
    try {
       const collateralBigInt = parseUnits(collateralAmount, 18);
       toast({title: "Approval Required", description: `Approving the contract to spend ${collateralAmount} USDT.`});
       await approveCollateralAction(collateralBigInt);
       toast({title: "Approval Successful!", description: "You can now place trades using this collateral."});
    } catch(e: any) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Approval Failed', description: errorMessage });
    } finally {
        setIsApproving(false);
    }
  };


  const handlePlaceTrade = async () => {
    if (!walletAddress) {
        toast({ variant: 'destructive', title: 'Wallet Error', description: 'Wallet address not found.' });
        return;
    }
    const collateralNum = parseFloat(collateralAmount);
    const sizeNum = parseFloat(tradeAmount);

    if (isNaN(sizeNum) || sizeNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid trade size' });
        return;
    };
    if (isNaN(collateralNum) || collateralNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid collateral amount' });
        return;
    };
    if (collateralNum > usdtBalance) {
      toast({ variant: 'destructive', title: 'Insufficient Collateral', description: `You need at least ${collateralNum.toFixed(2)} USDT for this trade.` });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Approval should be done separately now. This assumes user has approved enough.
      const collateralBigInt = parseUnits(collateralAmount, 18);
      const sizeBigInt = parseUnits(tradeAmount, 18);
      
      toast({title: "Opening Position", description: "Please confirm transaction..."});

      await openPositionAction({
          side: tradeDirection === 'long' ? 0 : 1,
          size: sizeBigInt,
          collateral: collateralBigInt
      });

      toast({ title: 'Position Opened', description: `Your ${tradeDirection} position for ${selectedPair} is now active.`});
      
      updateBalance('USDT', -collateralNum);

      setTradeAmount('');
      setCollateralAmount('');
      await fetchPosition();

    } catch(e: any) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Trade Failed', description: `Please ensure you have approved enough collateral. ${errorMessage}` });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCloseTrade = async () => {
    if (!walletAddress || !activePosition) {
        toast({ variant: 'destructive', title: 'Wallet Error', description: 'Wallet address or active position not found.' });
        return;
    }
    setIsProcessing(true);
    try {
        await closePositionAction();
        toast({ title: 'Position Closed', description: `Your trade has been settled.` });
        
        setActivePosition(null); 
        await fetchPosition(); 
    } catch(e: any) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Failed to Close', description: errorMessage });
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
  
  const tradeablePairs = ['ETH/USDT', 'WETH/USDC', 'BNB/USDT', 'SOL/USDT', 'LINK/USDT'];
  const initialPriceForChart = marketData[selectedPair.split('/')[0]]?.price;
  
  if (!initialPriceForChart) {
    return null; // or a loading skeleton
  }

  return (
    <>
    <WalletHeader />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                    {pos.side.toUpperCase()} {pos.size.toLocaleString('en-US', {maximumFractionDigits: 4})} {asset}
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
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Trade {asset}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trade-amount">Trade Size ({asset})</Label>
              <Input
                id="trade-amount"
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                disabled={!isConnected || !!activePosition}
                placeholder="0.0"
                className="mt-1"
              />
            </div>
             <div>
              <Label htmlFor="collateral-amount">Collateral (USDT)</Label>
              <Input
                id="collateral-amount"
                type="number"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                disabled={!isConnected || !!activePosition}
                placeholder="0.0"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Balance: {usdtBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => setTradeDirection('long')} className={`w-full ${tradeDirection === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-secondary hover:bg-green-600/50'}`} disabled={!isConnected || !!activePosition}><TrendingUp size={16} className="mr-2" /> Long</Button>
              <Button onClick={() => setTradeDirection('short')} className={`w-full ${tradeDirection === 'short' ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary hover:bg-red-600/50'}`} disabled={!isConnected || !!activePosition}><TrendingDown size={16} className="mr-2" /> Short</Button>
            </div>

            <div className="flex space-x-2">
                <Button onClick={handleApprove} disabled={!isConnected || isApproving || !collateralAmount || !!activePosition} className="w-full" variant="outline">
                  {isApproving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  Approve
                </Button>
                <Button onClick={handlePlaceTrade} disabled={!isConnected || isProcessing || !tradeAmount || !collateralAmount || !!activePosition} className="w-full">
                  {isProcessing ? <Loader2 className="animate-spin" /> : 'Place Trade'}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Note: Approve collateral amount before placing your trade.</p>
          </CardContent>
        </Card>

        <WhaleWatch key={`whale-watch-${selectedPair}`} pair={selectedPair} />
        
        <OrderBook currentPrice={currentPrice} assetSymbol={asset} />
      </div>
    </div>
    </>
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

    