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
    value: bigint,
    timestamp: number,
    assetId: string,
    dataHash: string,
    signature: string,
    onSuccess?: (data: any) => void
  ) => {
    return executeWrite({
      contractName: 'ProofLedgerCore',
      functionName: 'mintDigitalTwin',
      args: [
        assetType,
        tokenURI,
        value,
        timestamp,
        `0x${assetId.padStart(64, '0')}`, // Convert to bytes32
        `0x${dataHash.padStart(64, '0')}`, // Convert to bytes32
        signature.startsWith('0x') ? signature : `0x${signature}` // Ensure 0x prefix
      ],
      onSuccess,
    });
  }, [executeWrite]);

  return { mint, isLoading };
}

export function useDirectMint() {
  const { writeContractAsync, isPending } = useWriteContract();
  const { toast } = useToast();

  const directMint = async () => {
    try {
      // These are example parameters - you need to adjust based on actual requirements
      const assetType = 1; // Real Estate
      const tokenURI = "ipfs://QmTest/metadata.json";
      const value = 0n; // 0 wei
      const timestamp = Math.floor(Date.now() / 1000);
      const assetId = "0x" + "00".repeat(32); // 32-byte zero
      const dataHash = "0x" + "00".repeat(32); // 32-byte zero
      const signature = "0x" + "00".repeat(65); // 65-byte zero (ECDSA signature length)

      const hash = await writeContractAsync({
        address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6', // ProofLedgerCore
        abi: [
          {
            "inputs": [
              {"internalType": "uint256","name": "_assetType","type": "uint256"},
              {"internalType": "string","name": "_tokenURI","type": "string"},
              {"internalType": "uint256","name": "_value","type": "uint256"},
              {"internalType": "uint256","name": "_timestamp","type": "uint256"},
              {"internalType": "bytes32","name": "_assetId","type": "bytes32"},
              {"internalType": "bytes32","name": "_dataHash","type": "bytes32"},
              {"internalType": "bytes","name": "_signature","type": "bytes"}
            ],
            "name": "mintDigitalTwin",
            "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'mintDigitalTwin',
        args: [assetType, tokenURI, value, timestamp, assetId, dataHash, signature]
      });

      toast({
        title: "Minting Submitted",
        description: "Transaction sent to blockchain",
      });

      return hash;
    } catch (error: any) {
      console.error("Direct mint error:", error);
      toast({
        title: "Minting Failed",
        description: error.message || "Check console for details",
        variant: "destructive",
      });
    }
  };

  return { directMint, isPending };
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
