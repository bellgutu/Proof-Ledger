
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, Loader2 } from 'lucide-react';

export const ObservationSubmissionCard = () => {
  const { state, actions } = useTrustLayer();
  const { userOracleStatus, currentRoundId } = state;
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitObservation = async () => {
    if (!price || isNaN(parseFloat(price))) {
      alert('Please enter a valid price');
      return;
    }

    setIsLoading(true);
    try {
      await actions.submitObservation(price);
      setPrice(''); // Reset form on success
    } catch (error) {
      console.error('Failed to submit observation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userOracleStatus.isProvider) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submit Observation</CardTitle>
          <CardDescription>
            Become a provider to submit price data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to be a registered provider to submit observations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Submit Price Observation</CardTitle>
        <CardDescription>
          Submit your price data for the current round
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            Price Value (USDC)
          </label>
          <Input
            id="price"
            type="number"
            step="0.00000001"
            placeholder="Enter price (e.g., 45000.50)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          <div>Current Round: {currentRoundId.toString()}</div>
          <div>Format: Enter price with up to 8 decimal places</div>
        </div>

        <Button 
          onClick={handleSubmitObservation}
          disabled={isLoading || !price}
          className="w-full"
        >
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="h-4 w-4 mr-2" />Submit Observation</>}
        </Button>

        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            Your submissions affect the consensus price. Inaccurate data may result in slashing.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

    