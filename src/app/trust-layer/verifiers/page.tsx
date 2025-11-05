"use client";
import React from 'react';
import { WalletHeader } from '@/components/shared/wallet-header';
import { ProviderRegistrationCard } from '@/components/trust-layer/provider-registration';
import { VerificationSubmissionPanel } from '@/components/trust-layer/verification-submission';
import { TrustLayerProvider } from '@/contexts/trust-layer-context';
import { RealEstateProvider } from '@/contexts/real-estate-context';

function VerifiersPageContent() {
    return (
        <div className="container mx-auto p-0 space-y-8">
            <WalletHeader />
            <div className="text-center space-y-2 mt-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                    Verifier Dashboard
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Register as a data provider and submit verifications for real-world assets.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProviderRegistrationCard />
                <VerificationSubmissionPanel />
            </div>
        </div>
    );
}

export default function VerifiersPage() {
    return (
        <TrustLayerProvider>
            <RealEstateProvider>
                <VerifiersPageContent />
            </RealEstateProvider>
        </TrustLayerProvider>
    )
}
