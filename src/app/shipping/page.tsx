
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileUp, MapPin, Anchor, AlertTriangle, Send, MoreVertical, PlusCircle, ArrowRight, Bot, GitCommit, Check, X, FileText, Gavel } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const exceptionQueue = [
    { id: 'SH-734-556', issue: "Tamper Alert Triggered", priority: "Critical", status: "Action Required" },
    { id: 'SH-456-881', issue: "FOB Verification Delayed", priority: "High", status: "Awaiting Agent" },
    { id: 'SH-992-109', issue: "CIF Documents Missing", priority: "High", status: "Awaiting Docs" },
    { id: 'SH-101-322', issue: "Temp. out of range", priority: "Medium", status: "Monitoring" },
];

export default function ShippingPage() {
  const [selectedException, setSelectedException] = useState<(typeof exceptionQueue[0]) | null>(exceptionQueue[0]);

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Shipping & Logistics Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          A single source of truth for transit, ensuring verifiable contract execution (FOB/CIF) and mitigating dispute risk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Workflow Creator</CardTitle>
              <CardDescription>Define a Smart Contract workflow for a new shipment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Milestone 1: FOB Verification</Label>
                <Input defaultValue="Port of Origin, Agent Signature" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Milestone 2: Customs Clearance</Label>
                <Input defaultValue="Destination Port, Document Scan" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Milestone 3: Final Delivery</Label>
                <Input placeholder="Add final milestone..." />
              </div>
              <Button variant="outline" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Milestone
              </Button>
            </CardContent>
            <CardFooter>
                <Button className="w-full">
                    <ArrowRight className="mr-2 h-4 w-4" /> Deploy Shipment Contract
                </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>FOB/CIF Verification Portal</CardTitle>
              <CardDescription>Interface for on-site agents to verify transfers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 flex items-center gap-4">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-bold">Location Stamp</p>
                        <p className="text-sm text-muted-foreground">Long Beach, CA (Verified)</p>
                    </div>
                </div>
                 <Button variant="outline" className="w-full">
                  <FileUp className="mr-2 h-4 w-4" /> Upload Photo/Video Evidence
                </Button>
                 <Button className="w-full">
                    <Anchor className="mr-2 h-4 w-4" /> Sign & Verify Transfer
                </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Exception & Dispute Queue</CardTitle>
              <CardDescription>Shipments requiring attention or active dispute resolution.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptionQueue.map((item) => (
                    <TableRow key={item.id} onClick={() => setSelectedException(item)} className={cn("cursor-pointer", selectedException?.id === item.id && "bg-secondary/80")}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell>{item.issue}</TableCell>
                      <TableCell>
                        <Badge variant={item.priority === 'Critical' ? 'destructive' : item.priority === 'High' ? 'secondary' : 'outline'}>{item.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

           {selectedException && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Dispute Resolution: {selectedException.id}</CardTitle>
                            <CardDescription>Comparing "Before & After" snapshots to isolate liability.</CardDescription>
                        </div>
                        <Badge variant="destructive" className="ml-4"><Gavel className="h-4 w-4 mr-2" /> Dispute Active</Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Snapshot */}
                    <div className="space-y-3 p-4 bg-secondary/50 rounded-lg border">
                        <h4 className="font-semibold text-base flex items-center"><Check className="h-5 w-5 mr-2 text-green-400"/>Stage 1: Pre-Transit VSS (Verified Status Snapshot)</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-medium">Condition: A (Pristine)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">QC Hash</span>
                            <span className="font-mono text-xs">0x...a1b2</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location</span>
                            <span className="font-medium">Port of Shanghai</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t">
                             <span className="text-muted-foreground">Visuals</span>
                             <Button variant="ghost" size="sm"><FileText className="h-4 w-4 mr-1"/> View Hashed Photos</Button>
                        </div>
                    </div>
                    {/* After Snapshot */}
                     <div className="space-y-3 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                        <h4 className="font-semibold text-base flex items-center"><X className="h-5 w-5 mr-2 text-red-400"/>Stage 3: Post-Damage VSS (Discrepancy Report)</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-medium text-red-400">Condition: Damaged</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">QC Hash</span>
                            <span className="font-mono text-xs">0x...f8c9</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location</span>
                            <span className="font-medium">Port of Long Beach</span>
                        </div>
                         <div className="flex justify-between items-center text-sm pt-2 border-t border-destructive/30">
                             <span className="text-muted-foreground">Evidence</span>
                             <Button variant="ghost" size="sm"><FileText className="h-4 w-4 mr-1"/> View Damage Photos</Button>
                        </div>
                    </div>
                    {/* Trigger */}
                    <div className="md:col-span-2 p-4 bg-secondary rounded-lg text-center">
                        <h4 className="font-semibold text-base flex items-center justify-center"><AlertTriangle className="h-5 w-5 mr-2 text-yellow-400"/>Stage 2: Event Trigger</h4>
                        <p className="text-sm mt-1">
                            <span className="text-yellow-400 font-bold">EVENT: </span>  
                            {selectedException.issue} at {new Date().toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Oracle data attests a container breach occurred while asset was in-transit.</p>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button variant="secondary" className="w-full"><FileUp className="mr-2 h-4 w-4" /> Upload Additional Evidence</Button>
                    <Button className="w-full"><Gavel className="mr-2 h-4 w-4" /> Submit to Arbitrator</Button>
                </CardFooter>
            </Card>
           )}
        </div>
      </div>
    </div>
  );
}
