
"use client";
import React from 'react';
import { TrustLayerProvider } from '@/contexts/trust-layer-context';
import { WalletHeader } from '../shared/wallet-header';
import { DashboardLayout } from '@/components/trust-oracle/dashboard-layout';

export default function TrustLayerPage() {
    return (
        <TrustLayerProvider>
            <div className="container mx-auto p-0 space-y-8">
                <WalletHeader />
                <div className="text-center space-y-2 mt-8">
                    <h1 className="text-4xl font-bold tracking-tight text-primary">
                        Trust Oracle Network
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        A decentralized data integrity marketplace. Providers stake capital to submit data, ensuring accuracy and security.
                    </p>
                </div>
                <DashboardLayout />
            </div>
        </TrustLayerProvider>
    );
}

    