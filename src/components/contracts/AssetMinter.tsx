'use client';

import { useWallet } from '@/components/wallet-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function AssetMinter() {
  const { 
    contractActions, 
    contractData,
    account,
    isConnected 
  } = useWallet();
  
  const [assetType, setAssetType] = useState('1');
  const [tokenURI, setTokenURI] = useState('ipfs://QmTest123/metadata.json');

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Minter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect wallet to mint assets</p>
        </CardContent>
      </Card>
    );
  }

  const handleMint = async () => {
    try {
      if (!contractActions.mintAsset) {
        console.error("Mint function not available");
        return;
      }
      const result = await contractActions.mintAsset(
        parseInt(assetType),
        tokenURI
      );
      console.log('Mint result:', result);
    } catch (error) {
      console.error('Mint error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mint Digital Asset</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="assetType">Asset Type</Label>
          <select
            id="assetType"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="w-full p-2 border rounded bg-background text-foreground"
          >
            <option value="1">🏠 Real Estate</option>
            <option value="2">💎 Luxury Good</option>
            <option value="3">🌾 Commodity</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tokenURI">Token URI (IPFS)</Label>
          <Input
            id="tokenURI"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://Qm..."
          />
          <p className="text-sm text-muted-foreground">
            Example: ipfs://QmTest123/metadata.json
          </p>
        </div>
        
        <Button 
          onClick={handleMint} 
          disabled={contractData?.isMinting}
          className="w-full"
        >
          {contractData?.isMinting ? 'Minting...' : 'Mint Digital Twin'}
        </Button>
        
        {contractData?.userAssets && contractData.userAssets.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium">Your Assets: {contractData.userAssets.length}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
