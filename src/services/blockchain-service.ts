

/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * Each function is designed to be connected to your blockchain's RPC endpoint.
 */
import { parseUnits, type Abi, formatUnits } from 'viem';

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545'; // Your blockchain's HTTP RPC endpoint

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: string; // Use string to maintain precision and prevent floating point errors
}

export const ERC20_CONTRACTS: { [symbol: string]: { address: string | undefined, name: string, decimals: number } } = {
    'USDT': { address: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS, name: 'Tether', decimals: 6 },
    'USDC': { address: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS, name: 'USD Coin', decimals: 6 },
    'WETH': { address: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS, name: 'Wrapped Ether', decimals: 18 },
    'LINK': { address: process.env.NEXT_PUBLIC_LINK_CONTRACT_ADDRESS, name: 'Chainlink', decimals: 18 },
    'ETH': { address: undefined, name: 'Ethereum', decimals: 18 }, // Add ETH for decimal consistency
};

const PERPETUALS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS;
const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
const PRICE_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS;
const DEX_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_DEX_ROUTER_ADDRESS;


export async function getWalletAssets(address: string): Promise<ChainAsset[]> {
  const assets: ChainAsset[] = [];
  const BALANCE_OF_SIGNATURE = '0x70a08231';
  
  // --- 1. Fetch ETH Balance ---
  try {
    const ethBalanceResponse = await fetch(LOCAL_CHAIN_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
        }),
    });
    if (ethBalanceResponse.ok) {
        const ethData = await ethBalanceResponse.json();
        if (ethData.result) {
            const rawBalance = BigInt(ethData.result);
            const ethBalance = formatUnits(rawBalance, 18);
            assets.push({ symbol: 'ETH', name: 'Ethereum', balance: ethBalance });
        } else if (ethData.error) {
             console.warn(`[BlockchainService] ETH balance RPC Error: ${ethData.error.message}`);
             throw new Error(`ETH balance RPC Error: ${ethData.error.message}`);
        }
    } else {
         console.error(`[BlockchainService] Failed to fetch ETH balance with status: ${ethBalanceResponse.status}`);
         throw new Error(`Failed to fetch ETH balance with status: ${ethBalanceResponse.status}`);
    }
  } catch (error) {
    console.error("[BlockchainService] Error connecting to local blockchain for ETH balance:", error);
    throw new Error("Could not connect to the local blockchain to fetch ETH balance. Is the node running?");
  }

  // --- 2. Fetch ERC20 Balances ---
  for (const symbol in ERC20_CONTRACTS) {
      try {
          if (symbol === 'ETH') continue; // Already handled
          const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
          if (!contract || !contract.address) {
              console.warn(`[BlockchainService] Skipping ${symbol}: address not found in .env file.`);
              continue;
          };
          
          const paddedAddress = address.substring(2).padStart(64, '0');
          
          const response = await fetch(LOCAL_CHAIN_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    from: address,
                    to: contract.address,
                    data: `${BALANCE_OF_SIGNATURE}${paddedAddress}`
                }, 'latest'],
                id: 1,
            }),
          });

          if (response.ok) {
              const data = await response.json();
               if (data.result && data.result !== '0x') {
                  // --- ADD FIRST LOG HERE ---
                  console.log(`[1. SERVICE] Raw data for ${symbol}:`, data.result);

                  const rawBalance = BigInt(data.result);
                  const balance = formatUnits(rawBalance, contract.decimals);

                  // --- ADD SECOND LOG HERE ---
                  console.log(`[2. SERVICE] Formatted data for ${symbol}:`, balance);

                  assets.push({ symbol, name: contract.name, balance });
               } else if (data.error) {
                  console.warn(`[BlockchainService] RPC call for ${symbol} balance failed, but continuing. Error: ${data.error.message}`);
               }
          } else {
              console.error(`[BlockchainService] Failed to fetch ${symbol} balance with status: ${response.status}`);
          }
      } catch(e) {
          console.error(`[BlockchainService] Error fetching balance for ${symbol}:`, e)
      }
  }
  
  return assets;
}

