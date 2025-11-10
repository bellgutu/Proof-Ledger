
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sprout, FileJson, PackageCheck } from "lucide-react";

const recentShipments = [
  { id: "SHIP-C55A1", origin: "Colombia", destination: "Port of Hamburg", status: "Delivered", date: "2024-07-12" },
  { id: "SHIP-B34D9", origin: "Ghana", destination: "Port of Amsterdam", status: "In Transit", date: "2024-07-19" },
  { id: "SHIP-F98E2", origin: "Vietnam", destination: "Port of Los Angeles", status: "Delivered", date: "2024-07-08" },
];

export default function CommoditiesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sprout className="h-8 w-8 text-primary" />
            Commodities Verification
          </h1>
          <p className="text-muted-foreground">Track supply chain, quality, and certifications for raw materials.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track New Shipment</CardTitle>
          <CardDescription>Enter a Bill of Lading or Container ID to track a new commodity shipment.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input placeholder="Enter shipment identifier..." className="max-w-lg" />
          <Button>Track Shipment</Button>
        </CardContent>
      </Card>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quality Certificates</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
                <CheckCircle /> Verified
            </div>
            <p className="text-xs text-muted-foreground">Fair Trade & Organic Certs Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chain of Custody</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Handoffs</div>
            <p className="text-xs text-muted-foreground">Immutable log from farm to port</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracked Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment ID</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentShipments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.origin}</TableCell>
                  <TableCell>{item.destination}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'Delivered' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
