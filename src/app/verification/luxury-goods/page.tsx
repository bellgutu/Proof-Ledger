
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Gem, FileText, History } from "lucide-react";

const recentItems = [
  { id: "GIA-22078", item: "3.02ct Diamond", status: "Verified", date: "2024-07-17" },
  { id: "PATEK-5711", item: "Patek Philippe Nautilus", status: "Verified", date: "2024-07-16" },
  { id: "ART-004B", item: "Warhol Screenprint", status: "In Review", date: "2024-07-19" },
];

export default function LuxuryGoodsPage() {
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
          <Input placeholder="Enter asset identifier..." className="max-w-lg" />
          <Button>Verify Asset</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certification</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
                <CheckCircle /> Verified
            </div>
            <p className="text-xs text-muted-foreground">GIA Report #220785... confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Provenance History</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Owners</div>
            <p className="text-xs text-muted-foreground">Full ownership history verified on-chain</p>
          </CardContent>
        </Card>
      </div>

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
              {recentItems.map((item) => (
                <TableRow key={item.id}>
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
    </div>
  );
}
