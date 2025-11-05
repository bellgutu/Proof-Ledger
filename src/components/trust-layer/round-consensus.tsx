
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, RefreshCw, Loader2 } from 'lucide-react';

export const RoundConsensusCard = () => {
  const { state, actions } = useTrustLayer();
  const { trustOracleData, currentRoundId, isLoading } = state;
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleFinalizeRound = async () => {
    setIsFinalizing(true);
    try {
      await actions.finalizeRound(currentRoundId);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
           <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Current Round Consensus
        </CardTitle>
        <CardDescription>
          Round ID: {currentRoundId.toString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            Consensus Price
          </div>
          <div className="text-3xl font-bold text-primary">
            ${parseFloat(trustOracleData.latestPrice).toLocaleString() || "Not Finalized"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-background border rounded-lg">
            <div className="font-semibold">{trustOracleData.activeProviders}</div>
            <div className="text-muted-foreground">Providers</div>
          </div>
          <div className="text-center p-3 bg-background border rounded-lg">
            <div className="font-semibold">{trustOracleData.minSubmissions}</div>
            <div className="text-muted-foreground">Min Required</div>
          </div>
        </div>

        <Button 
          onClick={handleFinalizeRound}
          variant="outline"
          className="w-full"
          disabled={isFinalizing}
        >
          {isFinalizing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Finalizing...</> : <><RefreshCw className="h-4 w-4 mr-2" />Finalize Current Round</>}
        </Button>
      </CardContent>
    </Card>
  );
};
