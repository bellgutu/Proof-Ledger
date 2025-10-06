
"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, FileArchive, TrendingUp, Loader2 } from 'lucide-react';

export const YieldInsights = () => {
    const { state } = useTrustLayer();
    const { safeVaultData, proofBondData, isLoading } = state;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <PiggyBank /> SafeVault Performance
                    </CardTitle>
                    <CardDescription>
                        Insights into the secure vault holding assets for yield generation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                    ) : (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Assets Under Management</p>
                            <p className="text-3xl font-bold">${parseFloat(safeVaultData.totalAssets).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <FileArchive /> ProofBond Market
                    </CardTitle>
                    <CardDescription>
                        Metrics on yield-bearing bonds backed by real-world assets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                    ) : (
                    <>
                        <div className="p-4 bg-muted rounded-lg mb-4">
                            <p className="text-sm text-muted-foreground">Total Value Locked in Bonds</p>
                            <p className="text-3xl font-bold">${parseFloat(proofBondData.tvl).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Number of Active Bonds</p>
                            <p className="text-3xl font-bold">{proofBondData.activeBonds}</p>
                        </div>
                    </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
