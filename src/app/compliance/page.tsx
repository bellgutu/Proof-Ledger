
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-accent" />
                KYC/AML Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Verifies customer identities and performs anti-money laundering checks for financial compliance.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <GanttChartSquare className="h-6 w-6 text-accent" />
                Regulatory Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Ensures all activities meet regulatory standards, including trade compliance and industry-specific rules.
              </CardDescription>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
