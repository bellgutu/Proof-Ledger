
"use client";
import React from 'react';
import { AgricultureProvider } from '@/contexts/agriculture-context';
import { AgricultureMarketplace } from '@/components/agriculture/product-marketplace';
import { AgricultureRegistration } from '@/components/agriculture/product-registration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletHeader } from '@/components/shared/wallet-header';

function CommoditiesPageContent() {
    return (
        <div className="space-y-8">
            <WalletHeader />
             <div className="text-center space-y-2 mt-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                    Commodities & Supply Chain
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    A platform for tokenizing, verifying, and trading agricultural commodities, powered by the TrustOracle network.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <AgricultureMarketplace />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <AgricultureRegistration />
                     <Card>
                        <CardHeader>
                            <CardTitle>Agriculture Stats</CardTitle>
                            <CardDescription>Global Supply Chain Tracking</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Placeholder for real stats */}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function CommoditiesPage() {
    return (
        <AgricultureProvider>
            <CommoditiesPageContent />
        </AgricultureProvider>
    )
}
