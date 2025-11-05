
"use client";
import React, { useState, useEffect } from 'react';
import { useGemstones, type Gemstone } from '@/contexts/gemstones-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, CheckCircle, Eye, XCircle, Gem, Shield, ArrowRight, Package } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export const GemstoneMarketplace = () => {
  const { state, actions } = useGemstones();
  const { verifiedGemstones, isLoading } = state;
  
  useEffect(() => {
    actions.refreshGemstones();
  }, [actions]);

  const handlePurchase = async (gemstoneId: string) => {
    await actions.purchaseGemstone(gemstoneId);
  };

  const getStatusBadge = (gemstone: Gemstone) => {
    const statusConfig = {
      verified: { variant: 'default' as const, icon: CheckCircle, text: 'Verified', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      pending: { variant: 'secondary' as const, icon: Eye, text: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected' },
    };
    
    const config = statusConfig[gemstone.verificationStatus];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        <IconComponent className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Gemstone Marketplace
        </CardTitle>
        <CardDescription>
          Purchase verifiably-sourced and certified gemstones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {state.gemstones.length === 0 ? (
            <Alert>
              <AlertDescription>
                No gemstones available for investment yet.
              </AlertDescription>
            </Alert>
          ) : (
            state.gemstones.map((gem) => (
              <div key={gem.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Gem className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{gem.carat} Carat {gem.type.charAt(0).toUpperCase() + gem.type.slice(1)}</h3>
                      {getStatusBadge(gem)}
                    </div>
                    <p className="text-sm text-muted-foreground">{gem.origin}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Price</div>
                    <div>${parseFloat(gem.price).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Color/Clarity/Cut</div>
                    <div>{gem.color} / {gem.clarity} / {gem.cut}</div>
                  </div>
                   <div>
                    <div className="font-medium text-muted-foreground">Certification</div>
                    <div>{gem.certification}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Verifications</div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {gem.oracleAttestations}
                    </div>
                  </div>
                </div>
                
                 <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">PROVENANCE</p>
                    <div className="flex items-center gap-2 text-xs overflow-x-auto pb-2">
                        {gem.mineToMarket.map((step, index) => (
                           <React.Fragment key={step.timestamp}>
                             <div className="flex flex-col items-center text-center">
                                <Package size={16} />
                                <span className="font-medium">{step.step}</span>
                                <span className="text-muted-foreground">{step.location}</span>
                             </div>
                             {index < gem.mineToMarket.length - 1 && <ArrowRight size={16} className="text-muted-foreground shrink-0"/>}
                           </React.Fragment>
                        ))}
                    </div>
                </div>

                {gem.verificationStatus === 'verified' && (
                  <Button 
                    onClick={() => handlePurchase(gem.id)}
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase Gemstone
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
