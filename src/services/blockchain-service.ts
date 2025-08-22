
/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * It contains functions that are safe to be executed on the client-side (read-only operations).
 * Write operations that require a private key have been moved to server actions.
 */
import { formatUnits, createPublicClient, http, parseAbi, defineChain } from 'viem';
import { localhost } from 'viem/chains';

// --- Environment-loaded Contract Addresses ---
export const PERPETUALS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS) as `0x${string}`;
export const DEX_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DEX_ROUTER) as `0x${string}`;
export const VAULT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS) as `0x${string}`;
export const GOVERNOR_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS) as `0x${string}`;

// Runtime guards to prevent 'undefined' address errors
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

const genericErc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
]);

export const DEX_ABI = parseAbi([
  "constructor(address)",
  "function addLiquidity(address,address,bool,uint256,uint256,uint256,uint256,address,uint256) returns (uint256)",
  "function factory() view returns (address)",
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

export const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}` | undefined, name: string, decimals: number, abi: typeof genericErc20Abi } } = {
    'USDT': { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', name: 'Tether', decimals: 18, abi: genericErc20Abi },
    'USDC': { address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', name: 'USD Coin', decimals: 18, abi: genericErc20Abi },
    'ETH': { address: '0x0165878A594ca255338adfa4d48449f69242Eb8F', name: 'Ethereum', decimals: 18, abi: genericErc20Abi },
    'WETH': { address: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318', name: 'Wrapped Ether', decimals: 18, abi: genericErc20Abi },
    'LINK': { address: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0', name: 'Chainlink', decimals: 18, abi: genericErc20Abi },
    'BNB': { address: '0x0B306BF915C4d645ff596e518fAf3F9669b97016', name: 'BNB', decimals: 18, abi: genericErc20Abi },
    'SOL': { address: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed', name: 'Solana', decimals: 18, abi: genericErc20Abi },
};

const perpetualsAbi = parseAbi([
  "function positions(address) view returns (uint8 side, uint256 size, uint256 collateral, uint256 entryPrice, bool active)"
]);

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
  pollingInterval: undefined,
})

export async function getWalletAssets(address: string): Promise<ChainAsset[]> {
  const assets: ChainAsset[] = [];
  
  try {
    const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` });
    assets.push({ symbol: 'ETH', name: 'Ethereum', balance: parseFloat(formatUnits(ethBalance, 18)) });
  } catch (error) {
    console.error("[BlockchainService] Error connecting to local blockchain for ETH balance:", error);
  }

  const tokenSymbols = Object.keys(ERC20_CONTRACTS).filter(symbol => symbol !== 'ETH');
  
  for (const symbol of tokenSymbols) {
    const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
    if (!contract || !contract.address) {
      console.warn(`[BlockchainService] Contract address for ${symbol} is not configured.`);
      continue;
    }
    
    try {
      const name = await publicClient.readContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'name',
      });
       const decimals = await publicClient.readContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'decimals',
      });
      const balance = await publicClient.readContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });
      assets.push({ symbol, name: name, balance: parseFloat(formatUnits(balance, decimals)) });
    } catch(e) {
      console.error(`[BlockchainService] Error fetching balance for ${symbol}:`, e)
    }
  }
  
  if (assets.length === 0) {
    console.warn("Could not fetch any balances. The local blockchain may not be running or accessible.");
  }
  
  return assets;
}


export async function getGasPrice(): Promise<bigint> {
    try {
      const gasPrice = await publicClient.getGasPrice();
      return gasPrice;
    } catch(e) {
      console.error("[BlockchainService] getGasPrice failed", e);
      return 20000000000n; // Return a default value
    }
}

export async function getGasFee(): Promise<number> {
    const gasPrice = await getGasPrice();
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

export async function getActivePosition(userAddress: string): Promise<Position | null> {
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    console.warn("[BlockchainService] Perpetuals contract address not set. Returning null.");
    return null;
  }
  
  try {
    const positionData = await publicClient.readContract({
        address: PERPETUALS_CONTRACT_ADDRESS,
        abi: perpetualsAbi,
        functionName: 'positions',
        args: [userAddress as `0x${string}`]
    });

    const [side, size, collateral, entryPrice, active] = positionData;

    if (!active) {
      return null;
    }
    
    const sizeDecimals = 18; 
    const collateralDecimals = 18;
    const priceDecimals = 18;

    return {
      side: side === 0 ? 'long' : 'short',
      size: parseFloat(formatUnits(size, sizeDecimals)),
      collateral: parseFloat(formatUnits(collateral, collateralDecimals)),
      entryPrice: parseFloat(formatUnits(entryPrice, priceDecimals)),
      active: active
    };

  } catch (error) {
    console.error(`[BlockchainService] Failed to get active position:`, error);
    return null;
  }
}

export async function getCollateralAllowance(ownerAddress: string): Promise<number> {
  const usdtContract = ERC20_CONTRACTS['USDT'];
  if (!usdtContract.address) {
    console.warn("[BlockchainService] USDT contract address not set. Returning 0 allowance.");
    return 0;
  }

  try {
    const allowance = await publicClient.readContract({
      address: usdtContract.address,
      abi: usdtContract.abi,
      functionName: 'allowance',
      args: [ownerAddress as `0x${string}`, PERPETUALS_CONTRACT_ADDRESS as `0x${string}`]
    });
    return parseFloat(formatUnits(allowance, usdtContract.decimals));
  } catch (error) {
    console.error('[BlockchainService] Failed to get collateral allowance:', error);
    return 0;
  }
}

