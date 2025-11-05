
"use client";
import React from 'react';
import { RealEstateProvider } from '@/contexts/real-estate-context';
import { PropertyListingCard } from '@/components/real-estate/property-listing';
import { PropertyMarketplace } from '@/components/real-estate/property-marketplace';
import { PropertyVerificationPanel } from '@/components/real-estate/property-verification';
import { WalletHeader } from '@/components/shared/wallet-header';
import { Home, Shield, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RealEstatePage() {
  return (
    <RealEstateProvider>
      <div className="container mx-auto p-0 space-y-8">
        <WalletHeader />
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
                Real Estate Tokenization
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Leverage the Trust Layer to list, verify, and invest in fractional real estate ownership.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <PropertyMarketplace />
            </div>
            <div className="space-y-8">
                <PropertyListingCard />
                <PropertyVerificationPanel />
            </div>
        </div>
      </div>
    </RealEstateProvider>
  );
}
