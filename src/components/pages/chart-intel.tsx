
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/wallet-context';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradingChart, type Candle } from '@/components/trading/trading-chart';
import { AIChartAnalysis } from '@/components/trading/ai-chart-analysis';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


const ChartIntelPageContent = () => {
  const { walletState } = useWallet();
  const { marketData } = walletState;

  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [currentPrice, setCurrentPrice] = useState(marketData['ETH'].price);
  const [candleData, setCandleData] = useState<Candle[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleCandleDataUpdate = useCallback((candles: Candle[]) => {
    setCandleData(candles);
  }, []);
  
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
  const initialPriceForChart = marketData[selectedPair.split('/')[0]]?.price;
  
  if (!initialPriceForChart) {
    return null; // or a loading skeleton
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
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
                   <span className="text-3xl font-bold text-foreground">${currentPrice.toFixed(4)}</span>
              </div>
          </CardHeader>
          <CardContent>
            <div className="h-[60vh] bg-card rounded-md">
              <TradingChart 
                  key={selectedPair} 
                  initialPrice={initialPriceForChart} 
                  onPriceChange={setCurrentPrice} 
                  onCandleDataUpdate={handleCandleDataUpdate}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-8">
         <AIChartAnalysis 
            candleData={candleData} 
            onError={setAnalysisError}
        />
        {analysisError && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analysis Error</AlertTitle>
                <AlertDescription>
                    {analysisError}
                </AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}


export default function ChartIntelPage() {
  const { walletState } = useWallet();
  const { isMarketDataLoaded } = walletState;

  if (!isMarketDataLoaded) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <Skeleton className="h-[75vh] w-full" />
        </div>
        <div className="space-y-8">
            <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  return <ChartIntelPageContent />;
}
