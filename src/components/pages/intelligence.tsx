
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/wallet-context';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TradingViewWidget from '@/components/trading/tradingview-widget';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, Bot, Loader2, PlusCircle, Search, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { getWatchlistBriefing, type WatchlistBriefing } from '@/ai/flows/watchlist-flow';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const AddToWatchlistSchema = z.object({
  symbol: z.string().min(2, "Please select a token."),
});
type AddToWatchlistInput = z.infer<typeof AddToWatchlistSchema>;

const IntelligencePageContent = () => {
  const { walletState } = useWallet();
  const { marketData } = walletState;

  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [currentPrice, setCurrentPrice] = useState(marketData['ETH'].price);
  
  // Watchlist State
  const [watchlist, setWatchlist] = useState<string[]>(['BTC', 'SOL']);
  const [briefings, setBriefings] = useState<Record<string, WatchlistBriefing>>({});
  const [isBriefingLoading, setIsBriefingLoading] = useState<Record<string, boolean>>({});
  
  const watchlistForm = useForm<AddToWatchlistInput>({ resolver: zodResolver(AddToWatchlistSchema), defaultValues: { symbol: "" } });
  const tokenOptions = Object.keys(walletState.marketData);

  const fetchBriefing = useCallback(async (symbol: string) => {
    setIsBriefingLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const result = await getWatchlistBriefing(symbol);
      setBriefings(prev => ({ ...prev, [symbol]: result }));
    } catch (e) {
      console.error(`Failed to fetch briefing for ${symbol}:`, e);
      setBriefings(prev => ({ ...prev, [symbol]: { symbol, briefing: "Failed to load briefing. Please try again." } }));
    } finally {
      setIsBriefingLoading(prev => ({ ...prev, [symbol]: false }));
    }
  }, []);

  const handleAddToWatchlist = (values: AddToWatchlistInput) => {
    const symbol = values.symbol.toUpperCase();
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
      fetchBriefing(symbol);
      watchlistForm.reset();
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setBriefings(prev => {
      const newBriefings = { ...prev };
      delete newBriefings[symbol];
      return newBriefings;
    });
  };
  
  useEffect(() => {
    const pairAsset = selectedPair.split('/')[0];
    if (marketData[pairAsset]) {
      setCurrentPrice(marketData[pairAsset].price);
    }
  }, [marketData, selectedPair]);

  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
    const pairAsset = pair.split('/')[0];
    if (marketData[pairAsset]) {
        setCurrentPrice(marketData[pairAsset].price);
    }
  };
  
  const tradeablePairs = ['ETH/USDT', 'BTC/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
  const asset = selectedPair.split('/')[0];
  const tradingViewSymbol = `BINANCE:${asset}USDT`;
  const initialPriceForChart = marketData[asset]?.price;
  
  if (!initialPriceForChart) {
    return null; // or a loading skeleton
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-3 space-y-8">
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
              <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <h2 className="text-xl font-bold text-foreground">Live Chart</h2>
                      <Select value={selectedPair} onValueChange={handlePairChange}>
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
              </div>
          </CardHeader>
          <CardContent>
            <div className="h-[60vh] bg-card rounded-md">
              <TradingViewWidget symbol={tradingViewSymbol} />
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <CardTitle>Asset Watchlist</CardTitle>
              <CardDescription>Add assets to your watchlist to get personalized intelligence briefings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={watchlistForm.handleSubmit(handleAddToWatchlist)} className="flex items-center gap-2">
                     <Select onValueChange={(val) => watchlistForm.setValue('symbol', val)} value={watchlistForm.watch('symbol')}>
                        <SelectTrigger><SelectValue placeholder="Select a token" /></SelectTrigger>
                        <SelectContent>
                            {tokenOptions.map(token => <SelectItem key={token} value={token}>{token}</SelectItem>)}
                        </SelectContent>
                     </Select>
                    <Button type="submit"><PlusCircle className="mr-2"/> Add</Button>
                </form>
                <div className="space-y-4">
                    {watchlist.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Your watchlist is empty.</p>
                    ) : watchlist.map(symbol => (
                        <Card key={symbol} className="bg-background/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Image src={getTokenLogo(symbol)} alt={symbol} width={32} height={32}/>
                                    <CardTitle className="text-xl">{symbol}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => fetchBriefing(symbol)} disabled={isBriefingLoading[symbol]}>
                                        {isBriefingLoading[symbol] ? <Loader2 className="animate-spin"/> : <Search />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => removeFromWatchlist(symbol)}>
                                        <Trash2 className="text-destructive"/>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isBriefingLoading[symbol] ? <Skeleton className="h-16 w-full" /> : (
                                     <div className="flex items-start gap-3">
                                        <Bot className="text-primary mt-1 flex-shrink-0"/>
                                        <p className="text-sm text-muted-foreground">
                                            {briefings[symbol]?.briefing || "Click the search icon to generate an intelligence briefing."}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}


export default function IntelligencePage() {
  const { walletState } = useWallet();
  const { isMarketDataLoaded } = walletState;

  if (!isMarketDataLoaded) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
           <Skeleton className="h-[75vh] w-full" />
           <Skeleton className="h-64 w-full mt-8" />
        </div>
      </div>
    )
  }

  return <IntelligencePageContent />;
}
