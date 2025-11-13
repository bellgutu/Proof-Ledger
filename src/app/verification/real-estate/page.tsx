
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, Home, Landmark, Scale, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

type VerificationStatus = "Verified" | "In Progress" | "Failed";

interface Verification {
  id: string;
  address: string;
  status: VerificationStatus;
  date: string;
  details?: {
    title: string;
    appraisal: string;
    zoning: string;
  };
}

const initialVerifications: Verification[] = [
  { id: "PROP-12345", address: "123 Main St, San Francisco, CA", status: "Verified", date: "2024-07-15", details: { title: "Verified", appraisal: "Verified", zoning: "Verified" } },
  { id: "PROP-67890", address: "456 Oak Ave, New York, NY", status: "In Progress", date: "2024-07-18", details: { title: "In Progress", appraisal: "Pending", zoning: "Pending" } },
  { id: "PROP-54321", address: "789 Pine Ln, Miami, FL", status: "Verified", date: "2024-07-10", details: { title: "Verified", appraisal: "Verified", zoning: "Verified" } },
  { id: "PROP-09876", address: "101 Maple Dr, Chicago, IL", status: "Failed", date: "2024-07-14", details: { title: "Verified", appraisal: "Failed", zoning: "Verified" } },
];

const addresses = [
    "21 Jump Street, Los Angeles, CA",
    "10 Downing Street, London, UK",
    "221B Baker Street, London, UK",
    "1600 Pennsylvania Ave, Washington, DC",
    "742 Evergreen Terrace, Springfield, IL"
];

const StatusIcon = ({ status }: { status: VerificationStatus }) => {
    if (status === 'Verified') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'In Progress') return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    if (status === 'Failed') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-muted-foreground" />;
};

export default function RealEstatePage() {
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications);
  const [inputValue, setInputValue] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);

  const handleVerification = () => {
    if (!inputValue.trim()) return;

    const newVerification: Verification = {
      id: inputValue.toUpperCase(),
      address: addresses[Math.floor(Math.random() * addresses.length)],
      status: "In Progress",
      date: new Date().toISOString().split('T')[0],
      details: { title: "In Progress", appraisal: "Pending", zoning: "Pending" }
    };

    setVerifications(prev => [newVerification, ...prev]);
    setInputValue('');

    setTimeout(() => {
      setVerifications(prev =>
        prev.map(v =>
          v.id === newVerification.id
            ? { ...v, details: { ...v.details!, title: "Verified", appraisal: "In Progress" } }
            : v
        )
      );
    }, 2000);

    setTimeout(() => {
        const finalStatus: VerificationStatus = Math.random() > 0.2 ? "Verified" : "Failed";
        setVerifications(prev =>
            prev.map(v =>
            v.id === newVerification.id
                ? { 
                    ...v, 
                    status: finalStatus,
                    details: {
                        title: "Verified",
                        appraisal: finalStatus === "Verified" ? "Verified" : "Failed",
                        zoning: "Verified"
                    }
                }
                : v
            )
        );
    }, 4500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Home className="h-8 w-8 text-primary" />
            Real Estate Verification
          </h1>
          <p className="text-muted-foreground">Verify property titles, valuations, and compliance data from trusted sources.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initiate New Verification</CardTitle>
          <CardDescription>Enter a property identifier (e.g., APN or Address) to begin the verification process.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input 
            placeholder="Enter property identifier (e.g., PROP-ABCDE)..." 
            className="max-w-lg"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button onClick={handleVerification}>Start Verification</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property ID</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.map((item) => (
                <TableRow key={item.id} onClick={() => setSelectedVerification(item)} className="cursor-pointer">
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'Verified' ? 'default' : item.status === 'In Progress' ? 'secondary' : 'destructive'}>
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

      {selectedVerification && (
        <Dialog open={!!selectedVerification} onOpenChange={(isOpen) => !isOpen && setSelectedVerification(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Verification Status: {selectedVerification.id}
              </DialogTitle>
              <DialogDescription>
                {selectedVerification.address}
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Title Deed Verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusIcon status={selectedVerification.details?.title as VerificationStatus ?? "In Progress"} />
                        <span className="text-sm">{selectedVerification.details?.title}</span>
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Scale className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Appraisal Value Check</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <StatusIcon status={selectedVerification.details?.appraisal as VerificationStatus ?? "In Progress"} />
                        <span className="text-sm">{selectedVerification.details?.appraisal}</span>
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Landmark className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Zoning & Compliance</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <StatusIcon status={selectedVerification.details?.zoning as VerificationStatus ?? "In Progress"} />
                        <span className="text-sm">{selectedVerification.details?.zoning}</span>
                    </div>
                </div>
            </div>
            <Separator />
             <div className="text-center text-sm text-muted-foreground pt-2">
                Overall Status: 
                <Badge variant={selectedVerification.status === 'Verified' ? 'default' : selectedVerification.status === 'In Progress' ? 'secondary' : 'destructive'} className="ml-2">
                    {selectedVerification.status}
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
