
// This file is the single source of truth for all smart contract ABIs.
// It is imported by `contracts.ts` to configure the application.

import TrustOracleABI from '@/abis/TrustOracle.json';
import ProofLedgerCoreABI from '@/abis/ProofLedgerCore.json';
import InsuranceHubABI from '@/abis/InsuranceHub.json';

export interface ContractConfig {
  address: string;
  abi: any;
}

export interface AppContracts {
  trustOracle: ContractConfig;
  proofLedgerCore: ContractConfig;
  insuranceHub: ContractConfig;
}

export const contracts: AppContracts = {
  trustOracle: {
    address: '', // Address will be set in the network-specific config
    abi: TrustOracleABI.abi,
  },
  proofLedgerCore: {
    address: '',
    abi: ProofLedgerCoreABI.abi,
  },
  insuranceHub: {
    address: '',
    abi: InsuranceHubABI.abi,
  },
};
