"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export const PropertyVerificationPanel = () => {
  const { state, actions } = useTrustLayer();
  const { walletState } = useWallet();
  const { properties, isLoading } = state;
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);

  const pendingProperties = properties.filter(p => p.verificationStatus === 'pending');

  const handleVerify = async (propertyId: string) => {
    setIsVerifyingId(propertyId);
    await actions.verifyProperty(propertyId);
    setIsVerifyingId(null);
  };

  if (!state.userOracleStatus.isProvider) {
    return null; // Don't show the card if user is not an oracle
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Property Verification Queue
        </CardTitle>
        <CardDescription>
          Verify property listings as a trusted oracle provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : pendingProperties.length === 0 ? (
            <Alert>
              <AlertDescription>
                No properties pending verification.
              </AlertDescription>
            </Alert>
          ) : (
            pendingProperties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{property.title}</h4>
                      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                    <p className="text-sm">{property.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Property Value</div>
                    <div>${parseInt(property.value).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Current Verifications</div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {property.oracleAttestations} / 3
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleVerify(property.id)}
                  className="w-full"
                  variant="outline"
                  disabled={isVerifyingId === property.id}
                >
                  {isVerifyingId === property.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isVerifyingId === property.id ? 'Verifying...' : 'Verify Property'}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
