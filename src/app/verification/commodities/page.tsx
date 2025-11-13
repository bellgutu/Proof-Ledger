
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sprout, FileJson, PackageCheck, Ship, Loader2, AlertCircle, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

type ShipmentStatus = "Delivered" | "In Transit" | "At Port";

interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  date: string;
  details: {
      originScan: boolean;
      inTransit: boolean;
      destinationScan: boolean;
  };
}

const initialShipments: Shipment[] = [
  { id: "SHIP-C55A1", origin: "Colombia", destination: "Port of Hamburg", status: "Delivered", date: "2024-07-12", details: { originScan: true, inTransit: true, destinationScan: true } },
  { id: "SHIP-B34D9", origin: "Ghana", destination: "Port of Amsterdam", status: "In Transit", date: "2024-07-19", details: { originScan: true, inTransit: true, destinationScan: false } },
  { id: "SHIP-F98E2", origin: "Vietnam", destination: "Port of Los Angeles", status: "Delivered", date: "2024-07-08", details: { originScan: true, inTransit: true, destinationScan: true } },
];

const origins = ["Colombia", "Ghana", "Vietnam", "Brazil", "Kenya"];
const destinations = ["Port of Hamburg", "Port of Amsterdam", "Port of Los Angeles", "Port of Shanghai", "Port of Singapore"];

const StatusIcon = ({ status }: { status: boolean }) => {
    if (status) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
};


export default function CommoditiesPage() {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [inputValue, setInputValue] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const handleTrackShipment = () => {
    if (!inputValue.trim()) return;

    const newShipment: Shipment = {
      id: inputValue.toUpperCase(),
      origin: origins[Math.floor(Math.random() * origins.length)],
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      status: "At Port",
      date: new Date().toISOString().split('T')[0],
      details: { originScan: true, inTransit: false, destinationScan: false }
    };

    setShipments(prev => [newShipment, ...prev]);
    setInputValue('');

    setTimeout(() => {
      setShipments(prev =>
        prev.map(shipment =>
          shipment.id === newShipment.id ? { ...shipment, status: "In Transit", details: {...shipment.details, inTransit: true} } : shipment
        )
      );
    }, 2500);

     setTimeout(() => {
      setShipments(prev =>
        prev.map(shipment =>
          shipment.id === newShipment.id ? { ...shipment, status: "Delivered", details: {...shipment.details, destinationScan: true} } : shipment
        )
      );
    }, 5000);
  };

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
          <Input 
            placeholder="Enter shipment identifier (e.g., SHIP-GHI789)..." 
            className="max-w-lg" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button onClick={handleTrackShipment}>Track Shipment</Button>
        </CardContent>
      </Card>

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
              {shipments.map((item) => (
                <TableRow key={item.id} onClick={() => setSelectedShipment(item)} className="cursor-pointer">
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.origin}</TableCell>
                  <TableCell>{item.destination}</TableCell>
                  <TableCell>
                     <Badge 
                      variant={
                        item.status === 'Delivered' ? 'default' 
                        : item.status === 'In Transit' ? 'secondary' 
                        : 'outline'
                      }
                    >
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

      {selectedShipment && (
         <Dialog open={!!selectedShipment} onOpenChange={(isOpen) => !isOpen && setSelectedShipment(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Shipment Status: {selectedShipment.id}
              </DialogTitle>
              <DialogDescription>
                {selectedShipment.origin} to {selectedShipment.destination}
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PackageCheck className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Scanned at Origin</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusIcon status={selectedShipment.details.originScan} />
                        <span className="text-sm">{selectedShipment.details.originScan ? 'Complete' : 'Pending'}</span>
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">In Transit</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <StatusIcon status={selectedShipment.details.inTransit} />
                        <span className="text-sm">{selectedShipment.details.inTransit ? 'Complete' : 'Pending'}</span>
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Ship className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Scanned at Destination</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <StatusIcon status={selectedShipment.details.destinationScan} />
                        <span className="text-sm">{selectedShipment.details.destinationScan ? 'Complete' : 'Pending'}</span>
                    </div>
                </div>
            </div>
            <Separator />
             <div className="text-center text-sm text-muted-foreground pt-2">
                Overall Status: 
                 <Badge 
                    variant={
                    selectedShipment.status === 'Delivered' ? 'default' 
                    : selectedShipment.status === 'In Transit' ? 'secondary' 
                    : 'outline'
                    }
                    className="ml-2"
                >
                    {selectedShipment.status}
                </Badge>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
