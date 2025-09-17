
"use client";
import React from 'react';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Activity, Zap, Shield, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';

export function AnalyticsPanel() {
    const { state } = useAmmDemo();
    
    const totalTVL = state.pools.reduce((sum, pool) => {
        const tokenAPrice = pool.tokenA.symbol.includes('WETH') ? 1800 : 1;
        const tokenBPrice = pool.tokenB.symbol.includes('WETH') ? 1800 : 1;
        const tokenAValue = parseFloat(pool.reserveA) * tokenAPrice;
        const tokenBValue = parseFloat(pool.reserveB) * tokenBPrice;
        return sum + tokenAValue + tokenBValue;
    }, 0);
    
    const totalVolume = state.pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h), 0);
    const totalFees = state.pools.reduce((sum, pool) => sum + parseFloat(pool.fees24h), 0);
    const avgAPY = state.pools.length > 0 ? state.pools.reduce((sum, pool) => sum + pool.apy, 0) / state.pools.length : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total TVL</p>
                                <p className="text-xl font-bold">${totalTVL.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Activity className="text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">24h Volume</p>
                                <p className="text-xl font-bold">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Zap className="text-yellow-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">24h Fees</p>
                                <p className="text-xl font-bold">${totalFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Shield className="text-purple-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. APY</p>
                                <p className="text-xl font-bold">{avgAPY.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><BarChart3 /> Pool Performance</CardTitle>
                    <CardDescription>Detailed metrics for each liquidity pool.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pool</TableHead>
                                <TableHead className="text-right">TVL</TableHead>
                                <TableHead className="text-right">Volume 24h</TableHead>
                                <TableHead className="text-right">Fees 24h</TableHead>
                                <TableHead className="text-right">Fee Rate</TableHead>
                                <TableHead className="text-right">APY</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {state.pools.map(pool => {
                                const tokenAPrice = pool.tokenA.symbol.includes('WETH') ? 1800 : 1;
                                const tokenBPrice = pool.tokenB.symbol.includes('WETH') ? 1800 : 1;
                                const tvl = parseFloat(pool.reserveA) * tokenAPrice + parseFloat(pool.reserveB) * tokenBPrice;
                                
                                return (
                                    <TableRow key={pool.address}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    <Image src={getTokenLogo(pool.tokenA.symbol)} alt="" width={20} height={20} className="rounded-full border-2 border-background"/>
                                                    <Image src={getTokenLogo(pool.tokenB.symbol)} alt="" width={20} height={20} className="rounded-full border-2 border-background"/>
                                                </div>
                                                {pool.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                        <TableCell className="text-right">${parseFloat(pool.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                        <TableCell className="text-right">${parseFloat(pool.fees24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                        <TableCell className="text-right">{pool.feeRate.toFixed(2)}%</TableCell>
                                        <TableCell className="text-right">{pool.apy.toFixed(1)}%</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
