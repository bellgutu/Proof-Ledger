
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sprout, Gem, Home, CheckCircle, FileText, Building, Map } from "lucide-react";

export default function AssetVerificationPage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Real World Asset Verification
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          This module ensures that physical assets meet the required standards for provenance, quality, and compliance. It provides tools to verify certifications and condition for a wide range of real-world assets.
        </p>
      </div>

      <Tabs defaultValue="commodity" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
          <TabsTrigger value="commodity" className="py-3 text-base">
            <Sprout className="mr-2 h-5 w-5" /> Commodity & Agricultural
          </TabsTrigger>
          <TabsTrigger value="luxury" className="py-3 text-base">
            <Gem className="mr-2 h-5 w-5" /> Luxury Goods & Gemstones
          </TabsTrigger>
          <TabsTrigger value="real_estate" className="py-3 text-base">
            <Home className="mr-2 h-5 w-5" /> Real Estate
          </TabsTrigger>
        </TabsList>
        <TabsContent value="commodity">
          <Card>
            <CardHeader>
              <CardTitle>Commodity & Agricultural Verification</CardTitle>
              <CardDescription>
                Validates certifications for organic, fair trade, and quality grading for commodities like coffee, cocoa, and other agricultural products.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Verification dashboard for agricultural products coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="luxury">
          <Card>
            <CardHeader>
              <CardTitle>Luxury Goods & Gemstone Verification</CardTitle>
              <CardDescription>
                Verifies provenance and quality for high-value items by validating GIA/IGI certifications, appraisals, and conflict-free sourcing.
              </CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Verification dashboard for luxury goods coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="real_estate">
          <Card>
            <CardHeader>
              <CardTitle>Real Estate Verification</CardTitle>
              <CardDescription>
                Confirms property condition, environmental compliance, and zoning regulations through verified inspection reports and public records.
              </CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Verification dashboard for real estate coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
