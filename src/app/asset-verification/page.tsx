
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, Gem, Home } from "lucide-react";

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Sprout className="h-6 w-6 text-accent" />
                Commodity & Agricultural
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Validates certifications for organic, fair trade, and quality grading for commodities like coffee, cocoa, and other agricultural products.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Gem className="h-6 w-6 text-accent" />
                Luxury Goods & Gemstones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Verifies provenance and quality for high-value items by validating GIA/IGI certifications, appraisals, and conflict-free sourcing.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Home className="h-6 w-6 text-accent" />
                Real Estate Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Confirms property condition, environmental compliance, and zoning regulations through verified inspection reports and public records.
              </CardDescription>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
