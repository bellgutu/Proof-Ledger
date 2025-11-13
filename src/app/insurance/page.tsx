
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, FileCheck, FileHeart } from "lucide-react";

export default function InsurancePage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Insurance & Finance Integration
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          This module automates the verification of insurance policies and financial instruments, which dramatically streamlines the process of claims and financing. It connects with major providers to ensure your assets are protected and your capital is accessible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileHeart className="h-6 w-6 text-accent" />
                Cargo & Title Insurance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Integrates with major insurance providers to validate cargo, title, and other asset-backed insurance policies in real-time.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileCheck className="h-6 w-6 text-accent" />
                Automated Claims Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Uses verified data from the platform to automate insurance claims processing, reducing delays and disputes.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Landmark className="h-6 w-6 text-accent" />
                Supply Chain Financing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Allows businesses to access working capital by using verified shipments and assets as collateral.
              </CardDescription>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
