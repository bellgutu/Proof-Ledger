'use client';

import { 
  useWriteContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
} from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { ABIS, getContractAddress } from '@/contracts';
import { useCallback } from 'react';

interface WriteContractOptions {
  contractName: keyof typeof ABIS;
  functionName: string;
  args: any[];
  chainId?: number;
  value?: bigint;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useContractWrite() {
  const { toast } = useToast();
  const { writeContractAsync, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt();

  const executeWrite = useCallback(async ({
    contractName,
    functionName,
    args,
    chainId = 11155111,
    value,
    onSuccess,
    onError,
  }: WriteContractOptions) => {
    try {
      const address = getContractAddress(contractName, chainId);
      if (!address) {
        throw new Error(`Contract ${contractName} not found on chain ${chainId}`);
      }

      const abi = ABIS[contractName];
      if (!abi) {
        throw new Error(`ABI for ${contractName} not found`);
      }

      const hash = await writeContractAsync({
        address,
        abi,
        functionName,
        args,
        value,
      });

      toast({
        title: "Transaction Submitted",
        description: "Your transaction has been submitted to the network.",
      });

      return { hash, success: true };

    } catch (error: any) {
      console.error('Contract write error:', error);
      
      let errorMessage = error.message || 'Transaction failed';
      if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      }

      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) onError(error);
      return { success: false, error: errorMessage };
    }
  }, [writeContractAsync, toast]);

  return {
    executeWrite,
    isPending,
    isConfirming,
    isLoading: isPending || isConfirming,
  };
}

// Specific write hooks for your contracts
export function useMintDigitalTwin() {
  const { executeWrite, isLoading } = useContractWrite();

  const mint = useCallback(async (
    assetType: number,
    tokenURI: string,
    onSuccess?: (data: any) => void
  ) => {
    return executeWrite({
      contractName: 'ProofLedgerCore',
      functionName: 'mintDigitalTwin',
      args: [assetType, tokenURI],
      onSuccess,
    });
  }, [executeWrite]);

  return { mint, isLoading };
}

export function useRegisterOracle() {
  const { executeWrite, isLoading } = useContractWrite();

  const register = useCallback(async (
    endpoint: string,
    stakeAmount: bigint,
    onSuccess?: (data: any) => void
  ) => {
    return executeWrite({
      contractName: 'TrustOracle',
      functionName: 'registerOracle',
      args: [endpoint],
      value: stakeAmount,
      onSuccess,
    });
  }, [executeWrite]);

  return { register, isLoading };
}

export function useSubmitAssetData() {
  const { executeWrite, isLoading } = useContractWrite();

  const submit = useCallback(async (
    assetId: string,
    dataHash: string,
    value: bigint,
    timestamp: number,
    onSuccess?: (data: any) => void
  ) => {
    return executeWrite({
      contractName: 'TrustOracle',
      functionName: 'submitAssetData',
      args: [assetId, dataHash, value, timestamp],
      onSuccess,
    });
  }, [executeWrite]);

  return { submit, isLoading };
}

export function useFileInsuranceClaim() {
  const { executeWrite, isLoading } = useContractWrite();

  const fileClaim = useCallback(async (
    policyId: string,
    amount: bigint,
    evidence: string,
    onSuccess?: (data: any) => void
  ) => {
    return executeWrite({
      contractName: 'InsuranceHub',
      functionName: 'fileClaim',
      args: [policyId, amount, evidence],
      onSuccess,
    });
  }, [executeWrite]);

  return { fileClaim, isLoading };
}
