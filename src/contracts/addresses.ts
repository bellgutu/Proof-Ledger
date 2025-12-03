// Sepolia Contract Addresses
export const CONTRACT_ADDRESSES = {
  11155111: {
    ProofLedgerCore: '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6' as `0x${string}`,
    TrustOracle: '0xac9529cebb617265749910f24edc62e047050a55' as `0x${string}`,
    InsuranceHub: '0x6e4BC9f2b8736Da118aFBD35867F29996E9571BB' as `0x${string}`,
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a9c' as `0x${string}`,
  },
  1: {
    // Mainnet addresses (when you deploy)
    ProofLedgerCore: '' as `0x${string}`,
    TrustOracle: '' as `0x${string}`,
    InsuranceHub: '' as `0x${string}`,
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
  },
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES[11155111];

export function getContractAddress(
  contractName: ContractName,
  chainId: number
): `0x${string}` | null {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) return null;
  return addresses[contractName] || null;
}

export function getUSDCAddress(chainId: number): `0x${string}` {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) return CONTRACT_ADDRESSES[11155111].USDC;
  return addresses.USDC;
}
