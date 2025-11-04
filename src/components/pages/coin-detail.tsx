
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BarChart2, TrendingUp, TrendingDown, Layers, CircleDollarSign, Bot, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TradingViewWidget from '@/components/trading/tradingview-widget';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Skeleton } from '../ui/skeleton';
import { useWallet } from '@/contexts/wallet-context';
import { getWatchlistBriefing, type WatchlistBriefing } from '@/ai/flows/watchlist-flow';

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume: number;
  circulatingSupply: number;
  change24h: number;
  change12h: number;
  change6h: number;
}

export default function CoinDetail({ symbol }: { symbol: string }) {
  const { walletState } = useWallet();
  const { marketData, isMarketDataLoaded } = walletState;
  
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '12h' | '6h'>('24h');
  const [briefing, setBriefing] = useState<WatchlistBriefing | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);

  const currentPrice = marketData[symbol.toUpperCase()]?.price || 0;

  useEffect(() => {
    if (isMarketDataLoaded) {
      const upperSymbol = symbol.toUpperCase();
      const priceData = marketData[upperSymbol];

      if (priceData) {
        setCoinData({
          id: symbol.toLowerCase(),
          name: priceData.name,
          symbol: upperSymbol,
          price: priceData.price,
          marketCap: Math.random() * 1e12,
          volume: Math.random() * 1e10,
          circulatingSupply: Math.random() * 1e9,
          change24h: (Math.random() * 10 - 5),
          change12h: (Math.random() * 5 - 2.5),
          change6h: (Math.random() * 2 - 1),
        });
      }
    }
  }, [symbol, marketData, isMarketDataLoaded]);

  useEffect(() => {
    const fetchBriefing = async () => {
      if (!symbol) return;
      setIsBriefingLoading(true);
      try {
        const result = await getWatchlistBriefing(symbol.toUpperCase());
        setBriefing(result);
      } catch (e) {
        console.error(`Failed to fetch briefing for ${symbol}:`, e);
        setBriefing({ symbol: symbol.toUpperCase(), briefing: "Failed to load AI briefing. The service may be unavailable." });
      } finally {
        setIsBriefingLoading(false);
      }
    };
    fetchBriefing();
  }, [symbol]);

  const getChange = () => {
    if (!coinData) return 0;
    switch (timeframe) {
      case '24h': return coinData.change24h;
      case '12h': return coinData.change12h;
      case '6h': return coinData.change6h;
    }
  };

  if (!isMarketDataLoaded || !coinData) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div>
           <Skeleton className="h-6 w-36 mb-4" />
           <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div>
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-8 w-32 mt-2" />
              </div>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
         <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  
  const isPositive = getChange() >= 0;
  const tradingViewSymbol = `BINANCE:${coinData.symbol}USDT`;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Markets
        </Link>
        <div className="flex items-center gap-4">
          <Image 
            src={getTokenLogo(coinData.symbol)} 
            alt={`${coinData.name} logo`} 
            width={48} 
            height={48}
            className="drop-shadow-lg"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{coinData.name} ({coinData.symbol})</h1>
            <p className="text-3xl font-bold text-primary">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(coinData.marketCap / 1e9).toFixed(2)}B</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume (24h)</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(coinData.volume / 1e9).toFixed(2)}B</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Circulating Supply</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(coinData.circulatingSupply / 1e6).toFixed(2)}M</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle>Price Chart</CardTitle>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
               <div className={`flex items-center text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="mr-2" size={20} /> : <TrendingDown className="mr-2" size={20} />}
                <span>{getChange().toFixed(2)}%</span>
              </div>
              <div className="flex gap-1 p-1 bg-muted rounded-md">
                {(['24h', '12h', '6h'] as const).map(tf => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-card rounded-md">
            <TradingViewWidget symbol={tradingViewSymbol} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold text-primary">
                  <BrainCircuit size={24} className="mr-3" />
                  AI Intelligence Briefing
              </CardTitle>
          </CardHeader>
          <CardContent>
              {isBriefingLoading ? (
                  <div className="space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-5/6" />
                  </div>
              ) : (
                  <div className="flex items-start gap-4">
                      <Bot size={32} className="text-primary flex-shrink-0 mt-1" />
                      <p className="text-muted-foreground">{briefing?.briefing}</p>
                  </div>
              )}
          </CardContent>
      </Card>

    </div>
  );
}
