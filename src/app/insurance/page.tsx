
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Landmark, FileCheck, FileHeart, Link as LinkIcon, AlertCircle, CheckCircle, Clock, MoreVertical, Search, ArrowRight, Shield, DollarSign, Database } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const claims = [
    { id: "CLAIM-001", asset: "SH-734-556", trigger: "Auto (Sensor)", value: "250,000", status: "Payout Approved" },
    { id: "CLAIM-002", asset: "SH-101-322", trigger: "Manual", value: "15,000", status: "Pending Verification" },
    { id: "CLAIM-003", asset: "AG-098-421", trigger: "Auto (QC Fail)", value: "50,000", status: "Payout Approved" },
    { id: "CLAIM-004", asset: "LX-555-901", trigger: "Manual", value: "1,200,000", status: "Disputed" },
];

const payoutLog = [
    { tx: "0x1a...2b", claim: "CLAIM-001", amount: "$250,000", time: "2m ago" },
    { tx: "0x3c...4d", claim: "CLAIM-003", amount: "$50,000", time: "8m ago" },
    { tx: "0x5e...6f", finance: "FIN-012", amount: "$1.2M", time: "1h ago" },
]

export default function InsurancePage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Insurance & Financial Services Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Automate claims, bind policies to verifiable asset states, and facilitate instant, trustless supply chain financing.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Policy Binding & Escrow</CardTitle>
                    <CardDescription>Connect an asset to an insurance policy and fund the claim escrow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="assetId">Asset/Shipment ID</Label>
                        <Input id="assetId" placeholder="e.g., SH-734-556" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="policyId">Insurance Policy ID</Label>
                        <Input id="policyId" placeholder="e.g., POL-XYZ-9988" />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-grow space-y-2">
                            <Label htmlFor="insuredValue">Total Insured Value ($)</Label>
                            <Input id="insuredValue" type="number" placeholder="250000" />
                        </div>
                        <Button>
                            <FileHeart className="mr-2 h-4 w-4" /> Bind Policy
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 pt-4 border-t">
                    <p className="text-sm font-semibold">Escrow Status: <span className="text-yellow-400">Funding Required</span></p>
                    <div className="w-full space-y-1">
                        <Label className="text-xs text-muted-foreground">Funds Locked: $0 / $250,000</Label>
                        <Progress value={0} />
                    </div>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Supply Chain Financing Portal</CardTitle>
                    <CardDescription>Access instant liquidity against verified assets and receivables.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-secondary/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Collateral Score</p>
                            <p className="text-2xl font-bold text-green-400">95/100</p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Liquidity Pool</p>
                            <p className="text-2xl font-bold">$150.5M</p>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="loanAmount">Borrow Amount ($)</Label>
                        <Input id="loanAmount" type="number" placeholder="50000" />
                    </div>
                    <Button className="w-full">
                        <Landmark className="mr-2 h-4 w-4" /> Request Instant Payout
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Automated Claims Trigger</CardTitle>
                    <CardDescription>Dashboard showing all active insurance claims.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Claim ID</TableHead>
                            <TableHead>Trigger</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {claims.map((claim) => (
                            <TableRow key={claim.id}>
                                <TableCell>
                                    <Badge 
                                        variant={claim.status === 'Payout Approved' ? 'default' : claim.status === 'Disputed' ? 'destructive' : 'secondary'}
                                        className={claim.status === 'Payout Approved' ? 'bg-green-600/20 text-green-300 border-green-500/30' : ''}
                                    >
                                        {claim.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{claim.id}</TableCell>
                                <TableCell>
                                     <span className="flex items-center gap-1 text-sm">
                                        {claim.trigger === "Auto (Sensor)" && <CheckCircle className="h-4 w-4 text-green-400" />}
                                        {claim.trigger === "Manual" && <Clock className="h-4 w-4 text-yellow-400" />}
                                        {claim.trigger}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payout & Reconciliation Log</CardTitle>
                    <CardDescription>Human-readable log of financial transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Details</TableHead><TableHead className="text-right">Timestamp</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {payoutLog.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <p className="font-medium">{(item.claim ? `Claim ${item.claim}` : `Financing ${item.finance}`)} Payout - {item.amount}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{item.tx}</p>
                                    </TableCell>
                                    <TableCell className="text-right">{item.time}</TableCell>
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
