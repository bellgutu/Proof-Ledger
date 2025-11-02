
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Bot, ShieldCheck, TrendingUp, BrainCircuit, Droplets, RefreshCw } from 'lucide-react';
import { WalletHeader } from '../shared/wallet-header';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useWallet } from '@/contexts/wallet-context';

const FeatureCard = ({ title, description, icon, link }: { title: string, description: string, icon: React.ReactNode, link: string }) => (
    <Link href={link} className="block h-full">
        <Card className="bg-card/50 hover:bg-card hover:border-primary/50 border-transparent border h-full transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        {icon}
                    </div>
                    <CardTitle>{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription>{description}</CardDescription>
                <div className="flex items-center text-sm font-semibold text-primary mt-4">
                    Explore <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </CardContent>
        </Card>
    </Link>
);

// Generate some plausible-looking historical data for the chart
const generateChartData = (currentPrice: number) => {
  const data = [];
  let value = currentPrice * (0.95 + Math.random() * 0.05); 
  for (let i = 0; i < 30; i++) {
    data.push({
      name: `Day ${i + 1}`,
      price: Math.max(0, value),
    });
    value *= (0.98 + Math.random() * 0.045); // Fluctuate by -2% to +2.5% daily
  }
  data[29].price = currentPrice; // Ensure the last point is the current price
  return data;
};


export default function DashboardPage() {
  const { walletState } = useWallet();
  const ethPrice = walletState.marketData['ETH']?.price || 3500;
  const chartData = useMemo(() => generateChartData(ethPrice), [ethPrice]);

  return (
    <div className="space-y-8">
        <WalletHeader />

        <div className="text-center space-y-2 mt-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
                The Infrastructure for Your Own Decentralized Bank
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                This isn't just a DeFi app. It’s a platform that lets anyone, anywhere, run their own autonomous financial system — with built-in yield, governance, and automation.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
            <FeatureCard 
                title="Autonomous Market Engine"
                description="Interact with a live, next-generation Automated Market Maker on the Sepolia testnet. Experience dynamic fees, data-driven oracles, and enhanced capital efficiency."
                icon={<Bot className="w-8 h-8 text-primary" />}
                link="/amm-demo"
            />
            <FeatureCard 
                title="Trust Layer"
                description="Explore a verified on-chain framework for issuing, governing, and managing tokenized assets. View system health, oracle networks, and yield products."
                icon={<ShieldCheck className="w-8 h-8 text-primary" />}
                link="/trust-layer"
            />
        </div>
        
         <Card className="bg-card/50">
            <CardHeader>
                <CardTitle>Platform Tools & Features</CardTitle>
                <CardDescription>Leverage a full suite of tools for trading, analysis, and portfolio management.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/trading"><Button variant="outline" className="w-full justify-start p-6 text-left h-auto"><TrendingUp className="mr-4"/><div><p className="font-bold">Perpetuals Trading</p><p className="text-xs text-muted-foreground">Trade futures with leverage.</p></div></Button></Link>
                <Link href="/swap"><Button variant="outline" className="w-full justify-start p-6 text-left h-auto"><RefreshCw className="mr-4"/><div><p className="font-bold">Token Swap</p><p className="text-xs text-muted-foreground">Exchange tokens on-chain.</p></div></Button></Link>
                <Link href="/intelligence"><Button variant="outline" className="w-full justify-start p-6 text-left h-auto"><BrainCircuit className="mr-4"/><div><p className="font-bold">Market Intelligence</p><p className="text-xs text-muted-foreground">Get briefings on assets.</p></div></Button></Link>
                <Link href="/liquidity"><Button variant="outline" className="w-full justify-start p-6 text-left h-auto"><Droplets className="mr-4"/><div><p className="font-bold">Provide Liquidity</p><p className="text-xs text-muted-foreground">Earn fees on your assets.</p></div></Button></Link>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>A real-time, animated visualization of simulated market trends.</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(typeof value === 'number' ? value/1000 : 0).toFixed(0)}k`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                            }}
                            formatter={(value) => [`$${(typeof value === 'number' ? value : 0).toFixed(2)}`, 'Price']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#priceGradient)" 
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
}
