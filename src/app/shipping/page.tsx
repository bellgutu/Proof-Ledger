
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileUp, MapPin, Anchor, AlertTriangle, Send, MoreVertical, PlusCircle, ArrowRight, Bot } from "lucide-react";

const exceptionQueue = [
    { id: 'SH-734-556', issue: "Tamper Alert Triggered", priority: "Critical", status: "Action Required" },
    { id: 'SH-456-881', issue: "FOB Verification Delayed", priority: "High", status: "Awaiting Agent" },
    { id: 'SH-992-109', issue: "CIF Documents Missing", priority: "High", status: "Awaiting Docs" },
    { id: 'SH-101-322', issue: "Temp. out of range", priority: "Medium", status: "Monitoring" },
];

export default function ShippingPage() {
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
              <CardTitle>Real-Time Delay & Exception Queue</CardTitle>
              <CardDescription>Prioritized list of shipments requiring attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptionQueue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell>{item.issue}</TableCell>
                      <TableCell>
                        <Badge variant={item.priority === 'Critical' ? 'destructive' : item.priority === 'High' ? 'secondary' : 'outline'}>{item.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Multi-Party Audit Trail</CardTitle>
              <CardDescription>Shipment SH-734-556: Communication & Event Log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="pr-4 h-[200px] overflow-y-auto space-y-4">
                    <div className="flex gap-3">
                        <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center shrink-0"><Bot size={16}/></div>
                        <div>
                            <p className="font-semibold text-sm">System Alert</p>
                            <div className="text-sm bg-secondary/50 p-3 rounded-lg mt-1">
                                <p><span className="text-red-400 font-bold">CRITICAL:</span> Tamper sensor triggered on Asset ID #AS-9011. Possible container breach.</p>
                                <p className="text-xs text-muted-foreground mt-1">TX: 0xfa...b1 - On-Chain Event Logged</p>
                            </div>
                        </div>
                    </div>
                     <div className="flex gap-3">
                        <div className="bg-secondary rounded-full h-8 w-8 flex items-center justify-center shrink-0"><span>LK</span></div>
                        <div>
                            <p className="font-semibold text-sm">Logistics Mgr.</p>
                            <div className="text-sm bg-secondary/50 p-3 rounded-lg mt-1">
                                <p>@Customs Broker - please be advised. We have a tamper alert. Stand by for instructions.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t">
                    <Input placeholder="Type your message..." />
                    <Button><Send className="h-4 w-4"/></Button>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    