export async function getGasPrice(): Promise<bigint> {
    try {
      const response = await fetch(LOCAL_CHAIN_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_gasPrice',
              params: [],
              id: 1,
          }),
      });
      if (!response.ok) throw new Error(`Failed to fetch gas price with status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(`Gas price RPC Error: ${data.error.message}`);
      return BigInt(data.result);
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

  let txParams;
  const gasPrice = await getGasPrice();

  const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
  if (!contractInfo) {
    throw new Error(`Token info for ${tokenSymbol} not found.`);
  }

  if (tokenSymbol === 'ETH') {
    const valueInWei = parseUnits(amount.toString(), 18);
    txParams = {
        from: fromAddress,
        to: toAddress,
        value: `0x${valueInWei.toString(16)}`,
        gas: `0x${(21000).toString(16)}`, 
        gasPrice: `0x${gasPrice.toString(16)}`,
    };
  } else {
    if (!contractInfo.address) {
      throw new Error(`Contract for ${tokenSymbol} is not configured in .env file.`);
    }
    const transferSignature = '0xa9059cbb';
    const paddedToAddress = toAddress.substring(2).padStart(64, '0');
    
    const valueInSmallestUnit = parseUnits(amount.toString(), contractInfo.decimals);
    const paddedValue = valueInSmallestUnit.toString(16).padStart(64, '0');
    
    txParams = {
      from: fromAddress,
      to: contractInfo.address,
      data: `${transferSignature}${paddedToAddress}${paddedValue}`,
      gas: `0x${(60000).toString(16)}`,
      gasPrice: `0x${gasPrice.toString(16)}`,
    };
  }
  
  const response = await fetch(LOCAL_CHAIN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [txParams],
          id: 1,
      }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("eth_sendTransaction error body:", errorBody);
    throw new Error(`eth_sendTransaction failed with status: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    console.error("RPC Error details:", data.error);
    const errorMessage = data.error.message || JSON.stringify(data.error);
    throw new Error(`Transaction RPC Error: ${errorMessage}`);
  }

  return {
    success: true,
    txHash: data.result,
  };
}


export interface Position {
  side: 'long' | 'short';
  size: number;
  collateral: number;
  entryPrice: number;
  active: boolean;
  takeProfit?: number;
  stopLoss?: number;
}

export async function getActivePosition(address: string, assetSymbol: string): Promise<Position | null> {
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    console.warn("[BlockchainService] Perpetuals contract address not set in .env. Returning null.");
    return null;
  }

  try {
    const getPositionFunctionSignature = '0xddca7a8c'; // keccak256("positions(address)")
    const paddedAddress = address.substring(2).padStart(64, '0');
    
    const response = await fetch(LOCAL_CHAIN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          from: address,
          to: PERPETUALS_CONTRACT_ADDRESS,
          data: `${getPositionFunctionSignature}${paddedAddress}`
        }, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`eth_call to getActivePosition failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC Error for getActivePosition: ${data.error.message}`);
    }
    
    const resultData = data.result.substring(2);
    if (resultData.length < 448) { 
      console.warn(`[BlockchainService] getActivePosition returned unexpected data length: ${resultData.length}. Assuming no active position.`);
      return null;
    }
    
    let offset = 4 * 64; // Active flag is the 5th returned value (index 4)
    const active = parseInt(resultData.slice(offset, offset + 64), 16) === 1;

    if (!active) {
        return null;
    }
    
    const positionAssetInfo = ERC20_CONTRACTS[assetSymbol as keyof typeof ERC20_CONTRACTS];
    const collateralAssetInfo = ERC20_CONTRACTS['USDT'];
    const priceDecimal = 18; // Oracles often use 18 decimals for price feeds.

    if (!positionAssetInfo || !collateralAssetInfo) {
        throw new Error(`Asset info for ${assetSymbol} or collateral info for USDT not available for decoding position.`);
    }
    
    offset = 0;
    const side = parseInt(resultData.slice(offset, offset + 64), 16) === 0 ? 'long' : 'short';
    offset += 64;
    const size = Number(formatUnits(BigInt('0x' + resultData.slice(offset, offset + 64)), positionAssetInfo.decimals));
    offset += 64;
    const collateral = Number(formatUnits(BigInt('0x' + resultData.slice(offset, offset + 64)), collateralAssetInfo.decimals));
    offset += 64;
    const entryPrice = Number(formatUnits(BigInt('0x' + resultData.slice(offset, offset + 64)), priceDecimal));
    offset += 64;
    // 'active' is already decoded
    offset += 64; 

    const rawTakeProfit = BigInt('0x' + resultData.slice(offset, offset + 64));
    offset += 64;
    const rawStopLoss = BigInt('0x' + resultData.slice(offset, offset + 64));

    const takeProfit = rawTakeProfit > 0 ? Number(formatUnits(rawTakeProfit, priceDecimal)) : undefined;
    const stopLoss = rawStopLoss > 0 ? Number(formatUnits(rawStopLoss, priceDecimal)) : undefined;

    return { side, size, collateral, entryPrice, active, takeProfit, stopLoss };

  } catch (error) {
    console.error("[BlockchainService] getActivePosition failed:", error);
    return null;
  }
}


