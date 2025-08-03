
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getWhaleWatchData, type WhaleWatchData } from '@/ai/flows/whale-watcher-flow';
import { Badge } from '../ui/badge';
import { Bot, ArrowRight, RefreshCcw, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';

export function WhaleWatch({ pair }: { pair: string }) {
  const [data, setData] = useState<WhaleWatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWhaleWatchData(pair);
      setData(result);
    } catch (error) {
      console.error("Failed to get whale watch data:", error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [pair]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
             <div className="space-y-3 pt-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </div>
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
          <p className="text-muted-foreground text-sm text-center">Could not load whale activity.</p>
        )}
      </CardContent>
    </Card>
  );
}
