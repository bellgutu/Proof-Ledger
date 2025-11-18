
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Landmark, FileHeart, AlertCircle, CheckCircle, Clock, MoreVertical, DollarSign, FileText, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const claims = [
    { id: "CLAIM-001", asset: "SH-734-556", trigger: "Auto (Sensor Breach)", value: "250,000", status: "Payout Approved" },
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
  const [selectedClaim, setSelectedClaim] = useState<(typeof claims[0]) | null>(claims[0]);

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
                    <CardTitle>Automated Claims Center</CardTitle>
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
                            <TableRow key={claim.id} onClick={() => setSelectedClaim(claim)} className={cn("cursor-pointer", selectedClaim?.id === claim.id && "bg-secondary/80")}>
                                <TableCell>
                                    <Badge 
                                        variant={claim.status === 'Payout Approved' ? 'default' : claim.status === 'Disputed' ? 'destructive' : 'secondary'}
                                        className={cn(
                                            claim.status === 'Payout Approved' && 'bg-green-600/20 text-green-300 border-green-500/30',
                                            claim.status === 'Disputed' && 'bg-red-600/20 text-red-300 border-red-500/30'
                                        )}
                                    >
                                        {claim.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{claim.id}</TableCell>
                                <TableCell>
                                     <span className="flex items-center gap-1 text-sm">
                                        {claim.trigger.startsWith("Auto") && <CheckCircle className="h-4 w-4 text-green-400" />}
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
            {selectedClaim?.status === "Disputed" && (
            <Card>
                <CardHeader>
                    <CardTitle>Dispute Details: {selectedClaim.id}</CardTitle>
                    <CardDescription>Parametric claim trigger data and evidence review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                        <h4 className="font-semibold flex items-center"><AlertCircle className="h-5 w-5 mr-2 text-red-400"/>Parametric Claim Trigger</h4>
                        <p className="text-sm">Claim was auto-filed because a contractual condition, attested to by a trusted Oracle, was breached.</p>
                        <div className="p-3 bg-secondary rounded-md text-sm">
                            <p><span className="font-semibold">Asset ID:</span> <span className="font-mono text-xs">{selectedClaim.asset}</span></p>
                            <p><span className="font-semibold">Trigger Condition:</span> <span className="text-red-400">Tamper sensor data was not `0` for > 5 minutes.</span></p>
                            <p><span className="font-semibold">Oracle Attestation Hash:</span> <span className="font-mono text-xs">0x...c4d5</span></p>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold flex items-center"><FileText className="h-5 w-5 mr-2"/>Evidence Locker</h4>
                         <div className="grid grid-cols-2 gap-2 text-sm">
                            <Button variant="outline" size="sm">VSS (Before)</Button>
                            <Button variant="outline" size="sm">VSS (After)</Button>
                            <Button variant="outline" size="sm" className="col-span-2">Full Oracle Data Log</Button>
                         </div>
                    </div>
                </CardContent>
            </Card>
            )}

            {selectedClaim?.status === "Payout Approved" && (
            <Card>
                <CardHeader>
                    <CardTitle>Payout Details: {selectedClaim.id}</CardTitle>
                    <CardDescription>Details of the automated claim payout transaction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2">
                        <h4 className="font-semibold flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-400"/>Automated Payout Executed</h4>
                        <p className="text-sm">This claim was automatically approved and paid from the escrow contract based on verified Oracle data.</p>
                        <div className="p-3 bg-secondary rounded-md text-sm">
                            <p><span className="font-semibold">Payout Amount:</span> <span className="font-mono text-xs">${selectedClaim.value}</span></p>
                            <p><span className="font-semibold">Recipient Address:</span> <span className="font-mono text-xs">0xAb...89</span></p>
                            <p><span className="font-semibold">Transaction Hash:</span> <span className="font-mono text-xs">0x1a...2b</span></p>
                        </div>
                    </div>
                     <Link href="https://sepolia.etherscan.io/" target="_blank" className="w-full">
                        <Button variant="secondary" className="w-full">
                            <ExternalLink className="mr-2 h-4 w-4"/> View on Etherscan
                        </Button>
                     </Link>
                </CardContent>
            </Card>
            )}

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
