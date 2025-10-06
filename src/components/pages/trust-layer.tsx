"use client";
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Landmark, GitCommit, LineChart } from 'lucide-react';
import { Dashboard } from '@/components/trust-layer/dashboard';
import { Governance } from '@/components/trust-layer/governance';
import { MarketIntegrity } from '@/components/trust-layer/market-integrity';
import { YieldInsights } from '@/components/trust-layer/yield-insights';

export default function TrustLayerPage() {
    return (
        <div className="container mx-auto p-0 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                    <ShieldCheck className="w-10 h-10" /> Trust Layer Dashboard
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    An investor-focused view into a verified, on-chain ecosystem for tokenized real-world assets, demonstrating transparency and security.
                </p>
            </div>
            
            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                     <TabsTrigger value="governance" className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        <span>Governance</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrity" className="flex items-center gap-2">
                        <GitCommit className="h-4 w-4" />
                        <span>Market Integrity</span>
                    </TabsTrigger>
                    <TabsTrigger value="yield" className="flex items-center gap-2">
                        <LineChart className="h-4 w-4" />
                        <span>Yield Insights</span>
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard" className="mt-6">
                    <Dashboard />
                </TabsContent>
                <TabsContent value="governance" className="mt-6">
                    <Governance />
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
