
"use client";
import React, { useState, useEffect } from 'react';
import { useAgriculture, type AgriculturalProduct } from '@/contexts/agriculture-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, CheckCircle, Eye, XCircle, Sprout, Shield, ArrowRight, Package } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export const AgricultureMarketplace = () => {
  const { state, actions } = useAgriculture();
  const { verifiedProducts, isLoading } = state;
  const [purchaseAmount, setPurchaseAmount] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    actions.refreshProducts();
  }, [actions]);

  const handlePurchase = async (productId: string) => {
    const amount = purchaseAmount[productId];
    if (!amount || isNaN(parseFloat(amount))) {
      alert('Please enter a valid amount');
      return;
    }
    await actions.purchaseProduct(productId, amount);
    setPurchaseAmount(prev => ({ ...prev, [productId]: '' }));
  };

  const getStatusBadge = (product: AgriculturalProduct) => {
    const statusConfig = {
      verified: { variant: 'default' as const, icon: CheckCircle, text: 'Verified', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      pending: { variant: 'secondary' as const, icon: Eye, text: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected' },
    };
    
    const config = statusConfig[product.verificationStatus];
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
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Agriculture Marketplace
        </CardTitle>
        <CardDescription>
          Invest in verifiably-sourced agricultural products from around the world.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {state.products.length === 0 ? (
            <Alert>
              <AlertDescription>
                No agricultural products available for investment yet.
              </AlertDescription>
            </Alert>
          ) : (
            state.products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{product.productType.charAt(0).toUpperCase() + product.productType.slice(1)} - {product.origin}</h3>
                      {getStatusBadge(product)}
                    </div>
                    <p className="text-sm text-muted-foreground">by {product.farmer}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Price/kg</div>
                    <div>${parseFloat(product.price).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Quantity</div>
                    <div>{product.quantity}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Quality Score</div>
                    <div>{product.qualityScore}/100</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Verifications</div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {product.oracleAttestations}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">SUPPLY CHAIN</p>
                    <div className="flex items-center gap-2 text-xs overflow-x-auto pb-2">
                        {product.supplyChain.map((step, index) => (
                           <React.Fragment key={step.timestamp}>
                             <div className="flex flex-col items-center text-center">
                                <Package size={16} />
                                <span className="font-medium">{step.step}</span>
                                <span className="text-muted-foreground">{step.location}</span>
                             </div>
                             {index < product.supplyChain.length - 1 && <ArrowRight size={16} className="text-muted-foreground shrink-0"/>}
                           </React.Fragment>
                        ))}
                    </div>
                </div>

                {product.verificationStatus === 'verified' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Input
                      placeholder="Quantity to purchase (kg)"
                      value={purchaseAmount[product.id] || ''}
                      onChange={(e) => setPurchaseAmount(prev => ({ ...prev, [product.id]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handlePurchase(product.id)}
                      disabled={!purchaseAmount[product.id]}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
