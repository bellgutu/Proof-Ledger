
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreVertical, Download, Shield, Database } from "lucide-react";
import { cn } from "@/lib/utils";


const partners = [
    { name: "Global Shipping Co.", status: "Verified" },
    { name: "Precious Gems Inc.", status: "Verified" },
    { name: "AgriSource", status: "Pending" },
    { name: "Financier Alliance", status: "Verified" },
    { name: "PropertyVerifier", status: "Revoked" },
];

export default function CompliancePage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Compliance & Governance Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Manage actor identities, provide irrefutable proof of compliance, and control user access across the platform.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>KYC/AML Partner Onboarding</CardTitle>
                    <CardDescription>Manage and verify the compliance status of all business partners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <Input placeholder="Search partner..." />
                        <Button variant="outline">Search</Button>
                        <Button><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partner</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partners.map(p => (
                                <TableRow key={p.name}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge 
                                            variant={p.status === 'Verified' ? 'default' : p.status === 'Pending' ? 'secondary' : 'destructive'}
                                            className={cn(
                                                p.status === 'Verified' && 'bg-green-600/20 text-green-300 border-green-500/30'
                                            )}
                                        >
                                             <div className={cn(
                                                "w-2 h-2 rounded-full mr-2",
                                                p.status === 'Verified' && 'bg-green-400',
                                                p.status === 'Pending' && 'bg-yellow-400',
                                                p.status === 'Revoked' && 'bg-red-400',
                                            )}></div>
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
                    <CardDescription>Manage granular user permissions for platform actions.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Logistics Agent</TableCell>
                                <TableCell className="text-xs text-muted-foreground">Mint Asset, Verify FOB/CIF</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Finance Manager</TableCell>
                                <TableCell className="text-xs text-muted-foreground">Bind Policy, Approve Claim</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Executive</TableCell>
                                <TableCell className="text-xs text-muted-foreground">Read-only</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
            <Card>
                 <CardHeader>
                    <CardTitle>Regulatory Audit Trail Generator</CardTitle>
                    <CardDescription>Generate time-stamped compliance reports.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <label htmlFor="reportType" className="text-sm font-medium">Report Type</label>
                        <select id="reportType" className="w-full p-2 border rounded-md bg-transparent text-sm">
                            <option>Full Compliance Report</option>
                            <option>Customs Declaration</option>
                            <option>Tax Reporting</option>
                        </select>
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="dateRange" className="text-sm font-medium">Date Range</label>
                        <Input type="date" id="dateRange" />
                    </div>
                    <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Generate Report
                    </Button>
                </CardContent>
            </Card>
             <Card>
                 <CardHeader>
                    <CardTitle>System Health & Oracle Status</CardTitle>
                    <CardDescription>Live monitor of the platform's core dependencies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <span className="font-medium">Smart Contract Gas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">2.5 ETH</span>
                            <Badge className="bg-green-600/20 text-green-300">Healthy</Badge>
                        </div>
                    </div>
                     <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-primary" />
                            <span className="font-medium">Oracle Data Feed</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="font-mono text-sm">21ms Latency</span>
                            <Badge className="bg-green-600/20 text-green-300">Online</Badge>
                        </div>
                    </div>
                    <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">Oracle Attestation Log</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-mono">✅ Attested batch #8871 (3.1s ago)</p>
                            <p className="font-mono">✅ Attested batch #8870 (1m ago)</p>
                            <p className="font-mono">✅ Attested batch #8869 (2m ago)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    