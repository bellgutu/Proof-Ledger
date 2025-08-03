
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { AIChartAnalysis } from '@/components/trading/ai-chart-analysis';
import { Skeleton } from '../ui/skeleton';

interface Trade {
  amount: number;
  direction: 'long' | 'short';
  entryPrice: string;
  leverage: number;
  livePnl: string;
  pair: string;
}

interface TradeHistoryItem extends Trade {
  finalPnl: string;
  closePrice: string;
}

const TradingPageContent = () => {
  const { walletState, walletActions } = useWallet();
  const { isConnected, usdcBalance, marketData } = walletState;
  const { setUsdcBalance } = walletActions;

  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(1);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [currentPrice, setCurrentPrice] = useState(marketData['ETH'].price);
  
  const candleDataRef = useRef<Candle[]>([]);

  const handleCandleDataUpdate = useCallback((candles: Candle[]) => {
    candleDataRef.current = candles;
  }, []);

  const asset = selectedPair.split('/')[0];
  
  useEffect(() => {
    const pairAsset = selectedPair.split('/')[0];
    if (marketData[pairAsset]) {
      setCurrentPrice(marketData[pairAsset].price);
    }
  }, [marketData, selectedPair]);

  const handlePairChange = (pair: string) => {
    if(activeTrade) return; // Prevent changing pair with an active trade
    setSelectedPair(pair);
    const pairAsset = pair.split('/')[0];
    if (marketData[pairAsset]) {
        setCurrentPrice(marketData[pairAsset].price);
    }
    setTradeAmount('');
  };

  const placeTrade = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0 || amount > usdcBalance) return;
    
    setIsPlacingTrade(true);
    setTimeout(() => {
      const entryPrice = currentPrice;
      setActiveTrade({
        pair: selectedPair,
        amount,
        direction: tradeDirection,
        entryPrice: entryPrice.toFixed(4),
        leverage,
        livePnl: '0.00',
      });
      setUsdcBalance(prev => parseFloat((prev - amount).toFixed(4)));
      setTradeAmount('');
      setIsPlacingTrade(false);
    }, 1500);
  };

  const closeTrade = useCallback(() => {
    if (!activeTrade) return;
    const finalPrice = currentPrice + (Math.random() - 0.5) * (currentPrice * 0.01);
    const pnl = activeTrade.direction === 'long'
      ? ((finalPrice - parseFloat(activeTrade.entryPrice)) / parseFloat(activeTrade.entryPrice)) * activeTrade.amount * activeTrade.leverage
      : ((parseFloat(activeTrade.entryPrice) - finalPrice) / parseFloat(activeTrade.entryPrice)) * activeTrade.amount * activeTrade.leverage;

    const newBalance = activeTrade.amount + pnl;

    setUsdcBalance(prev => parseFloat((prev + newBalance).toFixed(4)));
    setTradeHistory(prev => [{ ...activeTrade, finalPnl: pnl.toFixed(2), closePrice: finalPrice.toFixed(4) }, ...prev]);
    setActiveTrade(null);
  }, [activeTrade, currentPrice, setUsdcBalance]);

  useEffect(() => {
    if (activeTrade) {
      const pnl = activeTrade.direction === 'long'
        ? ((currentPrice - parseFloat(activeTrade.entryPrice)) / parseFloat(activeTrade.entryPrice)) * activeTrade.amount * activeTrade.leverage
        : ((parseFloat(activeTrade.entryPrice) - currentPrice) / parseFloat(activeTrade.entryPrice)) * activeTrade.amount * activeTrade.leverage;

      setActiveTrade(prev => prev ? ({ ...prev, livePnl: pnl.toFixed(2) }) : null);
    }
  }, [currentPrice, activeTrade]);
  
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
                  <Select value={selectedPair} onValueChange={handlePairChange} disabled={!!activeTrade}>
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
            <span className="text-3xl font-bold text-foreground">${currentPrice.toFixed(4)}</span>
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
            <CardTitle className="text-2xl font-bold text-primary">Positions & History</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTrade && (
              <div className="p-4 bg-background rounded-md mb-4 border">
                <p className="text-sm text-muted-foreground">Active Position:</p>
                <div className="flex flex-wrap items-center justify-between mt-1 gap-2">
                  <span className={`text-lg font-bold ${activeTrade.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {activeTrade.direction.toUpperCase()} ${activeTrade.amount.toFixed(2)}
                  </span>
                   <span className="text-foreground font-semibold">{activeTrade.pair}</span>
                  <span className="text-foreground font-semibold">Entry: ${activeTrade.entryPrice}</span>
                  <span className="text-foreground font-semibold">Leverage: {activeTrade.leverage}x</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  P&L: <span className={parseFloat(activeTrade.livePnl) >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${activeTrade.livePnl}
                  </span>
                </div>
                <Button onClick={closeTrade} className="w-full mt-4" variant="destructive">Close Position</Button>
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2 text-foreground">Trade History</h3>
            {tradeHistory.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {tradeHistory.map((trade, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-background rounded-md border">
                    <div>
                      <span className={`font-bold ${trade.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.direction.toUpperCase()} ${trade.amount.toFixed(2)} {trade.pair}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">({trade.leverage}x)</span>
                    </div>
                    <p className="text-sm">PnL: <span className={parseFloat(trade.finalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}>${trade.finalPnl}</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No trades closed yet.</p>
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
              <label htmlFor="trade-amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount (USDC)</label>
              <Input
                id="trade-amount"
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                disabled={!isConnected || activeTrade !== null}
                placeholder="0.0"
              />
              <p className="text-xs text-muted-foreground mt-1">Balance: {usdcBalance.toFixed(2)} USDC</p>
            </div>
            <div>
              <label htmlFor="leverage-select" className="block text-sm font-medium text-muted-foreground mb-1">Leverage</label>
              <Select
                value={String(leverage)}
                onValueChange={(val) => setLeverage(parseInt(val))}
                disabled={!isConnected || activeTrade !== null}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="10">10x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setTradeDirection('long')} className={`w-full ${tradeDirection === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-secondary hover:bg-green-600/50'}`} disabled={!isConnected || !!activeTrade}><TrendingUp size={16} className="mr-2" /> Long</Button>
              <Button onClick={() => setTradeDirection('short')} className={`w-full ${tradeDirection === 'short' ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary hover:bg-red-600/50'}`} disabled={!isConnected || !!activeTrade}><TrendingDown size={16} className="mr-2" /> Short</Button>
            </div>
            <Button onClick={placeTrade} disabled={!isConnected || isPlacingTrade || !tradeAmount || parseFloat(tradeAmount) > usdcBalance || !!activeTrade} className="w-full">
              {isPlacingTrade ? <span className="flex items-center"><RefreshCcw size={16} className="mr-2 animate-spin" /> Placing...</span> : `Place ${tradeDirection === 'long' ? 'Long' : 'Short'} Trade`}
            </Button>
          </CardContent>
        </Card>

        <AIChartAnalysis key={`ai-analysis-${selectedPair}`} candleData={candleDataRef.current} />

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