export async function openPosition(fromAddress: string, params: {
  asset: string;
  size: number;
  direction: 'long' | 'short';
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
}): Promise<{ success: boolean; txHash: string }> {
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    throw new Error("Perpetuals contract address not set in .env file.");
  }
  
  const assetInfo = ERC20_CONTRACTS[params.asset as keyof typeof ERC20_CONTRACTS];
  const collateralInfo = ERC20_CONTRACTS['USDT'];
  const priceDecimal = 18;

  if (!assetInfo || !collateralInfo) {
      throw new Error(`Asset info for ${params.asset} or collateral info for USDT not available for encoding openPosition call.`);
  }

  // keccak256("openPosition(bool,uint256,uint256,uint256,uint256)")
  const openPositionSignature = '0x153c1374';

  const isLongHex = (params.direction === 'long' ? 1 : 0).toString(16).padStart(64, '0');
  const sizeHex = parseUnits(params.size.toString(), assetInfo.decimals).toString(16).padStart(64, '0');
  const leverageHex = BigInt(params.leverage).toString(16).padStart(64, '0');
  const takeProfitHex = params.takeProfit ? parseUnits(params.takeProfit.toString(), priceDecimal).toString(16).padStart(64, '0') : ''.padEnd(64, '0');
  const stopLossHex = params.stopLoss ? parseUnits(params.stopLoss.toString(), priceDecimal).toString(16).padStart(64, '0') : ''.padEnd(64, '0');
  
  const dataPayload = `${openPositionSignature}${isLongHex}${sizeHex}${leverageHex}${takeProfitHex}${stopLossHex}`;
  
  const txResponse = await fetch(LOCAL_CHAIN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [{
              from: fromAddress,
              to: PERPETUALS_CONTRACT_ADDRESS,
              data: dataPayload,
              gas: `0x${(500000).toString(16)}`, 
          }],
          id: 1,
      }),
  });

  const txData = await txResponse.json();
  if (txData.error) {
    throw new Error(`Open position RPC Error: ${txData.error.message}`);
  }

  return { success: true, txHash: txData.result };
}

export async function closePosition(fromAddress: string): Promise<{ success: boolean, txHash: string }> {
    if (!PERPETUALS_CONTRACT_ADDRESS) {
      throw new Error("Perpetuals contract address not set in .env file.");
    }
    
    const closePositionSignature = '0x43d726d6'; // keccak256("closePosition()")
    
    const txResponse = await fetch(LOCAL_CHAIN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [{
              from: fromAddress,
              to: PERPETUALS_CONTRACT_ADDRESS,
              data: closePositionSignature,
              gas: `0x${(300000).toString(16)}`,
          }],
          id: 1,
      }),
    });

    const txData = await txResponse.json();
    if (txData.error) {
        throw new Error(`Close position RPC Error: ${txData.error.message}`);
    }

    return { success: true, txHash: txData.result };
}
