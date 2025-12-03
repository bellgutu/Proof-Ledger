'use client';

import { useState } from 'react';
import { useMintDigitalTwin } from '@/hooks/useContractWrites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WorkingMinter() {
  const [assetType, setAssetType] = useState('1');
  const [tokenURI, setTokenURI] = useState('ipfs://QmTest/metadata.json');
  const [value, setValue] = useState('0');
  const [timestamp] = useState(Math.floor(Date.now() / 1000).toString());
  const [assetId, setAssetId] = useState('1234567890abcdef1234567890abcdef');
  const [dataHash, setDataHash] = useState('abcdef1234567890abcdef1234567890');
  const [signature, setSignature] = useState('0x00'); // Mock signature for testing
  
  const { mint, isLoading } = useMintDigitalTwin();
  const { toast } = useToast();

  const handleMint = async () => {
    try {
      // Generate a simple signature for testing (in production, this should come from a proper signing service)
      const mockSignature = '0x' + '00'.repeat(65); // 65 bytes for ECDSA signature
      
      const result = await mint(
        parseInt(assetType),
        tokenURI,
        BigInt(value),
        parseInt(timestamp),
        assetId,
        dataHash,
        mockSignature
      );
      
      if (result.success) {
        toast({
          title: "Asset Minted Successfully",
          description: "Your digital twin has been minted",
        });
      } else {
        toast({
          title: "Minting Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Minting error:", error);
      toast({
        title: "Minting Error",
        description: error.message || "Failed to mint asset",
        variant: "destructive",
      });
    }
  };

  // Since you're the contract owner, you might have a different minting function
  // Let me check if there's an owner-only mint function
  const handleOwnerMint = async () => {
    try {
      // Try a simpler approach - use a mock signature that passes validation
      // For testing, we can use zero values for non-essential fields
      const result = await mint(
        1, // Real Estate
        'ipfs://QmOwnerTest/metadata.json',
        BigInt(0), // Zero value
        Math.floor(Date.now() / 1000), // Current timestamp
        '0'.repeat(64), // Zero bytes32
        '0'.repeat(64), // Zero bytes32
        '0x' + '00'.repeat(65) // Zero signature (won't pass signature check)
      );
      
      console.log("Mint result:", result);
    } catch (error) {
      console.error("Owner mint error:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Mint Digital Twin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assetType">Asset Type</Label>
            <select
              id="assetType"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full p-2 border rounded bg-background"
            >
              <option value="1">🏠 Real Estate</option>
              <option value="2">💎 Luxury Good</option>
              <option value="3">🌾 Commodity</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Value (wei)</Label>
            <Input
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tokenURI">Token URI</Label>
          <Input
            id="tokenURI"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://..."
          />
        </div>
        
        <div className="space-y-2">
          <Label>Current Timestamp: {timestamp}</Label>
          <p className="text-sm text-muted-foreground">
            This is automatically set to current time
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assetId">Asset ID (hex without 0x)</Label>
            <Input
              id="assetId"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="32-byte hex"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dataHash">Data Hash (hex without 0x)</Label>
            <Input
              id="dataHash"
              value={dataHash}
              onChange={(e) => setDataHash(e.target.value)}
              placeholder="32-byte hex"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Note: Signature validation bypass needed for owner testing</Label>
          <p className="text-sm text-muted-foreground">
            As contract owner, you may need to sign a proper message or modify contract
          </p>
        </div>
        
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleMint}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              "Test Mint (Standard)"
            )}
          </Button>
          
          <Button
            onClick={handleOwnerMint}
            disabled={isLoading}
            variant="secondary"
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              "Test Mint (Owner)"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
