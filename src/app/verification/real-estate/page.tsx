
"use client";
import { RealEstateProvider } from '@/contexts/real-estate-context';
import { PropertyMarketplace } from '@/components/real-estate/property-marketplace';
import { PropertyListingCard } from '@/components/real-estate/property-listing';
import { PropertyVerificationPanel } from '@/components/real-estate/property-verification';
import { WalletHeader } from '@/components/shared/wallet-header';
import { TrustLayerProvider } from '@/contexts/trust-layer-context';

function RealEstatePageContent() {
    return (
        <div className="container mx-auto p-0 space-y-8">
            <WalletHeader />
            <div className="text-center space-y-2 mt-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                    Real Estate Tokenization Hub
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    List, discover, and invest in fractional real estate assets, verified by the Trust Oracle Network.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <PropertyMarketplace />
                    <PropertyVerificationPanel />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <PropertyListingCard />
                </div>
            </div>
        </div>
    );
}


export default function RealEstatePage() {
  return (
    <TrustLayerProvider>
        <RealEstateProvider>
            <RealEstatePageContent />
        </RealEstateProvider>
    </TrustLayerProvider>
  );
}
