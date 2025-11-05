
"use client";
import React from 'react';
import { GemstoneProvider } from '@/contexts/gemstones-context';
import { GemstoneMarketplace } from '@/components/gemstones/gemstone-marketplace';
import { GemstoneRegistration } from '@/components/gemstones/gemstone-registration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletHeader } from '@/components/shared/wallet-header';

function LuxuryGoodsPageContent() {
  return (
    <div className="space-y-8">
        <WalletHeader />
         <div className="text-center space-y-2 mt-8">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
                Luxury Goods & Provenance
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Certify the origin, quality, and ownership history of high-value goods like gemstones, art, and collectibles.
            </p>
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <GemstoneMarketplace />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <GemstoneRegistration />
                <Card>
                    <CardHeader>
                        <CardTitle>Gemstone Stats</CardTitle>
                        <CardDescription>Precious Materials Certification</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder for real stats */}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
};


export default function LuxuryGoodsPage() {
    return (
        <GemstoneProvider>
            <LuxuryGoodsPageContent />
        </GemstoneProvider>
    )
}
