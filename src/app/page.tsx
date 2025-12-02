
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Shield, Zap, CheckCircle, Anchor, Globe, Users, ArrowDown, ArrowUp, Bot, Gavel, Building, Diamond, Wheat, Box, Ship, Map, Wallet, Send, Landmark, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { useWallet } from "@/components/wallet-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const kycStatusData = [
  { partner: "Global Shipping Co.", status: "Verified", entity: "Logistics" },
  { partner: "Precious Gems Inc.", status: "Verified", entity: "Luxury Goods" },
  { partner: "AgriSource", status: "Pending", entity: "Commodity" },
  { partner: "Financier Alliance", status: "Verified", entity: "Finance" },
  { partner: "PropertyVerifier", status: "Restricted", entity: "Real Estate" },
];

const shipmentExceptions = [
    { id: "SH-734-556", issue: "Tamper Alert Triggered", priority: "Critical" },
    { id: "SH-456-881", issue: "FOB Verification Delayed", priority: "High" },
    { id: "SH-992-109", issue: "CIF Documents Missing", priority: "High" },
];

const mockTransactions = [
    { type: 'receive', from: '0x...a4b1', asset: '0.5 ETH', time: '2h ago' },
    { type: 'send', to: '0x...c8d2', asset: '1,500 USDC', time: '6h ago' },
    { type: 'receive', from: '0x...e3f4', asset: 'Oracle Payout', time: '1d ago' },
];

const InteractiveMap = dynamic(() => import('@/components/interactive-map'), {
  ssr: false
});


