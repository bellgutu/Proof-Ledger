

/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * It contains functions that are safe to be executed on the client-side (read-only operations).
 */
import { createPublicClient, http, parseAbi, defineChain, Address, createWalletClient, custom } from 'viem';
import { localhost } from 'viem/chains';
import { formatTokenAmount, PRICE_DECIMALS, USDT_DECIMALS, ETH_DECIMALS } from '@/lib/format';
import { isValidAddress } from '@/lib/utils';

// --- Environment-loaded Contract Addresses ---
export const FACTORY_CONTRACT_ADDRESS = '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44' as `0x${string}`;
export const DEX_CONTRACT_ADDRESS = '0xc5a5C42992dECbae36851359345FE25997F5C42d' as `0x${string}`;
export const VAULT_CONTRACT_ADDRESS = '0x4A679253410272dd5232B3Ff7cF5dbB88f295319' as `0x${string}`;
export const PERPETUALS_CONTRACT_ADDRESS = '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F' as `0x${string}`;
export const GOVERNOR_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707') as `0x${string}`;
export const USDT_USDC_POOL_ADDRESS = '0x56639dB16Ac50A89228026e42a316B30179A5376' as `0x${string}`;


export const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}` | undefined, name: string } } = {
    'USDT': { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`, name: 'Tether' },
    'USDC': { address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as `0x${string}`, name: 'USD Coin' },
    'WETH': { address: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318' as `0x${string}`, name: 'Wrapped Ether' },
    'LINK': { address: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0' as `0x${string}`, name: 'Chainlink' },
    'BNB': { address: '0x0B306BF915C4d645ff596e518fAf3F9669b97016' as `0x${string}`, name: 'BNB' },
    'SOL': { address: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed' as `0x${string}`, name: 'Solana' },
    'ETH': { address: '0x0165878A594ca255338adfa4d48449f69242Eb8F' as `0x${string}`, name: 'Ethereum' },
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
  // matches contracts/Router.sol:DEXRouter (deployed)
  "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) payable returns (uint256,uint256,uint256)",
  "function removeLiquidity(address tokenA, address tokenB, bool stable, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)",
  // deployed swap signature: no 'stable' param, 'to' sits before deadline
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[])"
]);


