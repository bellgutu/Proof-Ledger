/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * Each function is designed to be connected to your blockchain's RPC endpoint.
 */
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), 'src/.env') });


import { parseUnits, type Abi, formatUnits, createWalletClient, http, parseAbi, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545'; // Your blockchain's HTTP RPC endpoint

if (!process.env.LOCAL_PRIVATE_KEY) {
  throw new Error('FATAL: LOCAL_PRIVATE_KEY is not defined in the environment variables. Please check your .env file.');
}

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: number; 
}

export const ERC20_CONTRACTS: { [symbol: string]: { address: string | undefined, name: string, decimals: number } } = {
    'USDT': { address: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS, name: 'Tether', decimals: 18 },
    'USDC': { address: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS, name: 'USD Coin', decimals: 18 },
    'WETH': { address: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS, name: 'Wrapped Ether', decimals: 18 },
    'LINK': { address: process.env.NEXT_PUBLIC_LINK_CONTRACT_ADDRESS, name: 'Chainlink', decimals: 18 },
    'BNB': { address: process.env.NEXT_PUBLIC_BNB_CONTRACT_ADDRESS, name: 'BNB', decimals: 18 },
    'SOL': { address: process.env.NEXT_PUBLIC_SOL_CONTRACT_ADDRESS, name: 'Solana', decimals: 18 },
    'ETH': { address: undefined, name: 'Ethereum', decimals: 18 },
};

const PERPETUALS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS as `0x${string}`;
const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`;

const account = privateKeyToAccount(process.env.LOCAL_PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
  account,
  chain: localhost,
  transport: http(LOCAL_CHAIN_RPC_URL),
});

const publicClient = createPublicClient({
  chain: localhost,
  transport: http(LOCAL_CHAIN_RPC_URL),
})


const perpetualsAbi = parseAbi([
  "function openPosition(uint8 side, uint256 size, uint256 collateral)",
  "function closePosition()",
  "function positions(address) view returns (uint8 side, uint256 size, uint256 collateral, uint256 entryPrice, bool active)"
]);

const erc20Abi = parseAbi([
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)"
]);


export async function getWalletAssets(address: string): Promise<ChainAsset[]> {
  const assets: ChainAsset[] = [];
  
  // --- 1. Fetch ETH Balance ---
  try {
    const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` });
    assets.push({ symbol: 'ETH', name: 'Ethereum', balance: parseFloat(formatUnits(ethBalance, 18)) });
  } catch (error) {
    console.error("[BlockchainService] Error connecting to local blockchain for ETH balance:", error);
    // Do not throw here, so we can attempt to fetch ERC20 balances.
  }

  // --- 2. Fetch ERC20 Balances ---
  for (const symbol in ERC20_CONTRACTS) {
      if (symbol === 'ETH') continue;
      
      const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
      if (!contract || !contract.address) {
          console.warn(`[BlockchainService] Contract address for ${symbol} is not configured.`);
          continue;
      }
      
      try {
          const balance = await publicClient.readContract({
              address: contract.address as `0x${string}`,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as `0x${string}`]
          });

          assets.push({ symbol, name: contract.name, balance: parseFloat(formatUnits(balance, contract.decimals)) });

      } catch(e) {
          console.error(`[BlockchainService] Error fetching balance for ${symbol}:`, e)
      }
  }
  
  if (assets.length === 0) {
    throw new Error("Could not connect to the local blockchain to fetch any balances. Is the node running?");
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

export async function sendTransaction(
  fromAddress: string,
  toAddress: string,
  tokenSymbol: string,
  amount: number,
): Promise<{ success: boolean; txHash: string }> {

  const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
  if (!contractInfo) {
    throw new Error(`Token info for ${tokenSymbol} not found.`);
  }
  
  let txHash: `0x${string}`;

  if (tokenSymbol === 'ETH') {
    const valueInWei = parseUnits(amount.toString(), 18);
    txHash = await client.sendTransaction({
        account,
        to: toAddress as `0x${string}`,
        value: valueInWei
    });
  } else {
    if (!contractInfo.address) {
      throw new Error(`Contract for ${tokenSymbol} is not configured in .env file.`);
    }
    const valueInSmallestUnit = parseUnits(amount.toString(), contractInfo.decimals);
    
    txHash = await client.writeContract({
        account,
        address: contractInfo.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, valueInSmallestUnit]
    });
  }
  
  return {
    success: true,
    txHash: txHash,
  };
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
    console.warn("[BlockchainService] Perpetuals contract address not set in .env. Returning null.");
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
    
    // Decimals should ideally come from a central config
    const sizeDecimals = 18; // Assuming the position asset (e.g., WETH) has 18 decimals
    const collateralDecimals = 18; // Assuming collateral (e.g., USDT) has 18 decimals
    const priceDecimals = 18; // Oracles often use 18 decimals

    return {
      side: side === 0 ? 'long' : 'short',
      size: parseFloat(formatUnits(size, sizeDecimals)),
      collateral: parseFloat(formatUnits(collateral, collateralDecimals)),
      entryPrice: parseFloat(formatUnits(entryPrice, priceDecimals)),
      active: active
    };

  } catch (error) {
    return null;
  }
}

export async function approveCollateral(amount: bigint): Promise<`0x${string}`> {
  if (!VAULT_CONTRACT_ADDRESS) {
      throw new Error('Vault contract address is not configured');
  }
  const usdtAddress = ERC20_CONTRACTS['USDT'].address as `0x${string}`;
  if(!usdtAddress){
    throw new Error('USDT contract address not configured.');
  }

  return client.writeContract({
    account,
    address: usdtAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [VAULT_CONTRACT_ADDRESS, amount]
  });
}


export async function openPosition(params: {
    side: number, // 0 for long, 1 for short
    size: bigint,
    collateral: bigint,
}): Promise<{ success: boolean; txHash: string }> {
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    throw new Error("Perpetuals contract address not set in .env file.");
  }

  const txHash = await client.writeContract({
    account,
    address: PERPETUALS_CONTRACT_ADDRESS,
    abi: perpetualsAbi,
    functionName: "openPosition",
    args: [params.side, params.size, params.collateral]
  });

  return { success: true, txHash: txHash };
}

export async function closePosition(): Promise<{ success: boolean, txHash: string }> {
    if (!PERPETUALS_CONTRACT_ADDRESS) {
      throw new Error("Perpetuals contract address not set in .env file.");
    }
    
    const txHash = await client.writeContract({
        account,
        address: PERPETUALS_CONTRACT_ADDRESS,
        abi: perpetualsAbi,
        functionName: "closePosition",
        args: []
    });

    return { success: true, txHash: txHash };
}
