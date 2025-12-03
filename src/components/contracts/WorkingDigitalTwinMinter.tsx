
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, Building, Diamond, Wheat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { keccak256, toBytes, Hex, stringToHex } from 'viem';

const CONTRACT_ADDRESS = '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6' as const;

// Exact ABI for mintDigitalTwin from Etherscan
const MINT_DIGITAL_TWIN_ABI = [{
  "inputs": [
    {"name": "_assetId", "type": "bytes32"},
    {"name": "_assetType", "type": "uint8"},
    {"name": "_verifiedValue", "type": "uint256"},
    {"name": "_verificationHash", "type": "bytes32"},
    {"name": "_legalOwner", "type": "address"},
    {"name": "_metadataURI", "type": "string"},
    {"name": "_reVerificationPeriod", "type": "uint256"}
  ],
  "name": "mintDigitalTwin",
  "outputs": [{"name": "", "type": "uint256"}],
  "stateMutability": "nonpayable",
  "type": "function"
}] as const;

// Asset types from the contract
const ASSET_TYPES = [
  { id: 1, name: 'Real Estate', icon: Building, color: 'text-blue-500' },
  { id: 2, name: 'Luxury Good', icon: Diamond, color: 'text-purple-500' },
  { id: 3, name: 'Commodity', icon: Wheat, color: 'text-amber-500' },
];

export function WorkingDigitalTwinMinter() {
  const { address } = useAccount();
  const { toast } = useToast();
  
  const [assetType, setAssetType] = useState(1);
  const [assetName, setAssetName] = useState('');
  const [verifiedValue, setVerifiedValue] = useState('1000000000000000000'); // 1 ETH in wei
  const [metadataURI, setMetadataURI] = useState('');
  const [reVerificationPeriod, setReVerificationPeriod] = useState('31536000'); // 1 year in seconds

  const [previewAssetId, setPreviewAssetId] = useState<Hex | null>(null);
  const [previewVerificationHash, setPreviewVerificationHash] = useState<Hex | null>(null);
  
  const { 
    writeContractAsync,
    data: hash,
    isPending: isWriting,
    error: writeError
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Generate unique asset ID based on input
  const generateAssetId = (): Hex => {
    const input = `${assetName || 'asset'}-${assetType}-${Date.now()}-${Math.random()}`;
    return keccak256(toBytes(input));
  };

  // Generate verification hash
  const generateVerificationHash = (): Hex => {
    const input = `verified-${assetName || 'asset'}-${verifiedValue}-${Date.now()}`;
    return keccak256(toBytes(input));
  };

  useEffect(() => {
    // Generate preview hashes on the client-side to avoid hydration mismatch
    setPreviewAssetId(generateAssetId());
    setPreviewVerificationHash(generateVerificationHash());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetName, assetType, verifiedValue]);


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
      // Generate required values
      const assetId = generateAssetId();
      const verificationHash = generateVerificationHash();
      const legalOwner = address; // Mint to yourself
      
      // Convert values to proper types
      const params = {
        _assetId: assetId,
        _assetType: assetType,
        _verifiedValue: BigInt(verifiedValue || '0'),
        _verificationHash: verificationHash,
        _legalOwner: legalOwner,
        _metadataURI: metadataURI || `ipfs://QmTest/${assetName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`,
        _reVerificationPeriod: BigInt(reVerificationPeriod)
      };

      console.log('Minting with params:', params);

      // Execute the mint transaction
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: MINT_DIGITAL_TWIN_ABI,
        functionName: 'mintDigitalTwin',
        args: [
          params._assetId,
          params._assetType,
          params._verifiedValue,
          params._verificationHash,
          params._legalOwner,
          params._metadataURI,
          params._reVerificationPeriod
        ]
      });

      toast({
        title: "✅ Mint Transaction Submitted",
        description: "Your digital twin is being minted on-chain",
      });

    } catch (error: any) {
      console.error('Minting error:', error);
      
      let errorMessage = error.message;
      if (errorMessage.includes('AccessControlUnauthorizedAccount')) {
        errorMessage = 'You need VERIFIER_ROLE to mint. Grant yourself the role first.';
      } else if (errorMessage.includes('EnforcedPause')) {
        errorMessage = 'Contract is paused. Unpause it first.';
      } else if (errorMessage.includes('revert')) {
        errorMessage = 'Transaction reverted. Check parameters and permissions.';
      } else if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
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
    const values = ['1000000000000000000', '500000000000000000', '2000000000000000000'];
    
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
        <CardTitle>Digital Twin Minter</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Mint Buttons */}
        <div className="space-y-3">
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
                <span className="text-sm">{asset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <select
                id="assetType"
                value={assetType}
                onChange={(e) => setAssetType(parseInt(e.target.value))}
                className="w-full p-2 border rounded bg-background"
              >
                {ASSET_TYPES.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verifiedValue">Value (wei)</Label>
              <Input
                id="verifiedValue"
                value={verifiedValue}
                onChange={(e) => setVerifiedValue(e.target.value)}
                placeholder="1000000000000000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetName">Asset Name (for display)</Label>
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

        {/* Generated Values Preview */}
        <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
          <Label>Generated Values</Label>
           <div className="text-xs font-mono space-y-1">
             <p className='truncate'>Asset ID: {previewAssetId ? `${previewAssetId.slice(0, 32)}...` : 'Generating...'}</p>
             <p className='truncate'>Verification Hash: {previewVerificationHash ? `${previewVerificationHash.slice(0, 32)}...` : 'Generating...'}</p>
             <p className='truncate'>Legal Owner: {address || 'Not connected'}</p>
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
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
                    <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">{writeError.message}</p>
                  </div>
                </div>
              </div>
            )}
            
            {hash && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Transaction Hash</p>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400/80 mt-1 break-all">
                  {hash}
                </p>
                <Button
                  size="sm"
                  variant="link"
                  className="mt-2 p-0 h-auto text-blue-600 dark:text-blue-400"
                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')}
                >
                  View on Etherscan
                </Button>
              </div>
            )}
            
            {isConfirmed && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">✅ Digital Twin Minted!</p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400/80 mt-1">
                  Your asset is now registered on the blockchain
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    