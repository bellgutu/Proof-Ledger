
'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ABIS } from '@/contracts';
import { keccak256, toBytes, Hex, parseEther } from 'viem';

export function OracleManager() {
  const { address } = useAccount();
  const { toast } = useToast();
  
  const [metadataURI, setMetadataURI] = useState('ipfs://QmOracle/metadata.json');
  const [stakeAmount, setStakeAmount] = useState('0.1');
  
  const { 
    writeContractAsync,
    isPending: isWriting,
  } = useWriteContract();

  // Read oracle profile
  const { data: oracleProfile, refetch: refetchProfile } = useReadContract({
    address: '0xac9529cebb617265749910f24edc62e047050a55',
    abi: ABIS.TrustOracle,
    functionName: 'getOracleProfile',
    args: [address],
    query: {
      enabled: !!address,
    }
  });

  const handleRegisterOracle = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        variant: "destructive",
      });
      return;
    }

    try {
      const stakeInWei = parseEther(stakeAmount);
      
      await writeContractAsync({
        address: '0xac9529cebb617265749910f24edc62e047050a55',
        abi: ABIS.TrustOracle,
        functionName: 'registerOracle',
        args: [metadataURI],
        value: stakeInWei,
      });

      toast({
        title: "Oracle Registration Submitted",
        description: `Staking ${stakeAmount} ETH as collateral`,
      });

      refetchProfile();
      
    } catch (error: any) {
      console.error('Oracle registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitAssetData = async () => {
    try {
      const dataType = 1; // Example: 1 = verification data
      const assetId = keccak256(toBytes(`test-asset-${Date.now()}`));
      const numericValue = 1000000n; // Example value
      const stringValue = "Verified by Oracle";
      const proofHash = keccak256(toBytes(`proof-${Date.now()}`));
      const confidence = 95n; // 95% confidence

      await writeContractAsync({
        address: '0xac9529cebb617265749910f24edc62e047050a55',
        abi: ABIS.TrustOracle,
        functionName: 'submitAssetData',
        args: [
          dataType,
          assetId,
          numericValue,
          stringValue,
          proofHash,
          confidence
        ]
      });

      toast({
        title: "Data Submitted",
        description: "Asset data sent to oracle network",
      });
      
    } catch (error: any) {
      console.error('Data submission error:', error);
      toast({
        title: "Submission Failed",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          TrustOracle Network
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Oracle Profile */}
        {oracleProfile && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Your Oracle Profile</p>
                {oracleProfile && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Status: {Number(oracleProfile[0]) === 1 ? 'Active' : 'Inactive'}</p>
                    <p>Reputation: {oracleProfile[1]?.toString()}</p>
                    <p>Stake: {oracleProfile[2]?.toString()} wei</p>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchProfile()}
              >
                Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Register Oracle */}
        <div className="space-y-4">
          <Label>Register as Oracle</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metadataURI">Metadata URI</Label>
              <Input
                id="metadataURI"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                placeholder="ipfs://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stakeAmount">Stake Amount (ETH)</Label>
              <Input
                id="stakeAmount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.1"
              />
            </div>
          </div>
          <Button
            onClick={handleRegisterOracle}
            disabled={isWriting}
            className="w-full"
          >
            {isWriting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              'Register Oracle'
            )}
          </Button>
        </div>

        {/* Submit Data */}
        <div className="space-y-4">
          <Label>Submit Asset Verification Data</Label>
          <p className="text-sm text-muted-foreground">
            Submit verification data for assets (requires oracle status)
          </p>
          <Button
            onClick={handleSubmitAssetData}
            disabled={isWriting}
            variant="outline"
            className="w-full"
          >
            Submit Test Verification Data
          </Button>
        </div>

        {/* Network Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Oracle Network</p>
              <p className="text-blue-700 mt-1">
                Oracles provide verified data with:
              </p>
              <ul className="list-disc list-inside mt-1 text-xs text-blue-600">
                <li>Staked collateral for honesty</li>
                <li>Reputation scoring system</li>
                <li>Dispute resolution mechanism</li>
                <li>Consensus-based verification</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
