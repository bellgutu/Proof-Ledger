
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, FileCheck, GitCommit, Zap, Shield, Loader2 } from 'lucide-react';
import { ArbitrageInsightPanel } from './ArbitrageInsightPanel';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Button } from '../ui/button';

export const MarketIntegrity = () => {
    const { state, actions } = useTrustLayer();
    const { isPaused, profitThreshold } = state.arbitrageEngineData;
    const [isPausing, setIsPausing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    const handleTogglePause = async () => {
        setIsPausing(true);
        // This is a placeholder for the actual contract call
        // In a real app, you would call a function like:
        // await actions.setEnginePause(!isPaused);
        await new Promise(res => setTimeout(res, 1000));
        setIsPausing(false);
    };

    const handleExecuteArbitrage = async () => {
        setIsExecuting(true);
        // This is a placeholder for the actual contract call
        // await actions.checkAndExecuteArbitrage();
        await new Promise(res => setTimeout(res, 1500));
        setIsExecuting(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <GitCommit /> Multi-Oracle Consensus & Arbitrage
                        </CardTitle>
                        <CardDescription>
                            The Arbitrage Engine uses a median price from multiple oracles to find and execute profitable trades.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ArbitrageInsightPanel />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Shield /> Arbitrage Engine Control
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Profit Threshold</p>
                            <p className="text-lg font-bold">{profitThreshold} USDC</p>
                        </div>
                         <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Engine Status</p>
                            <p className={`text-lg font-bold ${isPaused ? 'text-destructive' : 'text-green-500'}`}>
                                {isPaused ? 'Paused' : 'Active'}
                            </p>
                        </div>
                        <Button className="w-full" onClick={handleTogglePause} variant={isPaused ? 'secondary' : 'destructive'}>
                            {isPausing ? <Loader2 className="animate-spin" /> : isPaused ? 'Resume Engine' : 'Pause Engine'}
                        </Button>
                        <Button className="w-full" onClick={handleExecuteArbitrage}>
                            {isExecuting ? <Loader2 className="animate-spin" /> : <Zap className="mr-2" />}
                            Manually Trigger Arbitrage Check
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
