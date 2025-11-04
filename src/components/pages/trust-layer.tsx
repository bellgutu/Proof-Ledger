
"use client";
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Landmark, GitCommit, LineChart } from 'lucide-react';
import { Dashboard } from '@/components/trust-layer/dashboard';
import { OracleNetwork } from '@/components/trust-layer/governance';
import { MarketIntegrity } from '@/components/trust-layer/market-integrity';
import { YieldInsights } from '@/components/trust-layer/yield-insights';
import { WalletHeader } from '../shared/wallet-header';

export default function TrustLayerPage() {
    return (
        <div className="container mx-auto p-0 space-y-8">
            <WalletHeader />
            <div className="text-center space-y-2 mt-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                    <ShieldCheck className="w-10 h-10" /> Trust Layer
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    The core infrastructure for an autonomous financial entity. Explore a verified, on-chain ecosystem for tokenized assets, governance, and automated yield strategies.
                </p>
            </div>
            
            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span>System Health</span>
                    </TabsTrigger>
                     <TabsTrigger value="oracle" className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        <span>Trust Oracle Network</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrity" className="flex items-center gap-2">
                        <GitCommit className="h-4 w-4" />
                        <span>Market Integrity</span>
                    </TabsTrigger>
                    <TabsTrigger value="yield" className="flex items-center gap-2">
                        <LineChart className="h-4 w-4" />
                        <span>Yield Products</span>
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard" className="mt-6">
                    <Dashboard />
                </TabsContent>
                <TabsContent value="oracle" className="mt-6">
                    <OracleNetwork />
                </TabsContent>
                <TabsContent value="integrity" className="mt-6">
                    <MarketIntegrity />
                </TabsContent>
                <TabsContent value="yield" className="mt-6">
                    <YieldInsights />
                </TabsContent>
            </Tabs>
        </div>
    );
}
