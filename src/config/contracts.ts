
'use client';
import { contracts as allContracts, type AppContracts } from '@/config/contracts.all';

// Sepolia Network Contract Addresses
export const sepoliaContracts: AppContracts = {
  trustOracle: {
    address: '0xac9529cebb617265749910f24edc62e047050a55',
    abi: allContracts.trustOracle.abi,
  },
  proofLedgerCore: {
    address: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
    abi: allContracts.proofLedgerCore.abi,
  },
  insuranceHub: {
    address: '0x6e4BC9f2b8736Da118aFBD35867F29996E9571BB',
    abi: allContracts.insuranceHub.abi,
  },
};

// Main export for the application to use
// Currently defaulting to Sepolia. Add other networks as needed.
export const contracts: AppContracts = sepoliaContracts;

export type { AppContracts, ContractConfig } from '@/config/contracts.all';