export default function CommandCenterPage() {
  const { systemAlerts, isConnected, connectWallet, ethBalance, usdcBalance, isBalanceLoading } = useWallet();

  const WalletCard = () => (
     <Card>
        <CardHeader>
            <CardTitle  className="flex items-center gap-2"><Wallet size={20} /> My Wallet</CardTitle>
            <CardDescription>Your current balances and recent transactions.</CardDescription>
        </CardHeader>
        <CardContent>
            {isConnected ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-sm text-muted-foreground">ETH Balance</p>
                            {isBalanceLoading ? <Skeleton className="h-7 w-3/4 mt-1" /> : <p className="text-xl font-bold">{ethBalance || '0.00'} ETH</p>}
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-sm text-muted-foreground">USDC Balance</p>
                            {isBalanceLoading ? <Skeleton className="h-7 w-3/4 mt-1" /> : <p className="text-xl font-bold">${usdcBalance || '0.00'}</p>}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
                        <div className="space-y-3">
                            {mockTransactions.map((tx, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", tx.type === 'send' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400')}>
                                            {tx.type === 'send' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                                        </div>
                                        <div>
                                            <p className="font-medium">{tx.type === 'send' ? `Sent to ${tx.to}` : `Received from ${tx.from}`}</p>
                                            <p className="text-xs text-muted-foreground">{tx.asset}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                        <Button className="w-full"><Send className="mr-2 h-4 w-4" /> Send</Button>
                        <Button variant="secondary" className="w-full"><Landmark className="mr-2 h-4 w-4"/> Deposit</Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">Connect your wallet to view your portfolio and transaction history.</p>
                    <Button onClick={connectWallet} className="mt-4">Connect Wallet</Button>
                </div>
            )}
        </CardContent>
    </Card>
  )


  return (
    <div className="container mx-auto p-0 space-y-6">
      <div className="text-left">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Ledger Overview</h1>
        <p className="text-lg text-muted-foreground">Risk & Financial Triage Dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === WIDGET 1: RISK MITIGATION SCORECARD === */}
        <Card className="lg:col-span-1 border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400"><Shield size={20} /> Proof Score | Risk Triage</CardTitle>
                <CardDescription>Instant assessment of platform-wide risk exposure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Total Risk Grade</p>
                    <p className="text-6xl font-bold text-yellow-400">B+</p>
                    <p className="text-xs text-muted-foreground mt-1">Escrow Utilization Rate: 18%</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm text-muted-foreground">Pending Exceptions</p>
                        <p className="text-3xl font-bold text-destructive">3</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm text-muted-foreground">Blocked Transfers</p>
                        <p className="text-3xl font-bold text-green-400">12</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* === WIDGET 2: FINANCIAL & LIQUIDITY SNAPSHOT === */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap size={20}/> Ledger-Secured Capital</CardTitle>
                <CardDescription>Summary of financial health and supply chain financing potential.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Collateralized Assets Value</p>
                    <p className="text-3xl font-bold">$12.5M</p>
                    <p className="text-xs text-muted-foreground">Near-Perfect Order Rate: 96%</p>
                </div>
                 <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Auto-Claims Payout (MTD)</p>
                    <p className="text-3xl font-bold">$300K</p>
                    <p className="text-xs text-muted-foreground">Cycle Time Reduction: -8 Days</p>
                </div>
                 <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Available Liquidity Pool</p>
                    <p className="text-3xl font-bold text-green-400">$150.5M</p>
                     <p className="text-xs text-muted-foreground">Ready for instant financing</p>
                </div>
            </CardContent>
        </Card>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* === WIDGET 3: VERIFIED ASSET STATUS VIEWER === */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe size={20} /> Verified Asset Status Viewer</CardTitle>
                <CardDescription>Real-time tracking of active shipments and their status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="p-4 rounded-lg bg-secondary/50">
                        <p className="text-sm text-muted-foreground">Shipments In-Transit</p>
                        <p className="text-4xl font-bold">128</p>
                    </div>
                     <div className="p-4 rounded-lg bg-secondary/50">
                        <p className="text-sm text-muted-foreground">At-Risk Shipments</p>
                        <p className="text-4xl font-bold text-yellow-400">8</p>
                    </div>
                     <div className="p-4 rounded-lg bg-secondary/50">
                         <p className="text-sm text-muted-foreground">FOB/CIF Verified (24h)</p>
                        <p className="text-4xl font-bold text-green-400">42</p>
                    </div>
                </div>
                <div className="h-[600px] w-full rounded-lg bg-secondary overflow-hidden relative">
                    <InteractiveMap />
                     <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg text-xs z-[1000]">
                        <Map className="h-4 w-4 inline-block mr-1 text-primary"/>
                        Showing At-Risk Shipments.
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="lg:col-span-1 space-y-6">
             {/* === NEW WIDGET: WALLET & TRANSACTIONS === */}
            <WalletCard />
            
            {/* === WIDGET 4: ASSET VERIFICATION SUMMARY === */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle size={20} /> Ledger Integrity Status</CardTitle>
                <CardDescription>
                  Core data integrity status and oracle health.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm text-muted-foreground">Total Verified Assets</p>
                        <p className="text-3xl font-bold">1,492</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm text-muted-foreground">Re-Verification Queue</p>
                        <p className="text-3xl font-bold text-yellow-400">8</p>
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-sm text-muted-foreground">Trust Oracle Health (Data Integrity Score)</p>
                    <p className="text-xl font-bold text-green-400">98.7%</p>
                    <p className="text-xs text-muted-foreground">99.9% Uptime, 10 Providers Active</p>
                </div>
              </CardContent>
            </Card>

             {/* === WIDGET 5: CRITICAL SYSTEM ALERTS === */}
             <Card>
                <CardHeader>
                    <CardTitle  className="flex items-center gap-2 text-red-400"><AlertTriangle size={20} />Critical System Alerts</CardTitle>
                    <CardDescription>Centralized log for high-priority system events.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Impact</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {systemAlerts.map((alert, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <p className="font-semibold">{alert.source}</p>
                                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                                        {alert.txHash && (
                                            <a href={`https://sepolia.etherscan.io/tx/${alert.txHash}`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1">View Tx</Button>
                                            </a>
                                        )}
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{alert.impact}</Badge></TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{alert.time}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
