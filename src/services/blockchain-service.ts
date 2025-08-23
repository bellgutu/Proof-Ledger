
/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * It contains functions that are safe to be executed on the client-side (read-only operations).
 */
import { formatUnits, createPublicClient, http, parseAbi, defineChain } from 'viem';
import { localhost } from 'viem/chains';

// --- Environment-loaded Contract Addresses ---
// No changes here, this is good practice.
export const PERPETUALS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS) as `0x${string}`;
export const DEX_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DEX_ROUTER) as `0x${string}`;
export const VAULT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS) as `0x${string}`;
export const GOVERNOR_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS) as `0x${string}`;

// Runtime guards are excellent.
if (!PERPETUALS_CONTRACT_ADDRESS || !PERPETUALS_CONTRACT_ADDRESS.startsWith('0x')) {
  throw new Error("Perpetuals contract address not configured — check NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS");
}
if (!DEX_CONTRACT_ADDRESS || !DEX_CONTRACT_ADDRESS.startsWith('0x')) {
  throw new Error("DEX Router address not configured — check NEXT_PUBLIC_DEX_ROUTER");
}
if (!VAULT_CONTRACT_ADDRESS || !VAULT_CONTRACT_ADDRESS.startsWith('0x')) {
  throw new Error("Vault contract address not configured — check NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS");
}
if (!GOVERNOR_CONTRACT_ADDRESS || !GOVERNOR_CONTRACT_ADDRESS.startsWith('0x')) {
  throw new Error("Governor contract address not configured — check NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS");
}

const anvilChain = defineChain({
  ...localhost,
  id: 31337,
})

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: number; 
}

// --- ABIs (No changes needed, but consolidated generic ABI) ---
const genericErc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export const DEX_ABI = parseAbi([
  "function addLiquidity(address,address,bool,uint256,uint256,uint256,uint256,address,uint256) returns (uint256)",
  "function removeLiquidity(address,address,bool,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)",
  "function swapExactTokensForTokens(uint256,uint256,address[],bool,address,uint256)"
]);

export const VAULT_ABI = parseAbi([
  "function deposit(uint256)",
  "function withdraw(uint256)",
  "function balance(address) view returns (uint256)"
]);
export const GOVERNOR_ABI = parseAbi([
  "function castVote(uint256,uint8) returns (uint256)"
]);

// --- ERC20_CONTRACTS Configuration ---
// This configuration is now the single source of truth for token info.
export const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}`, name: string, decimals: number } } = {
    'USDT': { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', name: 'Tether', decimals: 6 },
    'USDC': { address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', name: 'USD Coin', decimals: 6 },
    'WETH': { address: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318', name: 'Wrapped Ether', decimals: 18 },
    'LINK': { address: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0', name: 'Chainlink', decimals: 18 },
    'BNB': { address: '0x0B306BF915C4d645ff596e518fAf3F9669b97016', name: 'BNB', decimals: 18 },
    'SOL': { address: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed', name: 'Solana', decimals: 18 },
};

// --- CORRECTED: Perpetuals contract decimals based on the provided Solidity code ---
const PERPETUALS_DECIMALS = {
    // Set to 6 because PnL is added to collateral. For the math to work,
    // PnL must have the same decimals as collateral (USDT, 6). The contract's
    // PnL formula implies `pnl` and `size` have the same decimals.
    size: 6,
    // Collateral is USDT, which has 6 decimals.
    collateral: 6,
    // The contract's `calculatePnl` function divides by 10**8,
    // indicating the price feed uses 8 decimals.
    entryPrice: 8,
};

const perpetualsAbi = parseAbi([
  "function positions(address) view returns (uint8 side, uint256 size, uint256 collateral, uint256 entryPrice, bool active)"
]);

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
})

// --- Efficiently fetches all wallet assets using multicall ---
export async function getWalletAssets(address: `0x${string}`): Promise<ChainAsset[]> {
  const assets: ChainAsset[] = [];
  const tokenSymbols = Object.keys(ERC20_CONTRACTS);

  try {
    const balanceCalls = tokenSymbols.map(symbol => {
      const contract = ERC20_CONTRACTS[symbol];
      return {
        address: contract.address,
        abi: genericErc20Abi,
        functionName: 'balanceOf',
        args: [address]
      } as const;
    });

    const [ethBalance, tokenBalances] = await Promise.all([
        publicClient.getBalance({ address }),
        publicClient.multicall({ contracts: balanceCalls })
    ]);

    assets.push({ symbol: 'ETH', name: 'Ethereum', balance: parseFloat(formatUnits(ethBalance, 18)) });

    tokenBalances.forEach((result, index) => {
        const symbol = tokenSymbols[index];
        const contract = ERC20_CONTRACTS[symbol];
        if (result.status === 'success') {
            const balance = result.result as bigint;
            assets.push({
                symbol,
                name: contract.name,
                balance: parseFloat(formatUnits(balance, contract.decimals))
            });
        } else {
            console.warn(`[BlockchainService] Failed to fetch balance for ${symbol}:`, result.error);
        }
    });

  } catch (error) {
    console.error("[BlockchainService] Error fetching wallet assets:", error);
  }

  if (assets.length === 0) {
    console.warn("Could not fetch any balances. The local blockchain may not be running or accessible.");
  }
 
  return assets;
}

// --- Gas Functions ---
export async function getGasPrice(): Promise<bigint | null> {
    try {
      return await publicClient.getGasPrice();
    } catch(e) {
      console.error("[BlockchainService] getGasPrice failed", e);
      return null;
    }
}

export async function getGasFee(): Promise<number | null> {
    const gasPrice = await getGasPrice();
    if (gasPrice === null) return null;
    
    const gasLimit = 21000n; 
    const feeInWei = gasPrice * gasLimit;
    return parseFloat(formatUnits(feeInWei, 18));
}

export interface Position {
  side: 'long' | 'short';
  size: number;
  collateral: number;
  entryPrice: number;
  active: boolean;
}

// --- Reads active position using the corrected decimal configuration ---
export async function getActivePosition(userAddress: `0x${string}`): Promise<Position | null> {
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    console.warn("[BlockchainService] Perpetuals contract address not set. Returning null.");
    return null;
  }
 
  try {
    const [side, size, collateral, entryPrice, active] = await publicClient.readContract({
        address: PERPETUALS_CONTRACT_ADDRESS,
        abi: perpetualsAbi,
        functionName: 'positions',
        args: [userAddress]
    });

    if (!active) {
      return null;
    }
   
    return {
      side: side === 0 ? 'long' : 'short',
      size: parseFloat(formatUnits(size, PERPETUALS_DECIMALS.size)),
      collateral: parseFloat(formatUnits(collateral, PERPETUALS_DECIMALS.collateral)),
      entryPrice: parseFloat(formatUnits(entryPrice, PERPETUALS_DECIMALS.entryPrice)),
      active: active
    };

  } catch (error) {
    console.error(`[BlockchainService] Failed to get active position:`, error);
    return null;
  }
}

// --- Reads collateral allowance using info from the config ---
export async function getCollateralAllowance(ownerAddress: `0x${string}`): Promise<number> {
  const usdtContract = ERC20_CONTRACTS['USDT'];
 
  try {
    const allowance = await publicClient.readContract({
      address: usdtContract.address,
      abi: genericErc20Abi,
      functionName: 'allowance',
      args: [ownerAddress, PERPETUALS_CONTRACT_ADDRESS]
    });
    return parseFloat(formatUnits(allowance, usdtContract.decimals));
  } catch (error) {
    console.error('[BlockchainService] Failed to get collateral allowance:', error);
    return 0;
  }
}
