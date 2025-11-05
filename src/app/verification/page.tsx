
"use client";
import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Home, Sprout, Gem, Package, Shield, Users } from 'lucide-react';

export default function VerificationDashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Asset Verification Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Select a real-world asset class to begin the verification and tokenization process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Real Estate
            </CardTitle>
            <CardDescription>Property title & value verification</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Verify land deeds, confirm property valuations, and tokenize real estate assets for fractional ownership.
            </p>
            <Link href="/verification/real-estate">
                <Button variant="outline" className="mt-4 w-full">Go to Real Estate</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5" />
              Commodities
            </CardTitle>
            <CardDescription>Supply chain & quality tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Track agricultural products or raw materials from source to destination, ensuring quality and preventing fraud.
            </p>
            <Link href="/verification/commodities">
                 <Button variant="outline" className="mt-4 w-full">Go to Commodities</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5" />
              Luxury Goods
            </CardTitle>
            <CardDescription>Gemstone & item provenance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Certify the origin, quality, and ownership history of high-value goods like gemstones, art, and collectibles.
            </p>
             <Link href="/verification/luxury-goods">
                 <Button variant="outline" className="mt-4 w-full">Go to Luxury Goods</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
