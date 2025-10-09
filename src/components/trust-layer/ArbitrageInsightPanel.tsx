
"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Info } from 'lucide-react';

export const ArbitrageInsightPanel = () => {
    const { state } = useTrustLayer();
    const { trustOracleData, isLoading } = state;
    const [chartData, setChartData] = useState<any[]>([]);

    const MOCK_ORACLE_PRICES = {
        'Chainlink': 4150.55,
        'Pyth': 4151.23,
        'Internal TWAP': 4149.98
    };

    useEffect(() => {
        if (!isLoading) {
            // Use the real oracle data plus mocked data for visualization
            const data = [
                {
                    name: 'Advanced Price Oracle',
                    price: parseFloat(trustOracleData.latestPrice),
                    oracle: 'AdvancedPriceOracle'
                },
                {
                    name: 'Chainlink (Simulated)',
                    price: MOCK_ORACLE_PRICES['Chainlink'],
                    oracle: 'Chainlink'
                },
                {
                    name: 'Pyth (Simulated)',
                    price: MOCK_ORACLE_PRICES['Pyth'],
                    oracle: 'Pyth'
                },
                {
                    name: 'Internal TWAP (Simulated)',
                    price: MOCK_ORACLE_PRICES['Internal TWAP'],
                    oracle: 'InternalTWAP'
                },
            ];
            setChartData(data);
        }
    }, [isLoading, trustOracleData.latestPrice]);
    
    const prices = useMemo(() => chartData.map(d => d.price), [chartData]);
    const maxPrice = useMemo(() => Math.max(...prices), [prices]);
    const minPrice = useMemo(() => Math.min(...prices), [prices]);
    const spread = useMemo(() => maxPrice - minPrice, [maxPrice, minPrice]);
    const spreadPercentage = useMemo(() => (minPrice > 0 ? (spread / minPrice) * 100 : 0), [spread, minPrice]);

    const domain = [Math.floor(minPrice) - 2, Math.ceil(maxPrice) + 2];

    return (
        <div className="space-y-4">
            <div className="h-80 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis domain={domain} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`}/>
                        <Tooltip 
                            cursor={{fill: 'hsla(var(--muted), 0.5)'}}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                            }}
                        />
                        <Bar dataKey="price" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Highest Price</p>
                    <p className="text-lg font-bold">${maxPrice.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Lowest Price</p>
                    <p className="text-lg font-bold">${minPrice.toFixed(2)}</p>
                </div>
                <div className={`p-3 rounded-lg ${spread > 1 ? 'bg-destructive/20' : 'bg-muted'}`}>
                    <p className="text-sm text-muted-foreground">Max Spread</p>
                    <p className="text-lg font-bold flex items-center justify-center gap-2">
                        ${spread.toFixed(2)}
                        {spread > 1 && <AlertTriangle className="h-5 w-5 text-destructive" />}
                    </p>
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-background">
                <h4 className="font-semibold flex items-center gap-2 mb-2"><Info /> Arbitrage Opportunity</h4>
                <p className="text-sm text-muted-foreground">
                    The chart above visualizes the current price of a single asset across multiple decentralized oracles.
                    A significant price spread (e.g., > 0.10%) indicates a potential arbitrage opportunity.
                    The `AdvancedPriceOracle` is designed to ingest these multiple feeds, validate them, and produce a single, manipulation-resistant price, which is then used by the `ForgeMarket` for all swaps and settlements. This prevents arbitrage exploitation within the ecosystem.
                </p>
            </div>
        </div>
    );
};
