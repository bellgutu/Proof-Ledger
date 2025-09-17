
"use client";
import React from 'react';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, Bot, Droplets, RefreshCw, PlusCircle, BarChart3, History
} from 'lucide-react';
import { WalletPanel } from '@/components/amm-demo/WalletPanel';
import { TransactionHistoryPanel } from '@/components/amm-demo/TransactionHistoryPanel';
import { AiOraclePanel } from '@/components/amm-demo/AiOraclePanel';
import { PoolManagementPanel } from '@/components/amm-demo/PoolManagementPanel';
import { SwapPanel } from '@/components/amm-demo/SwapPanel';
import { LiquidityPanel } from '@/components/amm-demo/LiquidityPanel';
import { AnalyticsPanel } from '@/components/amm-demo/AnalyticsPanel';
import { SendReceivePanel } from '@/components/amm-demo/SendReceivePanel';

function InnovativeAMMDemo() {
    return (
        <div className="container mx-auto p-0 space-y-8">
             <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Innovative AMM Demo</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    A technical showcase of the AI-driven Automated Market Maker system, using isolated mock contracts on the Sepolia testnet.
                </p>
            </div>
            
            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                     <TabsTrigger value="send" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>Send/Receive</span>
                    </TabsTrigger>
                    <TabsTrigger value="oracle" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span>AI Oracle</span>
                    </TabsTrigger>
                    <TabsTrigger value="pools" className="flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        <span>Pools</span>
                    </TabsTrigger>
                    <TabsTrigger value="swap" className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        <span>Swap</span>
                    </TabsTrigger>
                    <TabsTrigger value="liquidity" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        <span>Liquidity</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <WalletPanel />
                        </div>
                        <div>
                            <TransactionHistoryPanel />
                        </div>
                    </div>
                </TabsContent>

                 <TabsContent value="send" className="mt-6">
                    <SendReceivePanel />
                </TabsContent>
                
                <TabsContent value="oracle" className="mt-6">
                    <AiOraclePanel />
                </TabsContent>
                
                <TabsContent value="pools" className="mt-6">
                    <PoolManagementPanel />
                </TabsContent>
                
                 <TabsContent value="swap" className="mt-6">
                    <SwapPanel />
                </TabsContent>
                
                <TabsContent value="liquidity" className="mt-6">
                    <LiquidityPanel />
                </TabsContent>
                
                <TabsContent value="analytics" className="mt-6">
                    <AnalyticsPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default InnovativeAMMDemo;
