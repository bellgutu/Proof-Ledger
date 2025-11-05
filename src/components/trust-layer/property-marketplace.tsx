"use client";
import React, { useState } from 'react';
import { useTrustLayer, type Property } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Shield, ShoppingCart, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export const PropertyMarketplace = () => {
  const { state, actions } = useTrustLayer();
  const { verifiedProperties, isLoading } = state;
  const [purchaseAmount, setPurchaseAmount] = useState<{ [key: string]: string }>({});

  const handlePurchase = async (propertyId: string) => {
    const amount = purchaseAmount[propertyId];
    if (!amount || isNaN(parseFloat(amount))) {
      alert('Please enter a valid amount');
      return;
    }
    await actions.purchaseTokens(propertyId, amount);
    setPurchaseAmount(prev => ({ ...prev, [propertyId]: '' }));
  };

  const getStatusBadge = (property: Property) => {
    const statusConfig = {
      verified: { variant: 'default' as const, icon: CheckCircle, text: 'Verified', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      pending: { variant: 'secondary' as const, icon: Eye, text: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected' },
    };
    
    const config = statusConfig[property.verificationStatus];
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
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Property Marketplace
        </CardTitle>
        <CardDescription>
          Invest in tokenized real estate properties
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {verifiedProperties.length === 0 ? (
            <Alert>
              <AlertDescription>
                No verified properties available for investment yet.
              </AlertDescription>
            </Alert>
          ) : (
            verifiedProperties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{property.title}</h3>
                      {getStatusBadge(property)}
                    </div>
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                    <p className="text-sm">{property.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Property Value</div>
                    <div>${parseInt(property.value).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Token Price</div>
                    <div>${(parseInt(property.value) / parseInt(property.tokenSupply)).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Tokens Issued</div>
                    <div>
                      {parseInt(property.tokensIssued).toLocaleString()} / {parseInt(property.tokenSupply).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Verifications</div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {property.oracleAttestations}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Amount of tokens to purchase"
                    value={purchaseAmount[property.id] || ''}
                    onChange={(e) => setPurchaseAmount(prev => ({
                      ...prev,
                      [property.id]: e.target.value
                    }))}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handlePurchase(property.id)}
                    disabled={!purchaseAmount[property.id]}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
