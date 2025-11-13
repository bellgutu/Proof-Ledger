
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Link as LinkIcon, Thermometer, Shield, Droplets, MapPin, HardHat, FileUp, User, MoreVertical, Search, ArrowRight, Activity, History, Users } from "lucide-react";

const verificationHistory = [
  { event: "Asset Minted", user: "Admin", tx: "0x12..ab", time: "2h ago", onChain: true },
  { event: "QC Check Passed", user: "InspectorBot", tx: "0x34..cd", time: "1h ago", onChain: true },
  { event: "Insurance Bound", user: "Finance Dept.", tx: "0x56..ef", time: "1h ago", onChain: true },
  { event: "Ownership Transfer", user: "Admin", tx: "0x78..gh", time: "30m ago", onChain: false },
];

export default function AssetVerificationPage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Asset Verification Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Establish the immutable, verifiable digital twin of a physical asset, tracking its condition and ownership from creation to disposal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Asset Creation */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Create / Mint Asset</CardTitle>
              <CardDescription>Mint a new digital twin for a physical asset.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Select>
                  <SelectTrigger id="assetType">
                    <SelectValue placeholder="Select asset type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commodity">Commodity</SelectItem>
                    <SelectItem value="luxury">Luxury Good</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchId">Batch/Serial ID</Label>
                <Input id="batchId" placeholder="e.g., COFFEE-B7-2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qcScore">Initial QC Score</Label>
                <Input id="qcScore" type="number" placeholder="1-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="docs">Upload Documents/Images</Label>
                <Button variant="outline" className="w-full">
                  <FileUp className="mr-2 h-4 w-4" /> Upload Files
                </Button>
              </div>
              <Button className="w-full">
                <HardHat className="mr-2 h-4 w-4" /> Mint Asset
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ownership Management</CardTitle>
              <CardDescription>Transfer asset ownership securely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Wallet Address</Label>
                <Input id="recipient" placeholder="0x..." />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="kycCheck" checked disabled />
                <label htmlFor="kycCheck" className="text-sm text-muted-foreground">Recipient KYC Verified</label>
              </div>
              <Button className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" /> Transfer Ownership
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Data and History */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Real-Time Sensor Data</span>
                <Badge variant="secondary">Trust Score: 98%</Badge>
              </CardTitle>
              <CardDescription>Live data from IoT devices tagged to the selected asset.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <Thermometer className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">20.5°C</p>
                <p className="text-sm text-muted-foreground">Temperature</p>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <Droplets className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">65%</p>
                <p className="text-sm text-muted-foreground">Humidity</p>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <Activity className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">0.1g</p>
                <p className="text-sm text-muted-foreground">Shock/Vibration</p>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <MapPin className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-lg font-bold">Port of LA</p>
                <p className="text-sm text-muted-foreground">Location</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Verification History Log</CardTitle>
              <CardDescription>Immutable ledger of the asset's lifecycle events.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User/Actor</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">On-Chain</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verificationHistory.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.event}</TableCell>
                      <TableCell>{item.user}</TableCell>
                      <TableCell>{item.time}</TableCell>
                      <TableCell className="text-right">
                        {item.onChain ? (
                           <Button variant="ghost" size="sm">
                             <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Verify
                           </Button>
                        ) : (
                           <Badge variant="outline">Off-Chain</Badge>
                        )}
                      </TableCell>
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

// Dummy checkbox for ownership management section
const Checkbox = ({ id, ...props }: React.ComponentProps<'input'>) => (
  <input type="checkbox" id={id} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" {...props} />
);
