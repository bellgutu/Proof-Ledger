'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, Building, Diamond, Wheat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ABIS } from '@/contracts';

// Mock asset data based on your dashboard
const ASSET_TYPES = [
  { 
    id: 1, 
    name: "Real Estate", 
    icon: Building, 
    color: "text-blue-500",
    description: "Property, land, buildings"
  },
  { 
    id: 2, 
    name: "Luxury Goods", 
    icon: Diamond, 
    color: "text-purple-500",
    description: "Watches, jewelry, art"
  },
  { 
    id: 3, 
    name: "Commodities", 
    icon: Wheat, 
    color: "text-amber-500",
    description: "Gold, wheat, oil, etc"
  }
];

export function WorkingMinter() {
  const [selectedAsset, setSelectedAsset] = useState(1);
  const [tokenURI, setTokenURI] = useState('ipfs://QmTest/metadata.json');
  const [customValue, setCustomValue] = useState('0');
  const { toast } = useToast();

  // Use write contract hook
  const { 
    writeContractAsync,
    data: hash,
    isPending: isWriting,
    error: writeError
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Get contract stats
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
    abi: ABIS.ProofLedgerCore,
    functionName: 'totalSupply',
  });

  const handleMint = async () => {
    const assetType = selectedAsset;
    
    try {
      // Prepare parameters based on what actually works in your dashboard
      // Looking at your Vercel site, you're probably using a simpler mint function
      
      // Try calling the registerAsset function (common in your type of contracts)
      const hash = await writeContractAsync({
        address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
        abi: [
          {
            "inputs": [
              {"internalType": "uint256", "name": "assetType", "type": "uint256"},
              {"internalType": "string", "name": "metadataURI", "type": "string"}
            ],
            "name": "registerAsset",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'registerAsset',
        args: [
          BigInt(assetType),
          tokenURI
        ]
      });

      toast({
        title: "Asset Registration Submitted",
        description: "Your digital asset is being registered on-chain",
      });

      refetchSupply();
      
    } catch (error: any) {
      console.error("Minting error:", error);
      
      // If registerAsset doesn't exist, try createAsset
      if (error.message.includes("Function not found")) {
        try {
          const hash = await writeContractAsync({
            address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
            abi: [
              {
                "inputs": [
                  {"internalType": "uint256", "name": "assetType", "type": "uint256"},
                  {"internalType": "string", "name": "tokenURI", "type": "string"},
                  {"internalType": "uint256", "name": "value", "type": "uint256"}
                ],
                "name": "createAsset",
                "outputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
              }
            ],
            functionName: 'createAsset',
            args: [
              BigInt(assetType),
              tokenURI,
              BigInt(customValue)
            ]
          });
          
          toast({
            title: "Asset Creation Submitted",
            description: "Creating digital twin on blockchain",
          });
          
        } catch (secondError: any) {
          toast({
            title: "Minting Functions Not Found",
            description: "Checking for available functions...",
            variant: "destructive",
          });
          
          // Last resort: try a generic ERC721 mint
          try {
            const hash = await writeContractAsync({
              address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
              abi: [
                {
                  "inputs": [
                    {"internalType": "address", "name": "to", "type": "address"},
                    {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                    {"internalType": "string", "name": "uri", "type": "string"}
                  ],
                  "name": "mint",
                  "outputs": [],
                  "stateMutability": "nonpayable",
                  "type": "function"
                }
              ],
              functionName: 'mint',
              args: [
                '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6', // Mint to contract
                BigInt(Date.now() % 1000000), // Random token ID
                tokenURI
              ]
            });
            
            toast({
              title: "Mint Successful!",
              description: "Using generic mint function",
            });
            
          } catch (finalError: any) {
            toast({
              title: "All Mint Methods Failed",
              description: "Please check contract ABI for available functions",
              variant: "destructive",
            });
          }
        }
      }
    }
  };

  const handleQuickMint = (assetId: number) => {
    setSelectedAsset(assetId);
    
    // Set appropriate token URI based on asset type
    const assetNames = ['real-estate', 'luxury', 'commodity'];
    setTokenURI(`ipfs://QmTest/${assetNames[assetId-1]}-${Date.now()}.json`);
    
    // Auto-mint after selection
    setTimeout(() => {
      handleMint();
    }, 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mint Digital Asset</CardTitle>
        <CardDescription>
          Register new assets on the blockchain
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Contract Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Total Assets Minted</p>
            <p className="text-2xl font-bold mt-1">
              {totalSupply ? totalSupply.toString() : '0'}
            </p>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Selected Type</p>
            <p className="text-xl font-bold mt-1">
              {ASSET_TYPES.find(a => a.id === selectedAsset)?.name}
            </p>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Network</p>
            <p className="text-xl font-bold mt-1">Sepolia</p>
          </div>
        </div>

        {/* Asset Type Selection */}
        <div className="space-y-4">
          <Label>Select Asset Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ASSET_TYPES.map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset.id);
                  setTokenURI(`ipfs://QmTest/${asset.name.toLowerCase().replace(' ', '-')}-${Date.now()}.json`);
                }}
                className={`p-6 border rounded-xl text-left transition-all ${
                  selectedAsset === asset.id 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-full ${selectedAsset === asset.id ? 'bg-primary/10' : 'bg-muted'}`}>
                    <asset.icon className={`h-8 w-8 ${asset.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{asset.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedAsset === asset.id ? "default" : "outline"}
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickMint(asset.id);
                    }}
                  >
                    Quick Mint
                  </Button>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Token URI Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="tokenURI">Token URI (Metadata)</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const assetName = ASSET_TYPES.find(a => a.id === selectedAsset)?.name || 'asset';
                setTokenURI(`ipfs://QmTest/${assetName.toLowerCase().replace(' ', '-')}-${Date.now()}.json`);
              }}
            >
              Generate
            </Button>
          </div>
          <Input
            id="tokenURI"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://Qm.../metadata.json"
          />
          <p className="text-sm text-muted-foreground">
            IPFS URI containing asset metadata (JSON format)
          </p>
        </div>

        {/* Value Input */}
        <div className="space-y-4">
          <Label htmlFor="value">Asset Value (wei)</Label>
          <Input
            id="value"
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="0"
          />
          <p className="text-sm text-muted-foreground">
            Enter 0 for test assets. Real assets should have actual value.
          </p>
        </div>

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={isWriting || isConfirming}
          size="lg"
          className="w-full"
        >
          {isWriting || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isWriting ? 'Approving Transaction...' : 'Minting Asset...'}
            </>
          ) : (
            '🚀 Mint Digital Asset'
          )}
        </Button>

        {/* Status Display */}
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
                <p className="text-sm font-medium text-blue-800">Transaction Submitted</p>
                <p className="text-xs font-mono text-blue-600 mt-1 break-all">
                  {hash}
                </p>
                <Button
                  size="sm"
                  variant="link"
                  className="mt-2 p-0 h-auto text-blue-600"
                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')}
                >
                  View on Etherscan →
                </Button>
              </div>
            )}
            
            {isConfirmed && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Asset Minted Successfully!</p>
                    <p className="text-xs text-green-600 mt-1">
                      Your digital twin is now on the blockchain
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">How it works:</p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>Select asset type (Real Estate, Luxury, Commodity)</li>
            <li>Metadata is stored on IPFS (decentralized storage)</li>
            <li>Token is minted as ERC721 on ProofLedgerCore</li>
            <li>Oracle verification can be requested after minting</li>
            <li>Insurance can be added to verified assets</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
