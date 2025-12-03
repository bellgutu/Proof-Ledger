'use client';

import { useProofLedgerRead, useTrustOracleRead, useInsuranceHubRead } from '@/hooks/useContractReads';
import { useWallet } from '@/components/wallet-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function ContractTester() {
  const { account, isConnected, chainId } = useWallet();

  // Test read functions
  const { data: tokenCount, refetch: refetchTokenCount } = useProofLedgerRead(
    'balanceOf',
    [account],
    chainId
  );

  const { data: oracleCount, refetch: refetchOracleCount } = useTrustOracleRead(
    'getOracleCount',
    [],
    chainId
  );

  const { data: claimCount, refetch: refetchClaimCount } = useInsuranceHubRead(
    'getClaimCount',
    [],
    chainId
  );

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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Contract Read Tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ProofLedgerCore Test */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">ProofLedgerCore</h3>
          <p>Your NFT Balance: {tokenCount ? tokenCount.toString() : 'Loading...'}</p>
          <Button 
            onClick={() => refetchTokenCount()} 
            size="sm" 
            variant="outline"
            className="mt-2"
          >
            Refresh
          </Button>
        </div>

        {/* TrustOracle Test */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">TrustOracle</h3>
          <p>Oracle Count: {oracleCount ? oracleCount.toString() : 'Loading...'}</p>
          <Button 
            onClick={() => refetchOracleCount()} 
            size="sm" 
            variant="outline"
            className="mt-2"
          >
            Refresh
          </Button>
        </div>

        {/* InsuranceHub Test */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">InsuranceHub</h3>
          <p>Total Claims: {claimCount ? claimCount.toString() : 'Loading...'}</p>
          <Button 
            onClick={() => refetchClaimCount()} 
            size="sm" 
            variant="outline"
            className="mt-2"
          >
            Refresh
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mt-4">
          <p>Chain ID: {chainId}</p>
          <p>Account: {account?.slice(0, 10)}...{account?.slice(-8)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
