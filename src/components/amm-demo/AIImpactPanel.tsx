
"use client";

import React from 'react';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Zap, Activity, Cpu, BarChart3 } from 'lucide-react';

export function AIImpactPanel() {
    const { state } = useAmmDemo();
    
    // Calculate metrics that showcase AI impact
    const avgFeeReduction = state.pools.length > 0 
        ? state.pools.reduce((sum, pool) => sum + (0.3 - pool.feeRate), 0) / state.pools.length 
        : 0;
    
    const totalFeesSaved = state.pools.reduce((sum, pool) => {
        const volume = parseFloat(pool.volume24h);
        const feeSaved = volume * (0.3 - pool.feeRate) / 100;
        return sum + feeSaved;
    }, 0);
    
    const efficiencyGain = avgFeeReduction / 0.3 * 100; // Percentage improvement over standard 0.3% fee
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Cpu /> AI Impact Analysis</CardTitle>
                    <CardDescription>Measurable benefits of AI-driven fee optimization</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="border-green-500/30">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <TrendingUp />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Fee Reduction</p>
                                        <p className="text-xl font-bold">{(avgFeeReduction * 100).toFixed(2)}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-blue-500/30">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-blue-600">
                                    <Zap />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fees Saved (24h)</p>
                                        <p className="text-xl font-bold">${totalFeesSaved.toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-purple-500/30">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-purple-600">
                                    <Activity />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Efficiency Gain</p>
                                        <p className="text-xl font-bold">{efficiencyGain.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">AI Optimization Benefits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-2">Dynamic Fee Adjustment</h4>
                                <p className="text-sm text-muted-foreground">
                                    AI algorithms continuously analyze market conditions to optimize trading fees, 
                                    resulting in an average reduction of {(avgFeeReduction * 100).toFixed(2)}% compared to static fee models.
                                </p>
                            </div>
                            
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-2">Liquidity Optimization</h4>
                                <p className="text-sm text-muted-foreground">
                                    AI predictions help maintain optimal liquidity distribution across pools, 
                                    reducing slippage and improving capital efficiency by up to 40%.
                                </p>
                            </div>
                            
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-2">Market Volatility Adaptation</h4>
                                <p className="text-sm text-muted-foreground">
                                    The system automatically adjusts parameters based on predicted market volatility, 
                                    providing better protection against impermanent loss during turbulent periods.
                                </p>
                            </div>
                            
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-2">Confidence-Weighted Decisions</h4>
                                <p className="text-sm text-muted-foreground">
                                    Each AI prediction includes a confidence score, allowing the system to weigh 
                                    recommendations appropriately and maintain stability even with uncertain predictions.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><BarChart3 /> Fee Optimization History</CardTitle>
                    <CardDescription>Historical trend of fee adjustments and their impact</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Fee optimization chart visualization would appear here</p>
                        {/* In a real implementation, you would add a chart library like Chart.js or Recharts */}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
