"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyzeChartPatterns, type ChartAnalysisData } from '@/ai/flows/chart-analyzer-flow';
import { Badge } from '../ui/badge';
import { Bot, BrainCircuit } from 'lucide-react';
import type { Candle } from './trading-chart';

interface AIChartAnalysisProps {
  candleData: Candle[];
}

export function AIChartAnalysis({ candleData }: AIChartAnalysisProps) {
  const [analysis, setAnalysis] = useState<ChartAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const performAnalysis = async () => {
      if (candleData.length < 10) return; // Wait for sufficient data
      setIsLoading(true);
      try {
        const result = await analyzeChartPatterns({ candles: candleData });
        setAnalysis(result);
      } catch (error) {
        console.error("Failed to get chart analysis:", error);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the analysis to avoid excessive calls
    const timer = setTimeout(() => {
      performAnalysis();
    }, 2000); // Wait 2s after the last candle update

    return () => clearTimeout(timer);
  }, [candleData]);

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
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <BrainCircuit size={24} className="mr-2" />
            AI Chart Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 h-48 flex flex-col justify-center">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : analysis && analysis.patterns.length > 0 ? (
            analysis.patterns.map((pattern, index) => (
                 <div key={index} className="p-3 bg-background rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center"><Bot size={16} className="mr-2" /> {pattern.name}</h4>
                        <Badge variant="outline" className={getSentimentVariant(pattern.type)}>{pattern.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{pattern.description}</p>
                </div>
            ))
        ) : (
          <p className="text-muted-foreground text-sm text-center">No significant patterns detected.</p>
        )}
      </CardContent>
    </Card>
  );
}
