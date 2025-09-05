

/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * It contains functions that are safe to be executed on the client-side (read-only operations).
 */
import { createPublicClient, http, parseAbi, defineChain, Address, createWalletClient, custom } from 'viem';
import { localhost, sepolia } from 'viem/chains';
import { formatTokenAmount, PRICE_DECIMALS, USDT_DECIMALS, ETH_DECIMALS } from '@/lib/format';
import { isValidAddress } from '@/lib/utils';

// --- Environment-loaded Contract Addresses ---
export const FACTORY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DEX_FACTORY_ADDRESS as `0x${string}`;
export const DEX_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DEX_ROUTER_ADDRESS as `0x${string}`;
export const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`;
export const PERPETUALS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS as `0x${string}`;
export const GOVERNOR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS as `0x${string}`;

export const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}` | undefined, name: string } } = {
    'USDT': { address: process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`, name: 'Tether' },
    'USDC': { address: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`, name: 'USD Coin' },
    'WETH': { address: process.env.NEXT_PUBLIC_WETH_ADDRESS as `0x${string}`, name: 'Wrapped Ether' },
    'LINK': { address: process.env.NEXT_PUBLIC_LINK_ADDRESS as `0x${string}`, name: 'Chainlink' },
    'BNB': { address: process.env.NEXT_PUBLIC_BNB_ADDRESS as `0x${string}`, name: 'BNB' },
    'SOL': { address: process.env.NEXT_PUBLIC_SOL_ADDRESS as `0x${string}`, name: 'Solana' },
};


const getRpcUrl = () => {
    return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'http://localhost:8545';
}

export const getTargetChain = () => {
    if (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) {
        return sepolia;
    }
    return defineChain({
        ...localhost,
        id: 31337,
    });
}

export const anvilChain = getTargetChain();

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
  "function approve(address spender, uint256 amount) external returns (bool)",
]);

export const DEX_ABI = parseAbi([
  "function addLiquidity(address tokenA, address tokenB, bool stable, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) payable returns (uint256)",
  "function removeLiquidity(address tokenA, address tokenB, bool stable, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[])"
]);


export const VAULT_ABI = parseAbi([
  "function deposit(uint256 amount)",
  "function withdraw(uint256 shares, address receiver, address owner) returns (uint256)",
  "function setProtocol(address)",
  "function collateral(address account) external view returns (uint256)",
  "function lockedCollateral(address account) external view returns (uint256)"
]);

export const GOVERNOR_ABI = parseAbi([
  "function castVote(uint256,uint8) returns (uint256)"
]);

export const FACTORY_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" },
            { "internalType": "bool", "name": "stable", "type": "bool" }
        ],
        "name": "getPool",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" },
            { "internalType": "bool", "name": "stable", "type": "bool" }
        ],
        "name": "createPool",
        "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
        "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "allPools",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [],
        "name": "allPoolsLength",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function"
    }
] as const;

export const POOL_ABI = [
    { "inputs": [], "name": "token0", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "token1", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "stable", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "lpToken", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "amountB", "type": "uint256" } ], "name": "addLiquidity", "outputs": [{ "internalType": "uint256", "name": "liquidity", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }
] as const;


export const PERPETUALS_ABI = parseAbi([
  "function calculatePnl(address user, uint256 idx) view returns (int256)",
  "function closePosition()",
  "function openPosition(uint8 side, uint256 size, uint256 collateral)",
  "function positions(address) view returns (uint8 side, uint256 size, uint256 collateral, uint256 entryPrice, bool active)",
  "function priceOracle() view returns (address)",
  "function vault() view returns (address)"
]);

export const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(getRpcUrl()),
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
      if (!contract.address || !isValidAddress(contract.address)) continue;
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
        abi: PERPETUALS_ABI,
        functionName: 'positions',
        args: [userAddress]
    });

    if (!active) {
      return null;
    }
   
    let position: Position = {
      side: side === 0 ? 'long' : 'short',
      size: parseFloat(formatTokenAmount(size, ETH_DECIMALS)),
      collateral: parseFloat(formatTokenAmount(collateral, USDT_DECIMALS)),
      entryPrice: parseFloat(formatTokenAmount(entryPrice, PRICE_DECIMALS)),
      active: active
    };
    
    return position;

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

export async function checkAllContracts() {
    const coreContracts = [
        { name: "Factory", address: FACTORY_CONTRACT_ADDRESS },
        { name: "DEX Router", address: DEX_CONTRACT_ADDRESS },
        { name: "Vault", address: VAULT_CONTRACT_ADDRESS },
        { name: "Perpetuals", address: PERPETUALS_CONTRACT_ADDRESS },
        { name: "Governor", address: GOVERNOR_CONTRACT_ADDRESS },
    ];

    const checkAddress = async (address: Address) => {
        if (!isValidAddress(address)) return false;
        const code = await publicClient.getCode({ address });
        return code !== '0x';
    };

    const contracts = await Promise.all(
        coreContracts.map(async (c) => ({
            name: c.name,
            address: c.address,
            deployed: c.address ? await checkAddress(c.address) : false,
        }))
    );

    const tokens = await Promise.all(
        Object.entries(ERC20_CONTRACTS).map(async ([name, token]) => ({
            name,
            address: token.address,
            deployed: token.address ? await checkAddress(token.address) : false,
        }))
    );

    const allDeployed = [...contracts, ...tokens].every(c => c.deployed);

    return { contracts, tokens, allDeployed };
}
