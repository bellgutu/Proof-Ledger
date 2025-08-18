
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

export const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}` | undefined, name: string, decimals: number } } = {
    'USDT': { address: '0xf48883f2ae4c4bf4654f45997fe47d73daa4da07', name: 'Tether', decimals: 18 },
    'USDC': { address: '0x093d305366218d6d09ba10448922f10814b031dd', name: 'USD Coin', decimals: 18 },
    'WETH': { address: '0x492844c46cef2d751433739fc3409b7a4a5ba9a7', name: 'Wrapped Ether', decimals: 18 },
    'LINK': { address: '0xf0f5e9b00b92f3999021fd8b88ac75c351d93fc7', name: 'Chainlink', decimals: 18 },
    'BNB': { address: '0xdc0a0b1cd093d321bd1044b5e0acb71b525abb6b', name: 'BNB', decimals: 18 },
    'SOL': { address: '0x810090f35dfa6b18b5eb59d298e2a2443a2811e2', name: 'Solana', decimals: 18 },
    'ETH': { address: '0x3ca5269b5c54d4c807ca0df7eeb2cb7a5327e77d', name: 'Ethereum', decimals: 18 },
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

  const tokenSymbols = Object.keys(ERC20_CONTRACTS).filter(symbol => symbol !== 'ETH');
  
  for (const symbol of tokenSymbols) {
    const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
    if (!contract || !contract.address) {
      console.warn(`[BlockchainService] Contract address for ${symbol} is not configured.`);
      continue;
    }
    
    try {
      const balance = await publicClient.readContract({
        address: contract.address,
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
  const PERPETUALS_CONTRACT_ADDRESS = '0xf62eec897fa5ef36a957702aa4a45b58fe8fe312';
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
