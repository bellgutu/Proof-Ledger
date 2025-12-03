'use client';

import { useAccount, useReadContract } from 'wagmi';
import { ABIS, getContractAddress } from '@/contracts';
import { useCallback, useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';


interface AssetMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface DigitalAsset {
  tokenId: bigint;
  assetType: number; // 1: Real Estate, 2: Luxury, 3: Commodity
  owner: string;
  tokenURI: string;
  metadata?: AssetMetadata;
  verified: boolean;
  value?: bigint;
}

export function useUserAssets() {
  const { address, chainId } = useAccount();
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's token balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: getContractAddress('ProofLedgerCore', chainId || 11155111)!,
    abi: ABIS.ProofLedgerCore,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Fetch all token IDs owned by user
  const fetchUserAssets = useCallback(async () => {
    if (!address || !balance) return;

    setIsLoading(true);
    try {
      const tokenIds: bigint[] = [];
      const balanceNum = Number(balance);

      // Fetch each token ID
      const contractAddress = getContractAddress('ProofLedgerCore', chainId || 11155111)!;
      
      for (let i = 0; i < balanceNum; i++) {
        // This is a placeholder as tokenOfOwnerByIndex is not standard.
        // A real implementation would need this or an equivalent in the contract,
        // or it would need to listen to Transfer events.
        // For now, we'll assume a simple enumeration of recent tokens for demonstration.
      }
      
      // For demonstration, let's just create mock assets based on balance.
      // In a real app, you would use the fetched tokenIds.
      const mockAssetsData = Array.from({ length: balanceNum }).map((_, i) => ({
        tokenId: BigInt(i + 1),
        assetType: (i % 3) + 1, // Cycle through asset types
        owner: address,
        tokenURI: `ipfs://Qm.../${i+1}.json`,
        verified: i % 2 === 0,
      })) as DigitalAsset[];


      setAssets(mockAssetsData);

    } catch (error) {
      console.error('Failed to fetch user assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, balance, chainId]);

  useEffect(() => {
    if (address && typeof balance !== 'undefined') {
      fetchUserAssets();
    }
  }, [address, balance, fetchUserAssets]);

  return {
    assets,
    isLoading,
    refetch: fetchUserAssets,
    balance: Number(balance || 0),
  };
}
