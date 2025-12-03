'use client';

import { useWallet } from '@/components/wallet-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { ethers } from 'ethers';

export function ContractTester() {
  const { 
    contractActions, 
    isMinting, 
    isClaiming,
    account,
    isConnected 
  } = useWallet();
  
  const [assetType, setAssetType] = useState('1');
  const [assetData, setAssetData] = useState('{}');
  const [policyId, setPolicyId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect wallet to test contracts</p>
        </CardContent>
      </Card>
    );
  }

  const handleMint = async () => {
    try {
      const parsedData = JSON.parse(assetData);
      const result = await contractActions.mintAsset(
        parseInt(assetType),
        parsedData
      );
      console.log('Mint result:', result);
    } catch (error) {
      console.error('Mint error:', error);
    }
  };

  const handleFileClaim = async () => {
    try {
      const amount = ethers.parseUnits(claimAmount, 6); // USDC has 6 decimals
      const result = await contractActions.fileClaim(policyId, amount);
      console.log('Claim result:', result);
    } catch (error) {
      console.error('Claim error:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Contract Interaction Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mint Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mint Digital Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Input
                id="assetType"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                placeholder="1 = Real Estate, 2 = Luxury, 3 = Commodity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetData">Asset Data (JSON)</Label>
              <Input
                id="assetData"
                value={assetData}
                onChange={(e) => setAssetData(e.target.value)}
                placeholder='{"name": "Asset Name"}'
              />
            </div>
          </div>
          <Button onClick={handleMint} disabled={isMinting}>
            {isMinting ? 'Minting...' : 'Mint Asset'}
          </Button>
        </div>

        {/* Claim Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">File Insurance Claim</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policyId">Policy ID</Label>
              <Input
                id="policyId"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                placeholder="Policy ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claimAmount">Amount (USDC)</Label>
              <Input
                id="claimAmount"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
          </div>
          <Button onClick={handleFileClaim} disabled={isClaiming} variant="secondary">
            {isClaiming ? 'Filing Claim...' : 'File Claim'}
          </Button>
        </div>

        {/* Connected Account Info */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Connected: {account}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
