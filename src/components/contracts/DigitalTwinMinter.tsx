
'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, Building, Diamond, Wheat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ABIS } from '@/contracts';
import { keccak256, toBytes, Hex, stringToHex } from 'viem';

// Helper function to generate bytes32 from string
const stringToBytes32 = (str: string): Hex => {
  const hex = stringToHex(str);
  // Ensure it's exactly 64 hex characters (32 bytes)
  const padded = hex.slice(2).padStart(64, '0');
  return `0x${padded}` as Hex;
};

// Asset types mapping
const ASSET_TYPES = [
  { id: 1, name: 'Real Estate', icon: Building, color: 'text-blue-500' },
  { id: 2, name: 'Luxury Good', icon: Diamond, color: 'text-purple-500' },
  { id: 3, name: 'Commodity', icon: Wheat, color: 'text-amber-500' },
];

export function DigitalTwinMinter() {
  const { address } = useAccount();
  const { toast } = useToast();
  
  const [assetType, setAssetType] = useState(1);
  const [assetName, setAssetName] = useState('');
  const [verifiedValue, setVerifiedValue] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [reVerificationPeriod, setReVerificationPeriod] = useState('31536000'); // 1 year in seconds
  
  const { 
    writeContractAsync,
    data: hash,
    isPending: isWriting,
    error: writeError
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const generateAssetId = (): Hex => {
    const input = `${assetName}-${assetType}-${Date.now()}`;
    return keccak256(toBytes(input));
  };

  const generateVerificationHash = (): Hex => {
    const input = `${assetName}-${verifiedValue}-${Date.now()}`;
    return keccak256(toBytes(input));
  };

  const handleMint = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate required bytes32 values
      const assetId = generateAssetId();
      const verificationHash = generateVerificationHash();

      // Convert values to proper types
      const assetIdBytes32 = assetId;
      const assetTypeUint8 = assetType;
      const verifiedValueBigInt = BigInt(verifiedValue || '0');
      const verificationHashBytes32 = verificationHash;
      const legalOwner = address;
      const reVerificationPeriodBigInt = BigInt(reVerificationPeriod);

      console.log('Minting with parameters:', {
        assetId: assetIdBytes32,
        assetType: assetTypeUint8,
        verifiedValue: verifiedValueBigInt.toString(),
        verificationHash: verificationHashBytes32,
        legalOwner,
        metadataURI,
        reVerificationPeriod: reVerificationPeriodBigInt.toString(),
      });

      // Execute the mint
      const txHash = await writeContractAsync({
        address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
        abi: ABIS.ProofLedgerCore,
        functionName: 'mintDigitalTwin',
        args: [
          assetIdBytes32,
          assetTypeUint8,
          verifiedValueBigInt,
          verificationHashBytes32,
          legalOwner,
          metadataURI || `ipfs://QmTest/${assetName.toLowerCase().replace(/\s+/g, '-')}.json`,
          reVerificationPeriodBigInt
        ]
      });

      toast({
        title: "Digital Twin Minting Started",
        description: "Your asset is being registered on the blockchain",
      });

    } catch (error: any) {
      console.error('Minting error:', error);
      
      let errorMessage = error.message;
      if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (errorMessage.includes('revert')) {
        errorMessage = 'Contract execution reverted. Check parameters and permissions.';
      }

      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleQuickMint = (type: number) => {
    const assetNames = ['Luxury Villa', 'Rolex Daytona', 'Gold Bar'];
    const values = ['1000000000000000000', '500000000000000000', '2000000000000000000']; // 1, 0.5, 2 ETH in wei
    
    setAssetType(type);
    setAssetName(`${assetNames[type - 1]} #${Date.now().toString().slice(-4)}`);
    setVerifiedValue(values[type - 1]);
    setMetadataURI(`ipfs://QmTest/${assetNames[type - 1].toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`);
    
    toast({
      title: "Parameters Set",
      description: `Ready to mint ${assetNames[type - 1]}`,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Mint Digital Twin</CardTitle>
        <CardDescription>
          Create a blockchain-verified digital asset with the correct 7 parameters
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Mint Buttons */}
        <div className="space-y-4">
          <Label>Quick Mint Templates</Label>
          <div className="grid grid-cols-3 gap-3">
            {ASSET_TYPES.map((asset) => (
              <Button
                key={asset.id}
                onClick={() => handleQuickMint(asset.id)}
                variant="outline"
                className="flex flex-col items-center h-auto py-4"
              >
                <asset.icon className={`h-6 w-6 mb-2 ${asset.color}`} />
                <span>{asset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Asset Details Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <select
                id="assetType"
                value={assetType}
                onChange={(e) => setAssetType(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              >
                {ASSET_TYPES.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verifiedValue">Verified Value (wei)</Label>
              <Input
                id="verifiedValue"
                value={verifiedValue}
                onChange={(e) => setVerifiedValue(e.target.value)}
                placeholder="1000000000000000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetName">Asset Name</Label>
            <Input
              id="assetName"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Luxury Villa - Palm Jumeirah"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadataURI">Metadata URI (IPFS)</Label>
            <Input
              id="metadataURI"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://Qm.../metadata.json"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to auto-generate a test URI
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reVerificationPeriod">Re-verification Period (seconds)</Label>
            <Input
              id="reVerificationPeriod"
              value={reVerificationPeriod}
              onChange={(e) => setReVerificationPeriod(e.target.value)}
              placeholder="31536000 (1 year)"
            />
          </div>
        </div>

        {/* Generated Parameters Preview */}
        <div className="p-4 border rounded-lg space-y-2">
          <Label>Generated Parameters Preview</Label>
          <div className="text-xs font-mono space-y-1">
            <p>Asset ID: {generateAssetId()?.slice(0, 24)}...</p>
            <p>Verification Hash: {generateVerificationHash()?.slice(0, 24)}...</p>
            <p>Legal Owner: {address?.slice(0, 16)}...</p>
          </div>
        </div>

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={isWriting || isConfirming || !address}
          size="lg"
          className="w-full"
        >
          {isWriting || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isWriting ? 'Approving...' : 'Minting...'}
            </>
          ) : (
            '🚀 Mint Digital Twin'
          )}
        </Button>

        {/* Transaction Status */}
        {(isWriting || isConfirming || hash || writeError) && (
          <div className="p-4 border rounded-lg space-y-3">
            <p className="font-medium">Transaction Status</p>
            
            {writeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-xs text-red-600 mt-1">{writeError.message}</p>
                  </div>
                </div>
              </div>
            )}
            
            {hash && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-800">Transaction Hash</p>
                <p className="text-xs font-mono text-blue-600 mt-1 break-all">
                  {hash}
                </p>
                <Button
                  size="sm"
                  variant="link"
                  className="mt-2 p-0 h-auto text-blue-600"
                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')}
                >
                  View on Etherscan
                </Button>
              </div>
            )}
            
            {isConfirmed && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800">Digital Twin Minted!</p>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Your asset is now registered on the blockchain
                </p>
              </div>
            )}
          </div>
        )}

        {/* Important Information */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">About Digital Twins</p>
              <p className="text-blue-700 mt-1">
                Digital Twins are blockchain-verified representations of physical assets with:
              </p>
              <ul className="list-disc list-inside mt-1 text-xs text-blue-600">
                <li>Immutable ownership record</li>
                <li>Verification from TrustOracle network</li>
                <li>Insurance integration capabilities</li>
                <li>Real-time status tracking</li>
                <li>Periodic re-verification</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
