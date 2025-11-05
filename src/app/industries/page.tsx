
"use client";
import React, { useState } from 'react';
import { AgricultureProvider, useAgriculture } from '@/contexts/agriculture-context';
import { GemstoneProvider, useGemstones } from '@/contexts/gemstones-context';
import { RealEstateProvider, useRealEstate } from '@/contexts/real-estate-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Sprout, Gem, Package, Shield, Users } from 'lucide-react';

// Import all components - assume they will be created
import { PropertyListingCard } from '@/components/real-estate/property-listing';
import { PropertyMarketplace } from '@/components/real-estate/property-marketplace';
import { AgricultureRegistration } from '@/components/agriculture/product-registration';
import { AgricultureMarketplace } from '@/components/agriculture/product-marketplace';
import { GemstoneRegistration } from '@/components/gemstones/gemstone-registration';
import { GemstoneMarketplace } from '@/components/gemstones/gemstone-marketplace';
import { WalletHeader } from '@/components/shared/wallet-header';
import { TrustLayerProvider } from '@/contexts/trust-layer-context';

const RealEstateDashboard = () => {
  const { state } = useRealEstate();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6 lg:col-span-2">
        <PropertyMarketplace />
      </div>
      <div className="space-y-6">
        <PropertyListingCard />
        <Card>
          <CardHeader>
            <CardTitle>Real Estate Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Properties:</span>
                <span className="font-semibold">{state.properties.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Properties:</span>
                <span className="font-semibold text-green-600">{state.verifiedProperties.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Properties:</span>
                <span className="font-semibold">{state.userProperties.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AgricultureDashboard = () => {
  const { state } = useAgriculture();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6 lg:col-span-2">
        <AgricultureMarketplace />
      </div>
      <div className="space-y-6">
        <AgricultureRegistration />
        <Card>
          <CardHeader>
            <CardTitle>Agriculture Stats</CardTitle>
            <CardDescription>Global Supply Chain Tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Tracked Products:</span>
                <span className="font-semibold">{state.products.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Supply Chains:</span>
                <span className="font-semibold text-green-600">{state.verifiedProducts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Regions:</span>
                <span className="font-semibold">Africa, South America, Asia</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const GemstoneDashboard = () => {
  const { state } = useGemstones();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="space-y-6 lg:col-span-2">
        <GemstoneMarketplace />
      </div>
      <div className="space-y-6">
        <GemstoneRegistration />
        <Card>
          <CardHeader>
            <CardTitle>Gemstone Stats</CardTitle>
            <CardDescription>Precious Materials Certification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Certified Gemstones:</span>
                <span className="font-semibold">{state.gemstones.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Origins:</span>
                <span className="font-semibold text-green-600">{state.verifiedGemstones.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-semibold">$2.8M+</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const OracleDataDashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Oracle Provider Network
          </CardTitle>
          <CardDescription>Global Verification Network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Active Verifiers:</span>
              <span className="font-semibold">247</span>
            </div>
            <div className="flex justify-between">
              <span>Total Verifications:</span>
              <span className="font-semibold">12,458</span>
            </div>
            <div className="flex justify-between">
              <span>Total Value Secured:</span>
              <span className="font-semibold">$48.2M</span>
            </div>
            <div className="flex justify-between">
              <span>Network Coverage:</span>
              <span className="font-semibold">42 Countries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Industry Impact
          </CardTitle>
          <CardDescription>TrustOracle Across Sectors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Real Estate Value:</span>
              <span className="font-semibold">$25.4M</span>
            </div>
            <div className="flex justify-between">
              <span>Agricultural Products:</span>
              <span className="font-semibold">$12.8M</span>
            </div>
            <div className="flex justify-between">
              <span>Gemstone Value:</span>
              <span className="font-semibold">$8.2M</span>
            </div>
            <div className="flex justify-between">
              <span>Other Assets:</span>
              <span className="font-semibold">$1.8M</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function IndustryPageContent() {
    const [activeTab, setActiveTab] = useState('real-estate');

    return (
        <div className="space-y-8">
            <WalletHeader />
             <div className="text-center space-y-2 mt-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                    Industries & Real-World Assets
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    A multi-industry platform for tokenizing, verifying, and trading real-world assets, powered by the TrustOracle network.
                </p>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="real-estate" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Real Estate
                </TabsTrigger>
                <TabsTrigger value="agriculture" className="flex items-center gap-2">
                <Sprout className="h-4 w-4" />
                Agriculture
                </TabsTrigger>
                <TabsTrigger value="gemstones" className="flex items-center gap-2">
                <Gem className="h-4 w-4" />
                Gemstones
                </TabsTrigger>
                <TabsTrigger value="oracle" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Oracle Network
                </TabsTrigger>
            </TabsList>

            <TabsContent value="real-estate">
                <RealEstateDashboard />
            </TabsContent>

            <TabsContent value="agriculture">
                <AgricultureDashboard />
            </TabsContent>

            <TabsContent value="gemstones">
                <GemstoneDashboard />
            </TabsContent>

            <TabsContent value="oracle">
                <OracleDataDashboard />
            </TabsContent>
            </Tabs>
        </div>
    );
}

export default function IndustriesPage() {
    return (
        <TrustLayerProvider>
            <RealEstateProvider>
                <AgricultureProvider>
                    <GemstoneProvider>
                        <IndustryPageContent />
                    </GemstoneProvider>
                </AgricultureProvider>
            </RealEstateProvider>
        </TrustLayerProvider>
    )
}
