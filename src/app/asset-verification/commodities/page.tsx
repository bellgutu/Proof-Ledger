
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileUp, Wheat, Thermometer, Droplets, FlaskConical, CheckCircle, Ship, GitMerge, GitPullRequest, Search } from "lucide-react";

export default function CommoditiesPage() {
  const batches = [
    { id: 'BATCH-001A', weight: '5.0 MT', grade: 'A', parent: 'BATCH-001' },
    { id: 'BATCH-001B', weight: '15.0 MT', grade: 'A', parent: 'BATCH-001' },
  ];
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <div className="flex items-center gap-4">
            <Wheat className="h-12 w-12 text-primary" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Commodity & Agri Asset Verification
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                Track fungible goods in bulk, focusing on batch quality and supply chain conditions.
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>A. Batch & Quality Control</CardTitle>
              <CardDescription>Define the initial properties of the commodity batch.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="batchId">Batch ID</Label>
                <Input id="batchId" placeholder="e.g., COFFEE-B7-2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Volume/Weight (Metric Tons)</Label>
                <Input id="volume" type="number" placeholder="e.g., 20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qcGrade">Initial QC Grade</Label>
                <Input id="qcGrade" placeholder="A, B, or C" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="harvestDate">Expiration/Harvest Date</Label>
                <Input id="harvestDate" type="date" />
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>C. Certificate of Analysis (CoA)</CardTitle>
              <CardDescription>Upload lab results for automated data extraction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Button variant="outline" className="w-full h-12 text-base"><FileUp className="mr-2 h-5 w-5" /> Upload CoA PDF</Button>
               <div className="p-4 rounded-lg bg-secondary/50 text-sm space-y-2">
                   <p className="text-muted-foreground">AI Extractor Status: <span className="text-foreground font-medium">Ready</span></p>
                   <p className="font-mono text-xs">Awaiting document upload... will extract Protein Content, Moisture Level, etc.</p>
               </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>D. Shipping Container Binding</CardTitle>
              <CardDescription>Associate this batch with its transport containers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter Container/Vessel ID..." className="h-11" />
                <Button size="lg">Add</Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                  <Ship className="h-4 w-4 text-primary" />
                  <span>CMA-CGM-123456-7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>B. Bulk Sensor Data Logging</CardTitle>
              <CardDescription>Define and monitor critical environmental thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-secondary/50 p-4 rounded-lg">
                    <Thermometer className="mx-auto h-6 w-6 text-primary mb-2" />
                    <p className="text-lg font-bold">12.1°C</p>
                    <p className="text-xs text-muted-foreground">Temp.</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg">
                    <Droplets className="mx-auto h-6 w-6 text-primary mb-2" />
                    <p className="text-lg font-bold">78%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg">
                    <FlaskConical className="mx-auto h-6 w-6 text-primary mb-2" />
                    <p className="text-lg font-bold">0.2ppm</p>
                    <p className="text-xs text-muted-foreground">Contaminants</p>
                </div>
                <div className="col-span-1 sm:col-span-3 space-y-2 text-left">
                    <Label htmlFor="tempThreshold">Temperature Threshold (&gt; 10°C)</Label>
                    <Input id="tempThreshold" type="number" defaultValue="10" />
                </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
              <CardTitle>Fungibility Management</CardTitle>
              <CardDescription>Split or merge batches while maintaining provenance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Input readOnly defaultValue="BATCH-001" />
                    <Button variant="outline"><GitMerge className="h-4 w-4 mr-2" /> Merge</Button>
                    <Button variant="outline"><GitPullRequest className="h-4 w-4 mr-2" /> Split</Button>
                </div>
                <Table>
                    <TableHeader><TableRow><TableHead>New Batch ID</TableHead><TableHead>Weight</TableHead><TableHead>Parent</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {batches.map(b => (
                            <TableRow key={b.id}>
                                <TableCell className="font-mono text-xs">{b.id}</TableCell>
                                <TableCell>{b.weight}</TableCell>
                                <TableCell className="font-mono text-xs">{b.parent}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                 <Button className="w-full h-12 text-base">
                    <CheckCircle className="mr-2 h-5 w-5" /> Finalize & Mint Batch Assets
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

    