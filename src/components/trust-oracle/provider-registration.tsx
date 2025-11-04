
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, LogOut, AlertCircle, Loader2 } from 'lucide-react';

export const ProviderRegistrationCard = () => {
  const { state, actions } = useTrustLayer();
  const { userOracleStatus, trustOracleData } = state;
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await actions.registerAsProvider();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    setIsLoading(true);
    try {
      await actions.unregisterAndWithdraw();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Provider Registration
        </CardTitle>
        <CardDescription>
          Become a data provider to submit price observations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userOracleStatus.isProvider ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To become a provider, you need to stake {trustOracleData.minStake} ETH.
                This stake ensures data quality and can be slashed for inaccurate submissions.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Requirements:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Minimum stake: {trustOracleData.minStake} ETH</li>
                <li>• Submit accurate price data</li>
                <li>• Maintain consistency with consensus</li>
                <li>• Stake can be withdrawn when unregistering</li>
              </ul>
            </div>

            <Button 
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : `Register as Provider (${trustOracleData.minStake} ETH)`}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                You are registered with {userOracleStatus.stake} ETH staked.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Status</div>
                <div className={userOracleStatus.isActive ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                  {userOracleStatus.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Staked Amount</div>
                <div>{userOracleStatus.stake} ETH</div>
              </div>
            </div>

            <Button 
              onClick={handleUnregister}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Unregistering...</> : "Unregister & Withdraw"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

    