"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { RefreshCcw, TrendingUp, TrendingDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletHeader } from '@/components/shared/wallet-header';
import { TradingChart, type Candle } from '@/components/trading/trading-chart';
import { OrderBook } from '@/components/trading/order-book';
import { WhaleWatch } from '@/components/trading/whale-watch';
import { AIChartAnalysis } from '@/components/trading/ai-chart-analysis';

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

const initialPrices: { [key: string]: number } = {
    'ETH/USDT': 3500,
    'BTC/USDT': 68000,
    'SOL/USDT': 150,
    'BNB/USDT': 600,
    'XRP/USDT': 0.5,
};

export default function TradingPage() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, ethBalance, usdcBalance, bnbBalance, usdtBalance, xrpBalance } = walletState;
  const { setEthBalance, setUsdcBalance, setBnbBalance, setUsdtBalance, setXrpBalance } = walletActions;

  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(1);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [currentPrice, setCurrentPrice] = useState(initialPrices[selectedPair]);
  
  const candleDataRef = useRef<Candle[]>([]);

  const asset = selectedPair.split('/')[0];

  const getAssetBalance = useCallback(() => {
    switch(asset) {
        case 'ETH': return ethBalance;
        case 'BTC': return usdcBalance / initialPrices['BTC/USDT']; // Mock BTC balance
        case 'SOL': return usdcBalance / initialPrices['SOL/USDT']; // Mock SOL balance
        case 'BNB': return bnbBalance;
        case 'XRP': return xrpBalance;
        default: return 0;
    }
  }, [asset, ethBalance, usdcBalance, bnbBalance, xrpBalance]);
  
  const setAssetBalance = useCallback((updater: (prev: number) => number) => {
     switch(asset) {
        case 'ETH': setEthBalance(updater); break;
        // In a real app, you'd have separate balance setters for each asset
        case 'BTC': setUsdcBalance(prev => prev + (updater(0) * initialPrices['BTC/USDT'])); break;
        case 'SOL': setUsdcBalance(prev => prev + (updater(0) * initialPrices['SOL/USDT'])); break;
        case 'BNB': setBnbBalance(updater); break;
        case 'XRP': setXrpBalance(updater); break;
    }
  }, [asset, setEthBalance, setUsdcBalance, setBnbBalance, setXrpBalance]);

  const handlePairChange = (pair: string) => {
    if(activeTrade) return; // Prevent changing pair with an active trade
    setSelectedPair(pair);
    setCurrentPrice(initialPrices[pair]);
    setTradeAmount('');
  };

  const placeTrade = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0 || amount * leverage > getAssetBalance()) return;
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
      setAssetBalance(prev => parseFloat((prev - amount).toFixed(4)));
      setTradeAmount('');
      setIsPlacingTrade(false);
    }, 1500);
  };

  const closeTrade = useCallback(() => {
    if (!activeTrade) return;
    const finalPrice = currentPrice + (Math.random() - 0.5) * (currentPrice * 0.01);
    const pnl = activeTrade.direction === 'long'
      ? (finalPrice - parseFloat(activeTrade.entryPrice)) * activeTrade.amount * activeTrade.leverage
      : (parseFloat(activeTrade.entryPrice) - finalPrice) * activeTrade.amount * activeTrade.leverage;

    const newBalance = activeTrade.amount + pnl / currentPrice;

    setAssetBalance(prev => parseFloat((prev + newBalance).toFixed(4)));
    setTradeHistory(prev => [{ ...activeTrade, finalPnl: pnl.toFixed(2), closePrice: finalPrice.toFixed(4) }, ...prev]);
    setActiveTrade(null);
  }, [activeTrade, currentPrice, setAssetBalance]);

  useEffect(() => {
    if (activeTrade) {
      const pnl = activeTrade.direction === 'long'
        ? (currentPrice - parseFloat(activeTrade.entryPrice)) * activeTrade.amount * activeTrade.leverage
        : (parseFloat(activeTrade.entryPrice) - currentPrice) * activeTrade.amount * activeTrade.leverage;
      setActiveTrade(prev => prev ? ({ ...prev, livePnl: pnl.toFixed(2) }) : null);
    }
  }, [currentPrice, activeTrade]);

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <CardTitle className="text-2xl font-bold text-primary">Perpetual Futures</CardTitle>
                    <Select value={selectedPair} onValueChange={handlePairChange} disabled={!!activeTrade}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Pair" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(initialPrices).map(pair => (
                                <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              <span className="text-3xl font-bold text-foreground">${currentPrice.toFixed(4)}</span>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-background rounded-md p-2">
                <TradingChart 
                    key={selectedPair} 
                    initialPrice={initialPrices[selectedPair]} 
                    onPriceChange={setCurrentPrice} 
                    onCandleDataUpdate={(candles) => { candleDataRef.current = candles; }}
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
                      {activeTrade.direction.toUpperCase()} {activeTrade.amount.toFixed(2)} {activeTrade.pair.split('/')[0]}
                    </span>
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
                          {trade.direction.toUpperCase()} {trade.amount.toFixed(2)} {trade.pair.split('/')[0]}
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
                <label htmlFor="trade-amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount ({asset})</label>
                <Input
                  id="trade-amount"
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  disabled={!isConnected || activeTrade !== null}
                  placeholder="0.0"
                />
                <p className="text-xs text-muted-foreground mt-1">Balance: {getAssetBalance().toFixed(4)} {asset}</p>
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
              <Button onClick={placeTrade} disabled={!isConnected || isPlacingTrade || !tradeAmount || parseFloat(tradeAmount) * leverage > getAssetBalance() || !!activeTrade} className="w-full">
                {isPlacingTrade ? <span className="flex items-center"><RefreshCcw size={16} className="mr-2 animate-spin" /> Placing...</span> : `Place ${tradeDirection === 'long' ? 'Long' : 'Short'} Trade`}
              </Button>
            </CardContent>
          </Card>

          <AIChartAnalysis key={selectedPair} candleData={candleDataRef.current} />

          <WhaleWatch key={selectedPair} pair={selectedPair} />
          
          <OrderBook currentPrice={currentPrice} assetSymbol={asset} />
        </div>
      </div>
    </div>
  );
}
