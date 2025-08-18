
/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * It contains functions that are safe to be executed on the client-side (read-only operations).
 * Write operations that require a private key have been moved to server actions.
 */
import { formatUnits, createPublicClient, http, parseAbi } from 'viem';
import { localhost } from 'viem/chains';

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545'; // Your blockchain's HTTP RPC endpoint

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

const perpetualsAbi = parseAbi([
  "function positions(address) view returns (uint8 side, uint256 size, uint256 collateral, uint256 entryPrice, bool active)"
]);

const erc20Abi = parseAbi([
    "function balanceOf(address account) external view returns (uint256)",
]);

const publicClient = createPublicClient({
  chain: localhost,
  transport: http(LOCAL_CHAIN_RPC_URL),
})

export async function getWalletAssets(address: string): Promise<ChainAsset[]> {
  const assets: ChainAsset[] = [];
  
  try {
    const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` });
    assets.push({ symbol: 'ETH', name: 'Ethereum', balance: parseFloat(formatUnits(ethBalance, 18)) });
  } catch (error) {
    console.error("[BlockchainService] Error connecting to local blockchain for ETH balance:", error);
  }

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
  const PERPETUALS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS as `0x${string}`;
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
