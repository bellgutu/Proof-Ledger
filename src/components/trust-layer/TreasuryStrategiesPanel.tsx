
"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, Bot, TrendingUp, Zap } from 'lucide-react';

export const TreasuryStrategiesPanel = () => {
    const { state } = useTrustLayer();
    const { safeVaultData, arbitrageEngineData, isLoading } = state;

    const totalStrategyValue = safeVaultData.strategies.reduce((acc, s) => acc + parseFloat(s.value), 0);
    const weightedApy = safeVaultData.strategies.reduce((acc, s) => acc + parseFloat(s.value) * s.apy, 0) / totalStrategyValue;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <PiggyBank /> Autonomous Treasury &amp; Yield Strategies
                </CardTitle>
                <CardDescription>
                    Profits from the Arbitrage Engine are swept into this SafeVault and automatically deployed into yield-generating strategies.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border bg-background rounded-lg flex flex-col md:flex-row items-center justify-center text-center gap-4">
                     <Bot className="w-12 h-12 text-primary" />
                     <div className="text-lg font-semibold text-muted-foreground">&rarr;</div>
                     <div className="text-center">
                        <p className="text-sm">Arbitrage Engine Profits</p>
                        <p className="font-bold text-green-500">${arbitrageEngineData.totalProfit}</p>
                     </div>
                     <div className="text-lg font-semibold text-muted-foreground">&rarr;</div>
                     <PiggyBank className="w-12 h-12 text-primary" />
                     <div className="text-lg font-semibold text-muted-foreground">&rarr;</div>
                     <div className="text-center">
                        <p className="text-sm">Deployed in Strategies</p>
                        <p className="font-bold text-blue-500">${totalStrategyValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {safeVaultData.strategies.map(strategy => (
                        <div key={strategy.name} className="p-3 bg-muted rounded-lg">
                            <p className="font-semibold">{strategy.name}</p>
                            <div className="flex justify-between items-baseline">
                                <p className="text-xl font-bold">${parseFloat(strategy.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                <p className="text-sm font-semibold text-green-500 flex items-center gap-1">
                                    <TrendingUp size={14} /> {strategy.apy.toFixed(1)}% APY
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-4 border bg-background rounded-lg flex justify-between items-center">
                    <span className="font-bold text-lg">Total Treasury Value</span>
                    <div className="text-right">
                        <p className="text-2xl font-bold">${(parseFloat(safeVaultData.totalAssets)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <p className="text-sm font-semibold text-green-500">Blended APY: {weightedApy.toFixed(2)}%</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
