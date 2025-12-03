import { useReadContracts } from 'wagmi';
import { Address } from 'viem';
import { ABIS, getContractAddress } from '@/contracts';
import { useMemo } from 'react';

export interface ContractCall {
  address: Address;
  abi: any;
  functionName: string;
  args?: any[];
  chainId?: number;
}

export function useAppContractRead({
  contractName,
  functionName,
  args,
  chainId,
  ...options
}: {
  contractName: keyof typeof ABIS;
  functionName: string;
  args?: any[];
  chainId?: number;
  [key: string]: any;
}) {
  const contractAddress = getContractAddress(contractName as any, chainId || 11155111);

  const contract = useMemo(() => {
    if (!contractAddress) return null;
    return {
      address: contractAddress,
      abi: ABIS[contractName],
      functionName,
      args,
      chainId,
    };
  }, [contractAddress, contractName, functionName, args, chainId]);

  return useReadContracts({
    contracts: contract ? [contract] : [],
    ...options,
  });
}
