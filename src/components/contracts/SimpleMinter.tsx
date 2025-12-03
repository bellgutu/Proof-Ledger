'use client';

import { useState } from 'react';
import { useMintDigitalTwin } from '@/hooks/useContractWrites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';

export function SimpleMinter() {
  const [assetType, setAssetType] = useState('1');
  const [tokenURI, setTokenURI] = useState('ipfs://QmTest/metadata.json');
  const { mint, isLoading, isConfirming } = useMintDigitalTwin();

  const handleMint = async () => {
    try {
      const result = await mint(parseInt(assetType), tokenURI);
      console.log('Minting started:', result);
    } catch (error) {
      console.error('Minting error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mint Digital Asset
          {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
          {!isLoading && !isConfirming && <CheckCircle className="h-4 w-4 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Asset Type</label>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="1">🏠 Real Estate (Type 1)</option>
            <option value="2">💎 Luxury Good (Type 2)</option>
            <option value="3">🌾 Commodity (Type 3)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Token URI (IPFS)</label>
          <Input
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://Qm..."
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Use test URI: ipfs://QmTest/{assetType}/metadata.json
          </p>
        </div>

        <Button
          onClick={handleMint}
          disabled={isLoading || isConfirming}
          className="w-full"
        >
          {isLoading ? 'Approving...' : 
           isConfirming ? 'Minting...' : 
           'Mint Digital Twin'}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>Status: {isLoading ? 'Approving transaction...' : 
                      isConfirming ? 'Minting in progress...' : 
                      'Ready to mint'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
