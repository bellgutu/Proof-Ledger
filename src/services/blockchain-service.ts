

/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * It contains functions that are safe to be executed on the client-side (read-only operations).
 */
import { createPublicClient, http, parseAbi, defineChain } from 'viem';
import { localhost } from 'viem/chains';
import { formatTokenAmount, PRICE_DECIMALS, USDT_DECIMALS, ETH_DECIMALS } from '@/lib/format';

// --- Environment-loaded Contract Addresses ---
export const PERPETUALS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS) as `0x${string}`;
export const DEX_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DEX_ROUTER) as `0x${string}`;
export const VAULT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS) as `0x${string}`;
export const GOVERNOR_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS) as `0x${string}`;
export const USDT_USDC_POOL_ADDRESS = (process.env.NEXT_PUBLIC_USDT_USDC_POOL_ADDRESS) as `0x${string}`;
export const FACTORY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DEX_FACTORY_ADDRESS as `0x${string}`;


export const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}` | undefined, name: string } } = {
    'USDT': { address: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS as `0x${string}`, name: 'Tether' },
    'USDC': { address: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS as `0x${string}`, name: 'USD Coin' },
    'WETH': { address: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS as `0x${string}`, name: 'Wrapped Ether' },
    'LINK': { address: process.env.NEXT_PUBLIC_LINK_CONTRACT_ADDRESS as `0x${string}`, name: 'Chainlink' },
    'BNB': { address: process.env.NEXT_PUBLIC_BNB_CONTRACT_ADDRESS as `0x${string}`, name: 'BNB' },
    'SOL': { address: process.env.NEXT_PUBLIC_SOL_CONTRACT_ADDRESS as `0x${string}`, name: 'Solana' },
};

const anvilChain = defineChain({
  ...localhost,
  id: 31337,
})

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
}

const genericErc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export const DEX_ABI = parseAbi([
    "function addLiquidity(address tokenA, address tokenB, bool stable, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint amountA, uint amountB, uint liquidity)",
    "function removeLiquidity(address,address,bool,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)",
    "function swapExactTokensForTokens(uint256,uint256,address[],bool,address,uint256)",
    "error InvalidPath()",
    "error ZeroAddress()",
    "error Expired()",
    "error PoolNotFound()"
]);

export const VAULT_ABI = parseAbi([
  "function deposit(uint256)",
  "function withdraw(uint256)",
  "function collateral(address) view returns (uint256)",
  "function lockedCollateral(address) view returns (uint256)"
]);

export const GOVERNOR_ABI = parseAbi([
  "function castVote(uint256,uint8) returns (uint256)"
]);

export const FACTORY_ABI = parseAbi([
    "function getPool(address, address, bool) view returns (address)",
]);

export const POOL_ABI = parseAbi([
    "function lpToken() external view returns (address)",
    "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 liquidity)",
]);


const perpetualsAbi = parseAbi([
  "function openPosition(uint8 side, uint256 size, uint256 collateral) external",
  "function closePosition() external",
  "function getPrice() view returns (uint256)",
  "function positions(address) view returns (uint8 side, uint256 size, uint256 collateral, uint256 entryPrice, bool active)"
]);

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
  multicall: false, // Explicitly disable multicall
})

export async function getWalletAssets(address: `0x${string}`): Promise<ChainAsset[]> {
  const assets: ChainAsset[] = [];
  const tokenSymbols = Object.keys(ERC20_CONTRACTS);

  try {
    const ethBalance = await publicClient.getBalance({ address });
    assets.push({ symbol: 'ETH', name: 'Ethereum', balance: parseFloat(formatTokenAmount(ethBalance, 18)), decimals: 18 });

    // Sequentially fetch token data to avoid multicall/batching issues
    for (const symbol of tokenSymbols) {
      const contract = ERC20_CONTRACTS[symbol];
      if (!contract.address) continue;
      try {
        const balance = await publicClient.readContract({
          address: contract.address,
          abi: genericErc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });

        const decimals = await publicClient.readContract({
          address: contract.address,
          abi: genericErc20Abi,
          functionName: 'decimals',
        });

        assets.push({
          symbol,
          name: contract.name,
          balance: parseFloat(formatTokenAmount(balance, decimals)),
          decimals,
        });
      } catch (tokenError) {
        console.warn(`[BlockchainService] Failed to fetch data for ${symbol}:`, tokenError);
      }
    }

  } catch (error) {
    console.error("[BlockchainService] Error fetching wallet assets:", error);
  }

  if (assets.length === 0) {
    console.warn("Could not fetch any balances. The local blockchain may not be running or accessible.");
  }
 
  return assets;
}

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
    return parseFloat(formatTokenAmount(feeInWei, 18));
}

export interface Position {
  side: 'long' | 'short';
  size: number;
  collateral: number;
  entryPrice: number;
  active: boolean;
}

export interface VaultCollateral {
  total: number;
  locked: number;
  available: number;
}

export async function getVaultCollateral(userAddress: `0x${string}`): Promise<VaultCollateral> {
  try {
    const total = await publicClient.readContract({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'collateral',
        args: [userAddress],
    });
    
    const locked = await publicClient.readContract({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'lockedCollateral',
        args: [userAddress],
    });

    const totalF = parseFloat(formatTokenAmount(total, USDT_DECIMALS));
    const lockedF = parseFloat(formatTokenAmount(locked, USDT_DECIMALS));

    return { total: totalF, locked: lockedF, available: totalF - lockedF };

  } catch(e) {
    console.error("[BlockchainService] Failed to fetch vault collateral", e);
    return { total: 0, locked: 0, available: 0 };
  }
}

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
      size: parseFloat(formatTokenAmount(size, ETH_DECIMALS)),
      collateral: parseFloat(formatTokenAmount(collateral, USDT_DECIMALS)),
      entryPrice: parseFloat(formatTokenAmount(entryPrice, PRICE_DECIMALS)),
      active: active
    };

  } catch (error) {
    console.error(`[BlockchainService] Failed to get active position:`, error);
    return null;
  }
}

export async function getCollateralAllowance(ownerAddress: `0x${string}`): Promise<number> {
  const usdtContract = ERC20_CONTRACTS['USDT'];
  if (!usdtContract.address) return 0;
  try {
    const allowance = await publicClient.readContract({
      address: usdtContract.address,
      abi: genericErc20Abi,
      functionName: 'allowance',
      args: [ownerAddress, PERPETUALS_CONTRACT_ADDRESS]
    });
    return parseFloat(formatTokenAmount(allowance, USDT_DECIMALS));
  } catch (error) {
    console.error('[BlockchainService] Failed to get collateral allowance:', error);
    return 0;
  }
}
