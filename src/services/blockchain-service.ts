

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
  balance: number;
}

const ERC20_CONTRACTS: { [symbol: string]: { address: string, name: string, decimals: number } } = {
    'WETH': { address: '0x0165878A594ca255338adfa4d48449f69242Eb8F', name: 'Wrapped Ether', decimals: 18 },
    'USDT': { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', name: 'Tether', decimals: 6 },
    'BTC': { address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', name: 'Bitcoin', decimals: 8 },
    'LINK': { address: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6', name: 'Chainlink', decimals: 18 },
    'BNB': { address: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788', name: 'BNB', decimals: 18 },
    'SOL': { address: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0', name: 'Solana', decimals: 9 },
};

const PERPETUALS_CONTRACT_ADDRESS = '0xc5a5C42992dECbae36851359345FE25997F5C42d';
const VAULT_CONTRACT_ADDRESS = '0x09635F643e140090A9A8Dcd712eD6285858ceBef';
const PRICE_ORACLE_ADDRESS = '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F';

export async function getWalletAssets(address: string): Promise<ChainAsset[]> {
  console.log(`[BlockchainService] Fetching all assets for address: ${address}`);
  
  const assets: ChainAsset[] = [];
  const BALANCE_OF_SIGNATURE = '0x70a08231';
  
  // --- 1. Fetch ETH Balance ---
  try {
    console.log("[BlockchainService] Fetching ETH balance...");
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
            console.log(`[BlockchainService] Raw ETH balance: ${rawBalance}`);
            const ethBalance = parseFloat(formatUnits(rawBalance, 18));
            console.log(`[BlockchainService] Formatted ETH balance: ${ethBalance}`);
            assets.push({ symbol: 'ETH', name: 'Ethereum', balance: ethBalance });
        } else if (ethData.error) {
             console.warn(`[BlockchainService] ETH balance RPC Error: ${ethData.error.message}`);
        }
    } else {
         console.error(`[BlockchainService] Failed to fetch ETH balance with status: ${ethBalanceResponse.status}`);
    }
  } catch (error) {
    console.error("[BlockchainService] Error connecting to local blockchain for ETH balance:", error);
  }

  // --- 2. Fetch ERC20 Balances ---
  for (const symbol in ERC20_CONTRACTS) {
      try {
          const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
          if (!contract || !contract.address) continue;
          
          console.log(`\n[BlockchainService] Checking balance for ${symbol}...`);
          
          const paddedAddress = address.substring(2).padStart(64, '0');
          
          const response = await fetch(LOCAL_CHAIN_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: contract.address,
                    data: `${BALANCE_OF_SIGNATURE}${paddedAddress}`
                }, 'latest'],
                id: 1,
            }),
          });

          if (response.ok) {
              const data = await response.json();
               if (data.result && data.result !== '0x') {
                  const rawBalance = BigInt(data.result);
                  console.log(`[BlockchainService] Raw ${symbol} balance: ${rawBalance}`);
                  console.log(`[BlockchainService] Using ${contract.decimals} decimals for ${symbol}`);
                  
                  const balance = parseFloat(formatUnits(rawBalance, contract.decimals));
                  console.log(`[BlockchainService] Formatted ${symbol} balance: ${balance}`);

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
  

  console.log('\n[BlockchainService] Finished fetching all assets. Final result:', assets);
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
  console.log(`[BlockchainService] Sending ${amount} ${tokenSymbol} from ${fromAddress} to ${toAddress}`);

  let txParams;
  const gasPrice = await getGasPrice();

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
    const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
    if (!contractInfo) {
      throw new Error(`Contract for ${tokenSymbol} is not configured.`);
    }
    const transferSignature = '0xa9059cbb';
    const paddedToAddress = toAddress.substring(2).padStart(64, '0');
    
    // Correctly parse the amount using the token's specific decimals
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
    throw new Error(`Transaction RPC Error: ${data.error.message}`);
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
}

export async function getActivePosition(address: string): Promise<Position | null> {
  console.log(`[BlockchainService] Fetching active position for ${address}...`);
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    console.warn("[BlockchainService] Perpetuals contract address not set. Returning null.");
    return null;
  }

  try {
    const getPositionFunctionSignature = '0x48694038'; // keccak256("getUserPosition(address)")
    const paddedAddress = address.substring(2).padStart(64, '0');
    
    const response = await fetch(LOCAL_CHAIN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: PERPETUALS_CONTRACT_ADDRESS,
          data: `${getPositionFunctionSignature}${paddedAddress}`
        }, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`eth_call to getUserPosition failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC Error for getUserPosition: ${data.error.message}`);
    }
    
    const resultData = data.result.substring(2);
    if (resultData.length < 320) { // 5 fields * 64 chars/field
      console.warn("[BlockchainService] getUserPosition returned insufficient data, likely no position.");
      return null;
    }
    
    // Decode the struct fields
    const side = parseInt(resultData.slice(0, 64), 16) === 0 ? 'long' : 'short';
    const size = parseFloat(formatUnits(BigInt('0x' + resultData.slice(64, 128)), 8));
    const collateral = parseFloat(formatUnits(BigInt('0x' + resultData.slice(128, 192)), 6));
    const entryPrice = parseFloat(formatUnits(BigInt('0x' + resultData.slice(192, 256)), 8));
    const active = parseInt(resultData.slice(256, 320), 16) === 1;

    if (!active) {
        return null; // Don't return inactive positions
    }

    return { side, size, collateral, entryPrice, active };

  } catch (error) {
    console.error("[BlockchainService] getActivePosition failed:", error);
    return null;
  }
}


export async function openPosition(fromAddress: string, params: {
  size: number;
  direction: 'long' | 'short';
  leverage: number;
}): Promise<{ success: boolean; txHash: string }> {
  console.log('[BlockchainService] Opening position with params:', params);
  
  const openPositionSignature = '0x5806b727'; // openPosition(uint8,uint256,uint256)

  const sideHex = (params.direction === 'long' ? 0 : 1).toString(16).padStart(64, '0');
  const sizeHex = parseUnits(params.size.toString(), 8).toString(16).padStart(64, '0');
  const leverageHex = BigInt(params.leverage).toString(16).padStart(64, '0');
  
  const dataPayload = `0x${openPositionSignature.slice(2)}${sideHex}${sizeHex}${leverageHex}`;
  
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
    console.log(`[BlockchainService] Closing active position for ${fromAddress}`);
    
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

    
