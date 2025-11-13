
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

       <Tabs defaultValue="cargo" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
          <TabsTrigger value="cargo" className="py-3 text-base">
            <FileHeart className="mr-2 h-5 w-5" /> Cargo & Title Insurance
          </TabsTrigger>
          <TabsTrigger value="claims" className="py-3 text-base">
            <FileCheck className="mr-2 h-5 w-5" /> Automated Claims
          </TabsTrigger>
          <TabsTrigger value="financing" className="py-3 text-base">
            <Landmark className="mr-2 h-5 w-5" /> Supply Chain Financing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cargo">
          <Card>
            <CardHeader>
              <CardTitle>Cargo & Title Insurance</CardTitle>
              <CardDescription>
                Integrates with major insurance providers to validate cargo, title, and other asset-backed insurance policies in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Insurance validation dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Automated Claims Processing</CardTitle>
              <CardDescription>
                Uses verified data from the platform to automate insurance claims processing, reducing delays and disputes.
              </CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Automated claims dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financing">
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Financing</CardTitle>
              <CardDescription>
                Allows businesses to access working capital by using verified shipments and assets as collateral.
              </arameters>
              <CardDescription>
                Allows businesses to access working capital by using verified shipments and assets as collateral.
              </CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Supply chain financing dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
