'use client';

import { useDirectMint } from '@/hooks/useContractWrites';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function QuickMintTest() {
  const { directMint, isPending } = useDirectMint();

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Quick Mint Test</h3>
          <p className="text-sm text-muted-foreground">
            This will attempt to mint with zero values. As contract owner, 
            you might need to sign a proper message first.
          </p>
          
          <Button 
            onClick={directMint} 
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting Test Asset...
              </>
            ) : (
              "Test Mint (Zero Values)"
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            <p>Parameters used:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Asset Type: 1 (Real Estate)</li>
              <li>Value: 0 wei</li>
              <li>Timestamp: Current time</li>
              <li>Signature: Zero bytes (will fail validation)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
