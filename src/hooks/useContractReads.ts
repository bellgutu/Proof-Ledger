import { useReadContracts, useReadContract } from 'wagmi';
import { ABIS, getContractAddress } from '@/contracts';

interface ContractCall {
  contractName: keyof typeof ABIS;
  functionName: string;
  args?: any[];
  chainId?: number;
}

export function useContractReads(calls: ContractCall[], options?: any) {
  const chainId = options?.chainId || 11155111;

  const contracts = calls.map(call => {
    const address = getContractAddress(call.contractName, chainId);
    if (!address) {
      throw new Error(`Contract ${call.contractName} not found on chain ${chainId}`);
    }
    return {
      address,
      abi: ABIS[call.contractName],
      functionName: call.functionName,
      args: call.args,
    };
  });

  return useReadContracts({
    contracts,
    ...options,
  });
}

// Specific contract read hooks
export function useProofLedgerRead(
  functionName: string,
  args?: any[],
  chainId?: number
) {
  const address = getContractAddress('ProofLedgerCore', chainId || 11155111);
  
  return useReadContract({
    address: address!,
    abi: ABIS.ProofLedgerCore,
    functionName,
    args,
    query: {
      enabled: !!address,
    },
  });
}

export function useTrustOracleRead(
  functionName: string,
  args?: any[],
  chainId?: number
) {
  const address = getContractAddress('TrustOracle', chainId || 11155111);
  
  return useReadContract({
    address: address!,
    abi: ABIS.TrustOracle,
    functionName,
    args,
    query: {
      enabled: !!address,
    },
  });
}

export function useInsuranceHubRead(
  functionName: string,
  args?: any[],
  chainId?: number
) {
  const address = getContractAddress('InsuranceHub', chainId || 11155111);
  
  return useReadContract({
    address: address!,
    abi: ABIS.InsuranceHub,
    functionName,
    args,
    query: {
      enabled: !!address,
    },
  });
}