export const VAULT_ABI = parseAbi([
  "function deposit(uint256 amount, address to)",
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

export async function checkAllContracts() {
    const coreContracts = [
        { name: "Factory", address: FACTORY_CONTRACT_ADDRESS },
        { name: "DEX Router", address: DEX_CONTRACT_ADDRESS },
        { name: "Vault", address: VAULT_CONTRACT_ADDRESS },
        { name: "Perpetuals", address: PERPETUALS_CONTRACT_ADDRESS },
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
            deployed: await checkAddress(c.address as Address),
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


// new helpers for wallet interactions (write operations)
export async function connectWallet(): Promise<`0x${string}`> {
  if (typeof (window as any).ethereum === "undefined") throw new Error("No wallet found");
  // prompt user to authorize accounts
  const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts || accounts.length === 0) throw new Error("Wallet not connected");
  return accounts[0] as `0x${string}`;
}


export function getWalletClient(signerAddress?: `0x${string}`): ReturnType<typeof createWalletClient> | null {
  if (typeof (window as any).ethereum === "undefined") return null;
  const client = createWalletClient({
    chain: anvilChain,
    transport: custom((window as any).ethereum),
  });
  if (signerAddress) {
    const [account] = (client.account ? [client.account] : []) as Address[];
    if (!account || account.toLowerCase() !== signerAddress.toLowerCase()) {
        return createWalletClient({
            account: signerAddress,
            chain: anvilChain,
            transport: custom((window as any).ethereum),
        });
    }
  }
  return client;
}

/**
 * Ensure token allowance exists. If not, send approve(max) and wait for it to be mined.
 * - tokenAddress: ERC20 token contract
 * - ownerAddress: wallet address (string)
 * - spender: contract address to approve (router or pool)
 * - minAmount: bigint minimum required
 */
export async function ensureApproval(
  tokenAddress: `0x${string}`,
  ownerAddress: `0x${string}`,
  spender: `0x${string}`,
  minAmount: bigint
): Promise<void> {
  // make sure wallet is connected so the wallet UI will prompt
  await connectWallet();

  const allowance: bigint = await publicClient.readContract({
    address: tokenAddress,
    abi: genericErc20Abi,
    functionName: "allowance",
    args: [ownerAddress, spender],
  });

  if (allowance >= minAmount) return;

  const walletClient = getWalletClient(ownerAddress);
  if (!walletClient) throw new Error("No wallet available (window.ethereum)");

  const MAX = (1n << 256n) - 1n;
  const { request } = await publicClient.simulateContract({
      account: ownerAddress,
      address: tokenAddress,
      abi: parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]),
      functionName: "approve",
      args: [spender, MAX],
  });
  const txHash = await walletClient.writeContract(request);

  await publicClient.waitForTransactionReceipt({ hash: txHash });
}


/**
 * addLiquidity wrapper that:
 *  - ensures both token approvals to router
 *  - calls router.addLiquidity(...) using wallet client
 */
export async function addLiquidityViaRouter(params: {
  signerAddress: `0x${string}`,
  tokenA: `0x${string}`,
  tokenB: `0x${string}`,
  amountADesired: bigint,
  amountBDesired: bigint,
  amountAMin: bigint,
  amountBMin: bigint,
  to: `0x${string}`,
  deadlineSecondsFromNow?: number
}): Promise<string> {
  const {
    signerAddress, tokenA, tokenB,
    amountADesired, amountBDesired, amountAMin, amountBMin, to,
    deadlineSecondsFromNow = 60 * 20
  } = params;

  const walletClient = getWalletClient(signerAddress);
  if (!walletClient) throw new Error("No wallet available (window.ethereum)");

  // ensure user approved router to pull tokens
  await ensureApproval(tokenA, signerAddress, DEX_CONTRACT_ADDRESS, amountADesired);
  await ensureApproval(tokenB, signerAddress, DEX_CONTRACT_ADDRESS, amountBDesired);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSecondsFromNow);
  const { request } = await publicClient.simulateContract({
    account: signerAddress,
    address: DEX_CONTRACT_ADDRESS,
    abi: DEX_ABI,
    functionName: "addLiquidity",
    // new order: tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline
    args: [tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline],
    value: 0n,
  });

  const txHash = await walletClient.writeContract(request);

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * swapExactTokensForTokens wrapper that matches deployed router signature
 */
export async function swapExactTokensForTokensViaRouter(params: {
  signerAddress: `0x${string}`,
  amountIn: bigint,
  amountOutMin: bigint,
  path: `0x${string}`[],
  to: `0x${string}`,
  deadlineSecondsFromNow?: number
}): Promise<string> {
  const { signerAddress, amountIn, amountOutMin, path, to, deadlineSecondsFromNow = 60 * 20 } = params;
  const walletClient = getWalletClient(signerAddress);
  if (!walletClient) throw new Error("No wallet available (window.ethereum)");

  // approve first token in path to router
  await ensureApproval(path[0], signerAddress, DEX_CONTRACT_ADDRESS, amountIn);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSecondsFromNow);
  const { request } = await publicClient.simulateContract({
    account: signerAddress,
    address: DEX_CONTRACT_ADDRESS,
    abi: DEX_ABI,
    functionName: "swapExactTokensForTokens",
    // new order: amountIn, amountOutMin, path, to, deadline
    args: [amountIn, amountOutMin, path, to, deadline],
    value: 0n,
  });
  const txHash = await walletClient.writeContract(request);

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

// Small helper to convert human amounts to bigint using decimals (keeps frontend consistent)
export function toTokenUnits(amount: string, decimals = 18): bigint {
  return BigInt((Number(amount) * 10 ** decimals).toFixed(0));
}

/** Deposit collateral into the Vault (user must approve USDT to Vault or Perpetuals depending on flow) */
export async function depositCollateralToVault(signerAddress: `0x${string}`, amount: bigint): Promise<string> {
  const walletClient = getWalletClient(signerAddress);
  if (!walletClient) throw new Error("No wallet available (window.ethereum)");

  // Ensure user approved the Vault to pull USDT (if vault expects transferFrom)
  const usdt = ERC20_CONTRACTS['USDT'].address!;
  await ensureApproval(usdt, signerAddress, VAULT_CONTRACT_ADDRESS, amount);

  // call vault.deposit(amount, to)
  const { request } = await publicClient.simulateContract({
      account: signerAddress,
      address: VAULT_CONTRACT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [amount, signerAddress]
  });
  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/** Open a perpetual position on-chain */
export async function openPerpetualPosition(
  signerAddress: `0x${string}`,
  side: 0 | 1, // 0 = long, 1 = short (match contract)
  size: bigint,
  collateral: bigint
): Promise<string> {
  const walletClient = getWalletClient(signerAddress);
  if (!walletClient) throw new Error("No wallet available (window.ethereum)");

  // collateral should already be in the Vault; if PerpetualProtocol expects tokens, ensure approval flow accordingly
  const { request } = await publicClient.simulateContract({
      account: signerAddress,
      address: PERPETUALS_CONTRACT_ADDRESS,
      abi: PERPETUALS_ABI,
      functionName: "openPosition",
      args: [side, size, collateral],
      value: 0n,
    });
  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}
