
"use client"

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type UserPosition } from '@/components/pages/liquidity';
import { useWallet } from '@/contexts/wallet-context';

interface LiquidityAnalyticsProps {
  userPositions: UserPosition[];
}

// Generate some fake historical data for the chart
const generateHistoricalData = (totalValue: number) => {
  const data = [];
  let value = totalValue * (0.8 + Math.random() * 0.2); // Start at 80-100% of current value
  for (let i = 0; i < 30; i++) {
    data.push({
      name: `Day ${i + 1}`,
      value: Math.max(0, value),
    });
    value *= (0.98 + Math.random() * 0.04); // Fluctuate by -2% to +2% daily
  }
  data[29].value = totalValue; // Ensure the last point is the current value
  return data;
};

export function LiquidityAnalytics({ userPositions }: LiquidityAnalyticsProps) {
  const { walletState } = useWallet();
  const { marketData } = walletState;

  const analytics = useMemo(() => {
    let totalValue = 0;
    let totalFees = 0;
    let totalIL = 0;

    userPositions.forEach(pos => {
      const [token1, token2] = pos.name.split('/');
      const price1 = marketData[token1]?.price || 0;
      const price2 = marketData[token2]?.price || 0;
      
      // Simplified value calculation - in a real app, this would be much more complex
      const value = pos.lpTokens * Math.sqrt(price1 * price2); 
      totalValue += value;
      totalFees += pos.unclaimedRewards; // Simplified assumption
      totalIL += (pos.impermanentLoss / 100) * value;
    });

    return {
      totalValue,
      totalFees,
      totalIL,
      netGain: totalFees + totalIL,
    };
  }, [userPositions, marketData]);

  const historicalData = useMemo(() => generateHistoricalData(analytics.totalValue), [analytics.totalValue]);
  
  if (userPositions.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>LP Portfolio Analytics</CardTitle>
                <CardDescription>In-depth analysis of your liquidity positions.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-16">Provide liquidity to see your performance analytics.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>LP Portfolio Analytics</CardTitle>
          <CardDescription>In-depth analysis of your liquidity positions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${analytics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
             <div>
              <p className="text-sm text-muted-foreground">Fees Earned (7d)</p>
              <p className="text-2xl font-bold text-green-400">+${analytics.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
             <div>
              <p className="text-sm text-muted-foreground">Impermanent Loss (7d)</p>
              <p className={`text-2xl font-bold ${analytics.totalIL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${analytics.totalIL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
             <div>
              <p className="text-sm text-muted-foreground">Net Gain/Loss (7d)</p>
               <p className={`text-2xl font-bold ${analytics.netGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${analytics.netGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>LP Value Over Time</CardTitle>
          <CardDescription>Simulated 30-day performance of your current LP positions.</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value as number / 1000).toFixed(0)}k`} />
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                        }}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
