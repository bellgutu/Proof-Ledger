

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getWhaleWatchData, type WhaleWatchData } from '@/ai/flows/whale-watcher-flow';
import { Badge } from '../ui/badge';
import { Bot, ArrowRight, RefreshCcw, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { isValidAddress } from '@/lib/utils';

export function WhaleWatch({ pair }: { pair: string }) {
  const [data, setData] = useState<WhaleWatchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [monitoredWallets, setMonitoredWallets] = useState<string[]>([
      '0xA1c2E3F4B5D6C7D8E9F0A1B2C3D4E5F6A7B8C9D0',
      '0xB2d3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1'
  ]);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (monitoredWallets.length === 0) {
        setData(null);
        setError("Add at least one wallet address to monitor.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWhaleWatchData({ wallets: monitoredWallets });
      if (!result) {
        throw new Error("AI failed to return whale data.");
      }
      setData(result);
    } catch (error: any) {
      console.error("Failed to get whale watch data:", error);
      setError(error.message || "Could not load whale activity.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [monitoredWallets]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddWallet = () => {
    if (!isValidAddress(newWalletAddress)) {
        toast({ variant: 'destructive', title: 'Invalid Address' });
        return;
    }
    if (monitoredWallets.includes(newWalletAddress)) {
        toast({ variant: 'destructive', title: 'Address already added' });
        return;
    }
    setMonitoredWallets(prev => [...prev, newWalletAddress]);
    setNewWalletAddress('');
  };

  const handleRemoveWallet = (addressToRemove: string) => {
    setMonitoredWallets(prev => prev.filter(addr => addr !== addressToRemove));
  };

  const getSentimentVariant = (sentiment: 'Bullish' | 'Bearish' | 'Neutral' | undefined) => {
    switch (sentiment) {
      case 'Bullish': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Bearish': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Neutral': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-secondary';
    }
  }

  return (
    <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold text-primary">Whale Watch</CardTitle>
        <Button onClick={fetchData} disabled={isLoading} size="sm" variant="ghost">
           {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
           <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Monitored Wallets</p>
            <div className="flex items-center gap-2">
                <Input 
                    placeholder="0x..." 
                    value={newWalletAddress} 
                    onChange={e => setNewWalletAddress(e.target.value)}
                />
                <Button onClick={handleAddWallet} size="icon"><PlusCircle/></Button>
            </div>
            <div className="space-y-1">
                {monitoredWallets.map(addr => (
                    <div key={addr} className="flex items-center justify-between p-1 text-xs rounded-md bg-background">
                       <span className="font-mono">{`${addr.slice(0, 8)}...${addr.slice(-6)}`}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveWallet(addr)}>
                            <Trash2 size={14} className="text-destructive"/>
                        </Button>
                    </div>
                ))}
            </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
             <div className="space-y-3 pt-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </div>
        ) : error ? (
            <p className="text-muted-foreground text-sm text-center text-destructive">{error}</p>
        ) : data ? (
            <>
                <div className="p-3 bg-background rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center"><Bot size={16} className="mr-2" /> AI Sentiment Analysis</h4>
                        <Badge variant="outline" className={getSentimentVariant(data.sentiment)}>{data.sentiment}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{data.analysis}</p>
                </div>
                <ScrollArea className="h-60">
                    <div className="space-y-2 pr-4">
                    {data.transactions.map((tx, index) => (
                        <div key={`${tx.id}-${index}`} className="p-2 bg-background rounded-md border text-xs">
                            <div className="flex justify-between items-center font-mono">
                                <span className="font-bold text-primary">{tx.asset}</span>
                                <span>${tx.amountUSD.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground mt-1">
                                <span className="truncate w-2/5">{tx.from}</span>
                                <ArrowRight size={12} className="mx-1" />
                                <span className="truncate w-2/5 text-right">{tx.to}</span>
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </>
        ) : (
          <p className="text-muted-foreground text-sm text-center">Click the refresh button to load whale activity.</p>
        )}
      </CardContent>
    </Card>
  );
}

    