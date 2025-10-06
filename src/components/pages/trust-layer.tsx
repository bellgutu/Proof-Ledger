"use client";
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Landmark, GitCommit, LineChart, Cpu, Users, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import * as trustLayerContracts from '@/lib/trustlayer-contract-addresses.json';

const ContractCard = ({ name, address, description, children, status }: { name: string, address: string, description: string, children?: React.ReactNode, status?: 'Verified' | 'Configured' }) => (
    <Card className="transform transition-transform duration-300 hover:scale-[1.01] flex flex-col">
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-3">
                    <ShieldCheck className="text-primary"/> {name}
                </span>
                {status && <Badge variant={status === 'Verified' ? 'secondary' : 'default'}>{status}</Badge>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            {children}
            <div className="text-xs font-mono text-muted-foreground pt-4">
                <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {address}
                </a>
            </div>
        </CardContent>
    </Card>
);

const Dashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ContractCard 
                name="MainContract" 
                address={trustLayerContracts.MainContract} 
                description="The central hub managing contract authorizations, the treasury, fees, and emergency pause functionality for the entire ecosystem."
                status="Verified"
            >
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Protocol Fee</p>
                    <p className="text-3xl font-bold">20%</p>
                </div>
            </ContractCard>
        </div>

         <ContractCard 
            name="AIPredictiveLiquidityOracle" 
            address={trustLayerContracts.AIPredictiveLiquidityOracle} 
            description="A multi-provider oracle where AI agents stake ETH to submit predictions on optimal fees and market volatility."
            status="Configured"
        >
             <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Users /> Active Oracles</p>
                    <p className="text-xl font-bold text-green-400">3</p>
                </div>
                 <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Min Stake</p>
                    <p className="text-sm font-mono">0.1 ETH</p>
                </div>
                 <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Min Submissions</p>
                    <p className="text-sm font-mono">3</p>
                </div>
            </div>
        </ContractCard>

        <ContractCard 
            name="AdvancedPriceOracle" 
            address={trustLayerContracts.AdvancedPriceOracle} 
            description="A robust, multi-source price oracle with historical tracking and volatility calculations to provide secure and reliable price data."
            status="Verified"
        >
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Price Sources</p>
                <p className="text-3xl font-bold">Multiple (Chainlink, etc.)</p>
            </div>
        </ContractCard>
        
        <ContractCard 
            name="AdaptiveMarketMaker" 
            address={trustLayerContracts.AdaptiveMarketMaker} 
            description="An advanced AMM with dynamic, volume-based fee optimization, controlled by the AI Oracle."
            status="Verified"
        >
             <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Fee Tiers</p>
                <p className="text-xl font-bold">0.05% → 0.03% → 0.01%</p>
            </div>
        </ContractCard>

        <div className="lg:col-span-3">
             <ContractCard 
                name="OpenGovernor" 
                address={trustLayerContracts.OpenGovernor} 
                description="A DAO for governing the entire Trust Layer ecosystem."
                status="Verified"
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Active Proposals</p>
                        <p className="text-3xl font-bold">3</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Treasury Value</p>
                        <p className="text-3xl font-bold">$1.2M</p>
                    </div>
                </div>
            </ContractCard>
        </div>
    </div>
);

const Governance = () => (
    <div className="text-center py-16">
        <h2 className="text-2xl font-bold">Governance Dashboard</h2>
        <p className="text-muted-foreground">Coming soon: View proposals, vote, and see treasury details.</p>
    </div>
);
const MarketIntegrity = () => (
    <div className="text-center py-16">
        <h2 className="text-2xl font-bold">Market Integrity Analysis</h2>
        <p className="text-muted-foreground">Coming soon: Real-time data on asset backing, oracle accuracy, and market liquidity.</p>
    </div>
);
const YieldInsights = () => (
    <div className="text-center py-16">
        <h2 className="text-2xl font-bold">Yield & Performance Insights</h2>
        <p className="text-muted-foreground">Coming soon: In-depth analytics on vault returns and bond performance.</p>
    </div>
);

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
