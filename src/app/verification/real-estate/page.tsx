
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, Home, Landmark, Scale } from "lucide-react";

const initialVerifications = [
  { id: "PROP-12345", address: "123 Main St, San Francisco, CA", status: "Verified", date: "2024-07-15" },
  { id: "PROP-67890", address: "456 Oak Ave, New York, NY", status: "In Progress", date: "2024-07-18" },
  { id: "PROP-54321", address: "789 Pine Ln, Miami, FL", status: "Verified", date: "2024-07-10" },
  { id: "PROP-09876", address: "101 Maple Dr, Chicago, IL", status: "Failed", date: "2024-07-14" },
];

const addresses = [
    "21 Jump Street, Los Angeles, CA",
    "10 Downing Street, London, UK",
    "221B Baker Street, London, UK",
    "1600 Pennsylvania Ave, Washington, DC",
    "742 Evergreen Terrace, Springfield, IL"
];

export default function RealEstatePage() {
  const [verifications, setVerifications] = useState(initialVerifications);
  const [inputValue, setInputValue] = useState('');

  const handleVerification = () => {
    if (!inputValue.trim()) return;

    const newVerification = {
      id: inputValue.toUpperCase(),
      address: addresses[Math.floor(Math.random() * addresses.length)],
      status: "In Progress",
      date: new Date().toISOString().split('T')[0],
    };

    setVerifications(prev => [newVerification, ...prev]);
    setInputValue('');

    // Simulate oracle verification
    setTimeout(() => {
      setVerifications(prev =>
        prev.map(v =>
          v.id === newVerification.id
            ? { ...v, status: Math.random() > 0.2 ? "Verified" : "Failed" }
            : v
        )
      );
    }, 5000);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Title Deed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
                <CheckCircle /> Verified
            </div>
            <p className="text-xs text-muted-foreground">Last checked: 2024-07-15</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appraisal Value</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250,000</div>
            <p className="text-xs text-muted-foreground">Source: Verified Appraisal Report #AV-5821</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Zoning & Compliance</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
                <CheckCircle /> Compliant
            </div>
            <p className="text-xs text-muted-foreground">Zoning: R-1, No violations found</p>
          </CardContent>
        </Card>
      </div>

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
                <TableRow key={item.id}>
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
    </div>
  );
}
