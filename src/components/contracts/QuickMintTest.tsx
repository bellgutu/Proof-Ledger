'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function QuickMintTest() {
  // This is a placeholder - we'll replace with actual functionality
  const isPending = false;
  
  const directMint = () => {
    console.log("Direct mint placeholder");
    alert("This functionality is being fixed. Check the WorkingMinter component instead.");
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Quick Mint Test</h3>
          <p className="text-sm text-muted-foreground">
            This feature is temporarily disabled. Use the WorkingMinter component below.
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
              "Use WorkingMinter Instead"
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            <p>Status: Fixing contract integration...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
