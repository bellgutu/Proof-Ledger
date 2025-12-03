// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    ProofLedgerCore: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6',
    InsuranceHub: '0x6e4BC9f2b8736Da118aFBD35867F29996E9571BB',
    TrustOracle: '0xac9529cebb617265749910f24edc62e047050a55',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a9c',
  },
  // Mainnet
  1: {
    ProofLedgerCore: '0x...',
    InsuranceHub: '0x...',
    TrustOracle: '0x...',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  // Add other networks as needed
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES[11155111];

// Helper function to get contract address
export function getContractAddress(
  contractName: ContractName,
  chainId: number
): `0x${string}` | null {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) return null;
  return addresses[contractName] as `0x${string}` || null;
}
