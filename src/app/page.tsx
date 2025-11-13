
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, Zap, CheckCircle, Anchor, Globe, Users, ArrowDown, Bot, Gavel } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

const systemAlerts = [
    { source: "ORACLE DOWN", message: "GIA Grading Oracle latency > 5s", impact: "Luxury Minting", time: "1m ago" },
    { source: "CONTRACT ALERT", message: "Shipment SH-734-556 triggered Parametric Claim", impact: "Insurance", time: "5m ago" },
    { source: "COMPLIANCE", message: "New high-risk partner pending KYC approval", impact: "Onboarding", time: "2h ago" },
]


export default function CommandCenterPage() {

  return (
    <div className="container mx-auto p-0 space-y-6">
      <div className="text-left">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Enterprise Command Center</h1>
        <p className="text-lg text-muted-foreground">Risk & Financial Triage Dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === WIDGET 1: RISK MITIGATION SCORECARD === */}
        <Card className="lg:col-span-1 border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400"><Shield size={20} /> Risk Mitigation Scorecard</CardTitle>
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
                <CardTitle className="flex items-center gap-2"><Zap size={20}/> Financial & Liquidity Snapshot</CardTitle>
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

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* === WIDGET 3: ACTIVE SHIPMENTS === */}
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe size={20} /> Active Shipments & Trust Map</CardTitle>
                <CardDescription>Real-time operational status of all active smart contracts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/50">
                        <p className="text-sm text-muted-foreground">Shipments In Transit</p>
                        <p className="text-4xl font-bold">142</p>
                    </div>
                    <div className="sm:col-span-2 p-4 rounded-lg bg-secondary/50 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Verification Status Breakdown</p>
                        <div className="flex items-center gap-2">
                            <div className="w-[45%] h-3 rounded-l-full bg-green-500" title="FOB Verified"></div>
                            <div className="w-[35%] h-3 bg-blue-500" title="In-Transit"></div>
                            <div className="w-[15%] h-3 bg-yellow-500" title="Customs Pending"></div>
                            <div className="w-[5%] h-3 rounded-r-full bg-red-500" title="Delayed/Exception"></div>
                        </div>
                         <div className="flex justify-between text-xs text-muted-foreground">
                            <span>FOB Verified</span>
                            <span>Exception</span>
                         </div>
                    </div>
                </div>
                 <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <Image src="https://picsum.photos/seed/map/1200/600" alt="World Map" layout="fill" objectFit="cover" className="opacity-30" />
                    <div className="absolute top-[50%] left-[55%] w-4 h-4 bg-red-500 rounded-full animate-pulse-strong" title="SH-734-556"></div>
                    <div className="absolute top-[25%] left-[70%] w-4 h-4 bg-red-500 rounded-full animate-pulse-strong" title="SH-456-881"></div>
                    <div className="absolute top-[60%] left-[80%] w-4 h-4 bg-red-500 rounded-full animate-pulse-strong" title="SH-992-109"></div>
                    <div className="absolute flex items-center gap-4 text-sm text-foreground/80 bottom-4 right-4 bg-background/50 backdrop-blur-sm p-2 rounded-md border">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Delayed Shipments</div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
            {/* === WIDGET 4: ASSET VERIFICATION SUMMARY === */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle size={20} /> Asset Verification Summary</CardTitle>
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
