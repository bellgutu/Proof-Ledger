

/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom blockchain.
 * It contains functions that are safe to be executed on the client-side (read-only operations).
 */
import { createPublicClient, http, parseAbi, defineChain, Address, createWalletClient, custom, type PublicClient, type WalletClient, getContract } from 'viem';
import { localhost, sepolia } from 'viem/chains';
import { formatTokenAmount, PRICE_DECIMALS, USDT_DECIMALS, ETH_DECIMALS } from '@/lib/format';
import { isValidAddress } from '@/lib/utils';

// --- Environment-loaded Contract Addresses ---
export const FACTORY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DEX_FACTORY_ADDRESS as `0x${string}`;
export const DEX_CONTRACT_ADDRESS = '0x56d214cf5b85E8a4743f297C8E277C702eC746Ab' as `0x${string}`;
export const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;
export const PERPETUALS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS as `0x${string}`;
export const GOVERNOR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS as `0x${string}`;

// --- Hardcoded Token Addresses for Client-Side Access ---
export const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}` | undefined, name: string } } = {
    'USDT': { address: '0x17a6039513bB60369e5246164Cb918973dF902BD', name: 'Tether' },
    'USDC': { address: '0x09d011D52413DC89DFe3fa64694d67451ee49Cef', name: 'USD Coin' },
    'WETH': { address: '0x3318056463e5bb26FB66e071999a058bdb35F34f', name: 'Wrapped Ether' },
    'LINK': { address: '0xbb966759b1B06E224aD601c39e66b101158Fd596', name: 'Chainlink' },
    'BNB':  { address: '0xc7973f90463F85DFc574F844CDd1A41b5187FAeC', name: 'BNB' },
    'SOL':  { address: '0x875687459284f2a041C1c2F5209628f924A28DBc', name: 'Solana' },
};


// --- DYNAMIC CLIENT & CHAIN CONFIGURATION ---
const getRpcUrl = () => {
    return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'http://localhost:8545';
}

const getTargetChain = () => {
    // Always use Sepolia if the RPC URL is provided
    if (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) {
        return sepolia;
    }
    
    // Fallback to localhost for development only
    return defineChain({
        ...localhost,
        id: 31337,
        name: 'Anvil',
    });
}


/**
 * Creates and returns a viem public client.
 * This is safe to use anywhere in the app for read operations.
 */
export const getViemPublicClient = (): PublicClient => {
  const chain = getTargetChain();
  const rpcUrl = getRpcUrl();
  const transport = http(rpcUrl);
  return createPublicClient({
    chain,
    transport,
  });
};


// --- TYPE DEFINITIONS & ABIs ---
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
  "function transfer(address to, uint256 amount) external returns (bool)"
]);

export const DEX_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_tokenB",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "provider",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "name": "LiquidityAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "fromToken",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "toToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountOut",
          "type": "uint256"
        }
      ],
      "name": "Swap",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "name": "addLiquidity",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveOut",
          "type": "uint256"
        }
      ],
      "name": "getAmountOut",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "reserveA",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "reserveB",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minAmountOut",
          "type": "uint256"
        }
      ],
      "name": "swapAforB",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minAmountOut",
          "type": "uint256"
        }
      ],
      "name": "swapBforA",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenA",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenB",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
] as const;


export const VAULT_ABI = [
    { "inputs": [], "name": "collateralToken", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "collateral", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "lockedCollateral", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;


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
  "function openPosition(uint8 side, uint256 size, uint256 collateral)",
  "function closePosition()",
  "function positions(address) view returns (uint8 side, uint256 size, uint256 collateral, uint256 entryPrice, bool active)",
  "function priceOracle() view returns (address)",
  "function vault() view returns (address)",
  "function withdrawCollateral(uint256 amount)"
]);

// --- READ-ONLY FUNCTIONS ---

export async function getGasPrice(): Promise<bigint | null> {
    const publicClient = getViemPublicClient();
    try {
      return await publicClient.getGasPrice();
    } catch(e) {
      console.error("[BlockchainService] getGasPrice failed", e);
      return null;
    }
}

export async function getGasFee(): Promise<number> {
    const gasPrice = await getGasPrice();
    if (gasPrice === null) return 0;
    
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
  const publicClient = getViemPublicClient();
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    console.warn("[BlockchainService] Perpetuals contract address not set.");
    return { total: 0, locked: 0, available: 0 };
  }
  
  try {
    const vaultAddress = await publicClient.readContract({
        address: PERPETUALS_CONTRACT_ADDRESS,
        abi: PERPETUALS_ABI,
        functionName: 'vault',
    });

    const total = await publicClient.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'collateral',
        args: [userAddress],
    });
    
    const locked = await publicClient.readContract({
        address: vaultAddress,
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
  const publicClient = getViemPublicClient();
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
  const publicClient = getViemPublicClient();
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
    const publicClient = getViemPublicClient();
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
