
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { RefreshCcw, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletHeader } from '@/components/shared/wallet-header';
import { TradingChart, type Candle } from '@/components/trading/trading-chart';
import { OrderBook } from '@/components/trading/order-book';
import { WhaleWatch } from '@/components/trading/whale-watch';
import { Skeleton } from '../ui/skeleton';
import { getActivePositions, openPosition, closePosition, type Position } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';

const TradingPageContent = () => {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, marketData, walletAddress } = walletState;
  const { updateBalance } = walletActions;
  const { toast } = useToast();

  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  
  const [currentPrice, setCurrentPrice] = useState(marketData['ETH']?.price || 0);
  const [candleData, setCandleData] = useState<Candle[]>([]);

  const usdtBalance = balances['USDT'] || 0;

  const handleCandleDataUpdate = useCallback((candles: Candle[]) => {
    setCandleData(candles);
  }, []);
  
  const asset = selectedPair.split('/')[0];
  
  useEffect(() => {
    const pairAsset = selectedPair.split('/')[0];
    if (marketData[pairAsset]) {
      setCurrentPrice(marketData[pairAsset].price);
    }
  }, [marketData, selectedPair]);

  const fetchPositions = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    setIsLoadingPositions(true);
    try {
      const positions = await getActivePositions(walletAddress);
      setActivePositions(positions);
    } catch (e) {
      console.error("Failed to fetch active positions:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch trading positions.' });
    }
    setIsLoadingPositions(false);
  }, [isConnected, walletAddress, toast]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handlePairChange = (pair: string) => {
    if(activePositions.length > 0) {
      toast({ title: "Action blocked", description: "Close all active positions before changing pairs."});
      return;
    }
    setSelectedPair(pair);
    const pairAsset = pair.split('/')[0];
    if (marketData[pairAsset]) {
        setCurrentPrice(marketData[pairAsset].price);
    }
    setTradeAmount('');
  };

  const handlePlaceTrade = async () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0 || amount > usdtBalance) {
        toast({ variant: 'destructive', title: 'Invalid amount' });
        return;
    };
    
    setIsProcessing(true);
    try {
      await openPosition({
          pair: selectedPair,
          collateral: amount,
          direction: tradeDirection,
          leverage,
      });
      updateBalance('USDT', -amount);
      toast({ title: 'Position Opened', description: `Your ${tradeDirection} position for ${selectedPair} is now active.`});
      setTradeAmount('');
      fetchPositions(); // Refresh positions
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Trade Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCloseTrade = async (positionId: number) => {
    setIsProcessing(true);
    try {
        const result = await closePosition(positionId);
        updateBalance('USDT', result.payout);
        toast({
            title: 'Position Closed',
            description: `PnL: $${result.pnl.toFixed(2)}. You received ${result.payout.toFixed(2)} USDT.`
        });
        fetchPositions();
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Failed to Close', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const calculatePnl = (position: Position) => {
      const entryPrice = position.entryPrice;
      if (position.direction === 'long') {
          return ((currentPrice - entryPrice) / entryPrice) * position.collateral * position.leverage;
      } else {
          return ((entryPrice - currentPrice) / entryPrice) * position.collateral * position.leverage;
      }
  };
  
  const tradeablePairs = ['ETH/USDT', 'BTC/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
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
                  <Select value={selectedPair} onValueChange={handlePairChange} disabled={activePositions.length > 0}>
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
              <TradingChart 
                  key={selectedPair} 
                  initialPrice={initialPriceForChart} 
                  onPriceChange={setCurrentPrice} 
                  onCandleDataUpdate={handleCandleDataUpdate}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingPositions ? (
                    <Skeleton className="h-24 w-full"/>
                ) : activePositions.length > 0 ? (
                    <div className="space-y-4">
                    {activePositions.map(pos => {
                        const pnl = calculatePnl(pos);
                        return (
                            <div key={pos.id} className="p-4 bg-background rounded-md border">
                                <div className="flex flex-wrap items-center justify-between mt-1 gap-2">
                                <span className={`text-lg font-bold ${pos.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                    {pos.direction.toUpperCase()} ${pos.collateral.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                                <span className="text-foreground font-semibold">{pos.pair}</span>
                                <span className="text-foreground font-semibold">Entry: ${pos.entryPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</span>
                                <span className="text-foreground font-semibold">Leverage: {pos.leverage}x</span>
                                </div>
                                <div className="mt-2 text-2xl font-bold">
                                P&L: <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    ${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                                </div>
                                <Button onClick={() => handleCloseTrade(pos.id)} className="w-full mt-4" variant="destructive" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin"/> : 'Close Position'}
                                </Button>
                            </div>
                        );
                    })}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No active positions.</p>
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
              <label htmlFor="trade-amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount (USDT)</label>
              <Input
                id="trade-amount"
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                disabled={!isConnected}
                placeholder="0.0"
              />
              <p className="text-xs text-muted-foreground mt-1">Balance: {usdtBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT</p>
            </div>
            <div>
              <label htmlFor="leverage-select" className="block text-sm font-medium text-muted-foreground mb-1">Leverage</label>
              <Select
                value={String(leverage)}
                onValueChange={(val) => setLeverage(parseInt(val))}
                disabled={!isConnected}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 5, 10, 20, 50].map(l => <SelectItem key={l} value={String(l)}>{l}x</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setTradeDirection('long')} className={`w-full ${tradeDirection === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-secondary hover:bg-green-600/50'}`} disabled={!isConnected}><TrendingUp size={16} className="mr-2" /> Long</Button>
              <Button onClick={() => setTradeDirection('short')} className={`w-full ${tradeDirection === 'short' ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary hover:bg-red-600/50'}`} disabled={!isConnected}><TrendingDown size={16} className="mr-2" /> Short</Button>
            </div>
            <Button onClick={handlePlaceTrade} disabled={!isConnected || isProcessing || !tradeAmount || parseFloat(tradeAmount) > usdtBalance} className="w-full">
              {isProcessing ? <span className="flex items-center"><RefreshCcw size={16} className="mr-2 animate-spin" /> Placing...</span> : `Place ${tradeDirection === 'long' ? 'Long' : 'Short'} Trade`}
            </Button>
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

    