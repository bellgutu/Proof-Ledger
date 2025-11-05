
"use client";
import React from 'react';
import Link from 'next/link';
import { TrustLayerProvider } from '@/contexts/trust-layer-context';
import { WalletHeader } from '@/components/shared/wallet-header';
import { VerificationSubmissionPanel } from '@/components/trust-layer/verification-submission';
import { PropertyVerificationPanel } from '@/components/trust-layer/property-verification';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RealEstateProvider } from '@/contexts/real-estate-context';

function VerifiersPageContent() {
    return (
        <div className="container mx-auto p-0 space-y-8">
            <WalletHeader />
            <div className="space-y-2 mt-8">
                 <Button variant="ghost" asChild>
                    <Link href="/trust-layer">
                        <ArrowLeft className="mr-2" />
                        Back to Trust Layer Dashboard
                    </Link>
                </Button>
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-primary">
                        TrustOracle Verifier Dashboard
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Submit evidence and attest to the validity of real-world assets.
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <VerificationSubmissionPanel />
                <PropertyVerificationPanel />
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
    );
}
