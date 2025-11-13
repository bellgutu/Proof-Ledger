
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Anchor, ArrowDown, CheckCircle, Globe, Shield, Users, Zap } from "lucide-react";
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
    { id: "SH-456-881", issue: "FOB Verification Delayed", priority: "High" },
    { id: "SH-992-109", issue: "CIF Documents Missing", priority: "High" },
    { id: "SH-734-556", issue: "Tamper Alert Triggered", priority: "Critical" },
    { id: "SH-101-322", issue: "Temp. out of range", priority: "Medium" },
]


export default function CommandCenterPage() {

  return (
    <div className="container mx-auto p-0 space-y-6">
      
      {/* A. Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overall Risk Grade</CardTitle>
                <Shield size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-5xl font-bold text-green-400">A-</div>
                <p className="text-xs text-muted-foreground pt-1">Excellent standing, minimal exceptions</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Financial Impact (YTD)</CardTitle>
                <Zap size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">$1.2M</div>
                <p className="text-xs text-muted-foreground pt-1">Savings from reduced claims & disputes</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Verification Success</CardTitle>
                <CheckCircle size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground pt-1">Across all automated checks</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Immutability Score (24h)</CardTitle>
                <Anchor size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">1,492</div>
                <p className="text-xs text-muted-foreground pt-1">Critical events recorded on-chain</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* B. Real-Time Operations */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe size={20} /> Real-Time Operations</CardTitle>
                <CardDescription>Live status of all active shipments and assets.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <Image src="https://picsum.photos/seed/map/1200/600" alt="World Map" layout="fill" objectFit="cover" className="opacity-30" />
                    <div className="absolute top-[30%] left-[20%] w-3 h-3 bg-green-500 rounded-full animate-pulse-strong" title="Shipment On-time"></div>
                    <div className="absolute top-[50%] left-[55%] w-4 h-4 bg-yellow-400 rounded-full animate-pulse-strong" title="Shipment At-Risk"></div>
                    <div className="absolute top-[60%] left-[80%] w-4 h-4 bg-red-500 rounded-full animate-pulse-strong" title="Shipment Critical Alert"></div>
                    <div className="absolute top-[25%] left-[70%] w-3 h-3 bg-green-500 rounded-full animate-pulse-strong" title="Shipment On-time"></div>
                    <div className="absolute top-[70%] left-[30%] w-3 h-3 bg-green-500 rounded-full animate-pulse-strong" title="Shipment On-time"></div>
                    <div className="absolute top-[45%] left-[40%] w-3 h-3 bg-green-500 rounded-full animate-pulse-strong" title="Shipment On-time"></div>
                     <div className="absolute flex items-center gap-4 text-sm text-foreground/80 bottom-4 right-4 bg-background/50 backdrop-blur-sm p-2 rounded-md border">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> On-Time</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> At Risk</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Critical</div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* CIF/FOB Exception List */}
        <Card>
            <CardHeader>
                <CardTitle  className="flex items-center gap-2"><AlertCircle size={20} />Shipment Exceptions</CardTitle>
                <CardDescription>Top 5 shipments requiring immediate attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shipmentExceptions.map(shipment => (
                            <TableRow key={shipment.id}>
                                <TableCell className="font-mono text-xs">{shipment.id}</TableCell>
                                <TableCell>{shipment.issue}</TableCell>
                                <TableCell>
                                     <Badge variant={shipment.priority === 'Critical' ? 'destructive' : shipment.priority === 'High' ? 'secondary' : 'outline'}>{shipment.priority}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* C. Financial/Risk Triage */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap size={20}/> Financial Triage</CardTitle>
                <CardDescription>Automated claims processing and financial risk overview.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Automated Claims Funnel</h3>
                    <div className="flex items-center justify-between space-x-2 text-sm">
                        <div className="flex flex-col items-center space-y-1">
                            <div className="p-2 bg-secondary rounded-full"><ArrowDown size={16}/></div>
                            <span className="font-bold">18</span>
                            <span className="text-xs text-muted-foreground">Filed</span>
                        </div>
                        <Progress value={66} className="flex-1 mt-[-24px]" />
                        <div className="flex flex-col items-center space-y-1">
                            <div className="p-2 bg-secondary rounded-full"><CheckCircle size={16}/></div>
                            <span className="font-bold">12</span>
                            <span className="text-xs text-muted-foreground">Verified</span>
                        </div>
                        <Progress value={33} className="flex-1 mt-[-24px]" />
                        <div className="flex flex-col items-center space-y-1">
                            <div className="p-2 bg-secondary rounded-full"><CheckCircle size={16} className="text-green-500" /></div>
                            <span className="font-bold">4</span>
                            <span className="text-xs text-muted-foreground">Approved</span>
                        </div>
                    </div>
                </div>
                 <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-lg">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Insured Value</p>
                        <p className="text-2xl font-bold">$450M</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Open Risk Value</p>
                        <p className="text-2xl font-bold text-yellow-400">$12.5M</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* D. Compliance & Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users size={20} /> Compliance & Audit</CardTitle>
            <CardDescription>
              KYC/AML status and overall regulatory adherence.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {kycStatusData.map(item => (
                    <TableRow key={item.partner}>
                        <TableCell className="font-medium">{item.partner}</TableCell>
                        <TableCell>{item.entity}</TableCell>
                        <TableCell>
                            <Badge 
                                variant={item.status === 'Verified' ? 'default' : item.status === 'Pending' ? 'secondary' : 'destructive'}
                                className={item.status === 'Verified' ? 'bg-green-600/20 text-green-300 border-green-500/30' : ''}
                            >
                                <div className={cn(
                                    "w-2 h-2 rounded-full mr-2",
                                    item.status === 'Verified' && 'bg-green-400',
                                    item.status === 'Pending' && 'bg-yellow-400',
                                    item.status === 'Restricted' && 'bg-red-400',
                                )}></div>
                                {item.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
