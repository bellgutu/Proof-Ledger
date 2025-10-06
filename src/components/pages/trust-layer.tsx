"use client";
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Landmark, GitCommit, LineChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const contractInfo = {
    TrustOracle: "0x5a92b7E95dC3537E87eC6a755403B9191C9055cD",
    SafeVault: "0xbE5dd587b17eb4c0e2c6156c599851e164D37A37",
    ProofBond: "0x98e84f8F812cDFD21debF85f85cbe46a729E608a",
    ForgeMarket: "0xD2c449f3FFf7713cFE9E1f45e5B96E19EFAC49a6",
    OpenGovernor: "0xf2500D9170e6f85D29a69d5a50764a8b44370AD6"
};

const ContractCard = ({ name, address, description, children }: { name: string, address: string, description: string, children?: React.ReactNode }) => (
    <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>{name}</span>
                <span className="text-xs font-mono text-muted-foreground">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {children}
        </CardContent>
    </Card>
);

const Dashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContractCard name="TrustOracle" address={contractInfo.TrustOracle} description="Aggregates and verifies real-world data for on-chain use.">
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Trust Score</p>
                <p className="text-3xl font-bold text-green-400">98.7</p>
            </div>
            <Button className="w-full">View Data Feeds</Button>
        </ContractCard>
        <ContractCard name="SafeVault" address={contractInfo.SafeVault} description="A secure vault for time-locked asset deposits and yield generation.">
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Value Locked (TVL)</p>
                <p className="text-3xl font-bold">$12,450,832</p>
            </div>
            <div className="flex gap-2">
                <Input placeholder="Amount to Deposit" />
                <Button>Deposit</Button>
            </div>
        </ContractCard>
        <ContractCard name="ProofBond" address={contractInfo.ProofBond} description="Mint and trade bonds backed by verified, real-world assets.">
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Active Bonds</p>
                <p className="text-3xl font-bold">1,204</p>
            </div>
            <Button className="w-full">Mint New Bond</Button>
        </ContractCard>
        <ContractCard name="ForgeMarket" address={contractInfo.ForgeMarket} description="A decentralized marketplace for trading tokenized real-world assets.">
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-3xl font-bold">$1,832,091</p>
            </div>
            <Button className="w-full">Explore Market</Button>
        </ContractCard>
        <div className="lg:col-span-2">
            <ContractCard name="OpenGovernor" address={contractInfo.OpenGovernor} description="A DAO for governing the entire Trust Layer ecosystem.">
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Active Proposals</p>
                    <p className="text-3xl font-bold">3</p>
                </div>
                <Button className="w-full">Go to Governance</Button>
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
