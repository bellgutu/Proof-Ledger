
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Diamond, Wheat } from "lucide-react";
import Link from "next/link";

export default function AssetVerificationHubPage() {
  const assetTypes = [
    {
      name: "Real Estate",
      description: "Verify property titles, legal status, and cadastral data.",
      icon: <Building className="h-10 w-10 text-primary" />,
      href: "/asset-verification/real-estate",
    },
    {
      name: "Luxury & Gemstones",
      description: "Prove provenance, authenticity, and grading for high-value goods.",
      icon: <Diamond className="h-10 w-10 text-primary" />,
      href: "/asset-verification/luxury-goods",
    },
    {
      name: "Commodities & Agriculture",
      description: "Track fungible goods, batch quality, and supply chain conditions.",
      icon: <Wheat className="h-10 w-10 text-primary" />,
      href: "/asset-verification/commodities",
    },
  ];

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Asset Verification Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Establish the immutable, verifiable digital twin of a physical asset. Select an asset category to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assetTypes.map((asset) => (
          <Card key={asset.name} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{asset.name}</CardTitle>
                    <CardDescription className="mt-2">{asset.description}</CardDescription>
                  </div>
                  {asset.icon}
              </div>
            </CardHeader>
            <CardContent className="flex-grow"></CardContent>
            <div className="p-6 pt-0">
                <Link href={asset.href} passHref>
                    <Button className="w-full">
                        Go to {asset.name} Hub <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
