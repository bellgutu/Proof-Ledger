'use client';

import { 
  useWriteContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
} from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { ABIS, getContractAddress, ContractName } from '@/contracts';
import { useCallback } from 'react';

interface WriteContractOptions {
  contractName: ContractName;
  functionName: string;
  args: any[];
  chainId?: number;
  value?: bigint;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useContractWrite() {
  const { toast } = useToast();
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

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

      const abi = ABIS[contractName as keyof typeof ABIS];
      if (!abi) {
        throw new Error(`ABI for ${contractName} not found`);
      }
      
      const txHash = await writeContractAsync({
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

      if (onSuccess) {
        onSuccess(txHash);
      }
      
      return { hash: txHash, success: true };

    } catch (error: any) {
      console.error('Contract write error:', error);
      
      let errorMessage = error.message || 'Transaction failed';
      if (errorMessage.includes('User rejected the request')) {
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

// Specific write hook for common operations
export function useMintAsset() {
  const { executeWrite, isLoading } = useContractWrite();

  const mint = useCallback(async (
    assetType: number,
    assetData: any,
    onSuccess?: (data: any) => void
  ) => {
    return executeWrite({
      contractName: 'ProofLedgerCore',
      functionName: 'mintDigitalTwin',
      args: [assetType, assetData],
      onSuccess,
    });
  }, [executeWrite]);

  return { mint, isLoading };
}
