
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, GanttChartSquare } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Compliance & Regulatory
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          A centralized hub for managing and verifying all regulatory requirements. This module helps ensure that your business adheres to Know Your Customer (KYC), Anti-Money Laundering (AML), and other industry-specific rules.
        </p>
      </div>

       <Tabs defaultValue="kyc_aml" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 h-auto">
          <TabsTrigger value="kyc_aml" className="py-3 text-base">
            <UserCheck className="mr-2 h-5 w-5" /> KYC/AML Verification
          </TabsTrigger>
          <TabsTrigger value="regulatory" className="py-3 text-base">
            <GanttChartSquare className="mr-2 h-5 w-5" /> Regulatory Checks
          </TabsTrigger>
        </TabsList>
        <TabsContent value="kyc_aml">
          <Card>
            <CardHeader>
              <CardTitle>KYC/AML Verification</CardTitle>
              <CardDescription>
                Verifies customer identities and performs anti-money laundering checks for financial compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">KYC/AML dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="regulatory">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Checks</CardTitle>
              <CardDescription>
                Ensures all activities meet regulatory standards, including trade compliance and industry-specific rules.
              </CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Regulatory checks dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
