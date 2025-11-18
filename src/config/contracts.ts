
import TrustOracle from '@/abis/TrustOracle.json';
import ProofLedgerCore from '@/abis/ProofLedgerCore.json';
import InsuranceHub from '@/abis/InsuranceHub.json';

// Define a type for your contract configurations
export type ContractConfig = {
  address: `0x${string}`;
  abi: any; // You can use a more specific type like Abi from viem or ethers
};

// Define a type for all your contracts, keyed by a friendly name
export type AppContracts = {
  trustOracle: ContractConfig;
  proofLedgerCore: ContractConfig;
  insuranceHub: ContractConfig;
};

// Sepolia Network Contract Addresses
export const sepoliaContracts: AppContracts = {
  trustOracle: {
    address: '0xac9529cebb617265749910f24edc62e047050a55',
    abi: TrustOracle.abi,
  },
  proofLedgerCore: {
    address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
    abi: ProofLedgerCore.abi,
  },
  insuranceHub: {
    address: '0x6e4BC9f2b8736Da118aFBD35867F29996E9571BB',
    abi: InsuranceHub.abi,
  },
};

// Main export for the application to use
// Currently defaulting to Sepolia. Add other networks as needed.
export const contracts: AppContracts = sepoliaContracts;
