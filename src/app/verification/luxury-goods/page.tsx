
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Gem, FileText, History, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

type VerificationStatus = "Verified" | "In Review" | "Pending";

interface VerifiedItem {
  id: string;
  item: string;
  status: VerificationStatus;
  date: string;
  details: {
    certification: boolean;
    provenance: boolean;
  }
}

const initialItems: VerifiedItem[] = [
  { id: "GIA-22078", item: "3.02ct Diamond", status: "Verified", date: "2024-07-17", details: { certification: true, provenance: true } },
  { id: "PATEK-5711", item: "Patek Philippe Nautilus", status: "Verified", date: "2024-07-16", details: { certification: true, provenance: true } },
  { id: "ART-004B", item: "Warhol Screenprint", status: "In Review", date: "2024-07-19", details: { certification: true, provenance: false } },
];

const itemTypes = ["Emerald Necklace", "Rolex Submariner", "Van Cleef Bracelet", "Sapphire Ring", "Picasso Lithograph"];

const StatusIcon = ({ status }: { status: boolean }) => {
    if (status) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
};


export default function LuxuryGoodsPage() {
  const [items, setItems] = useState<VerifiedItem[]>(initialItems);
  const [inputValue, setInputValue] = useState('');
  const [selectedItem, setSelectedItem] = useState<VerifiedItem | null>(null);

  const handleVerifyAsset = () => {
    if (!inputValue.trim()) return;

    const newItem: VerifiedItem = {
      id: inputValue.toUpperCase(),
      item: itemTypes[Math.floor(Math.random() * itemTypes.length)],
      status: "In Review",
      date: new Date().toISOString().split('T')[0],
      details: { certification: true, provenance: false },
    };

    setItems(prev => [newItem, ...prev]);
    setInputValue('');

    setTimeout(() => {
      setItems(prev =>
        prev.map(item =>
          item.id === newItem.id ? { ...item, status: "Verified", details: { certification: true, provenance: true } } : item
        )
      );
    }, 3500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gem className="h-8 w-8 text-primary" />
            Luxury Goods Verification
          </h1>
          <p className="text-muted-foreground">Verify provenance, certification, and ownership of high-value assets.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify New Asset</CardTitle>
          <CardDescription>Enter a serial number or certification ID to begin.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input 
            placeholder="Enter asset identifier (e.g., GIA-XYZ123)..." 
            className="max-w-lg" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button onClick={handleVerifyAsset}>Verify Asset</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Verified Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset ID</TableHead>
                <TableHead>Item Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'Verified' ? 'default' : 'secondary'}>
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

      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Asset Status: {selectedItem.id}
              </DialogTitle>
              <DialogDescription>
                {selectedItem.item}
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Certification Check</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusIcon status={selectedItem.details.certification} />
                        <span className="text-sm">{selectedItem.details.certification ? 'Verified' : 'In Review'}</span>
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Provenance History</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <StatusIcon status={selectedItem.details.provenance} />
                        <span className="text-sm">{selectedItem.details.provenance ? 'Verified' : 'In Review'}</span>
                    </div>
                </div>
            </div>
            <Separator />
             <div className="text-center text-sm text-muted-foreground pt-2">
                Overall Status: 
                <Badge variant={selectedItem.status === 'Verified' ? 'default' : 'secondary'} className="ml-2">
                    {selectedItem.status}
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
