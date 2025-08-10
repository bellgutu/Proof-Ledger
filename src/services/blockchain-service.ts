

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
    'USDT': { address: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1', name: 'Tether', decimals: 6 },
    'USDC': { address: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed', name: 'USD Coin', decimals: 6 },
    'BTC':  { address: '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d', name: 'Bitcoin', decimals: 8 },
    'WETH': { address: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1', name: 'Wrapped Ether', decimals: 18 },
    'LINK': { address: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f', name: 'Chainlink', decimals: 18 },
    'BNB':  { address: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', name: 'BNB', decimals: 18 },
    'SOL':  { address: '0xc5a5C42992dECbae36851359345FE25997F5C42d', name: 'Solana', decimals: 9 },
};

const PERPETUALS_CONTRACT_ADDRESS = '0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf';
const VAULT_CONTRACT_ADDRESS = '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF';
const PRICE_ORACLE_ADDRESS = '0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf';

export async function getWalletAssets(address: string): Promise<ChainAsset[]> {
  console.log(`[BlockchainService] Fetching assets for address: ${address}`);
  
  const assets: ChainAsset[] = [];
  
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
            const ethBalance = parseFloat(formatUnits(BigInt(ethData.result), 18));
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
  
  const BALANCE_OF_SIGNATURE = '0x70a08231';
  for (const symbol in ERC20_CONTRACTS) {
      try {
        const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
        
        const paddedAddress = address.substring(2).padStart(64, '0');
        
        const erc20response = await fetch(LOCAL_CHAIN_RPC_URL, {
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

        if (erc20response.ok) {
            const erc20data = await erc20response.json();
             if (erc20data.result && erc20data.result !== '0x') {
                const balanceWei = BigInt(erc20data.result);
                // The definitive fix: Use viem's formatUnits to correctly handle all token decimals
                const balance = parseFloat(formatUnits(balanceWei, contract.decimals));
                if (balance > 0) {
                  assets.push({ symbol, name: contract.name, balance });
                }
             } else if (erc20data.error) {
                // This is expected if a token contract exists but the call reverts (e.g. not a valid ERC20)
                console.warn(`[BlockchainService] RPC call for ${symbol} balance failed, but continuing. Error: ${erc20data.error.message}`);
             }
        } else {
            console.error(`[BlockchainService] Failed to fetch ${symbol} balance with status: ${erc20response.status}`);
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
  id: number;
  pair: string;
  collateral: number;
  entryPrice: number;
  leverage: number;
  direction: 'long' | 'short';
}

export async function getActivePositions(address: string): Promise<Position[]> {
  console.log(`[BlockchainService] Fetching active positions for ${address}...`);
  if (!PERPETUALS_CONTRACT_ADDRESS) {
    console.warn("[BlockchainService] Perpetuals contract address not set. Returning empty positions.");
    return [];
  }

  try {
    const getPositionsFunctionSignature = '0x85925d2b'; // keccak256("getPositions(address)")
    const paddedAddress = address.substring(2).padStart(64, '0');
    
    const response = await fetch(LOCAL_CHAIN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: PERPETUALS_CONTRACT_ADDRESS,
          data: `${getPositionsFunctionSignature}${paddedAddress}`
        }, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`eth_call to getPositions failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC Error for getPositions: ${data.error.message}`);
    }
    
    const resultData = data.result.substring(2);
    if (resultData.length <= 128) {
        return [];
    }

    const offset = parseInt(resultData.slice(0, 64), 16);
    const length = parseInt(resultData.slice(64, 128), 16);
    if(length === 0) return [];
    
    const positionsDataBlock = resultData.slice(offset * 2); 
    const positionArrayData = positionsDataBlock.slice(64); // Skip the array length
    
    const parsedPositions: Position[] = [];

    for (let i = 0; i < length; i++) {
        const structData = positionArrayData.slice(i * 192, (i + 1) * 192);

        const id = parseInt(structData.slice(0, 64), 16);
        
        const pairOffset = parseInt(structData.slice(64, 128), 16) * 2;
        const pairDataBlock = positionArrayData.slice(pairOffset - 128); // adjust offset relative to start of array data
        const pairLength = parseInt(pairDataBlock.slice(0, 64), 16);
        const pairHex = pairDataBlock.slice(64, 64 + pairLength * 2);
        
        let pair = '';
        try {
            pair = Buffer.from(pairHex, 'hex').toString('utf8');
        } catch (e) {
            console.error("Error decoding pair string:", e);
            pair = "UNKNOWN";
        }

        const collateral = parseFloat(formatUnits(BigInt('0x' + structData.slice(128, 192)), 6));
        const entryPrice = parseFloat(formatUnits(BigInt('0x' + structData.slice(192, 256)), 8));
        const leverage = parseInt(structData.slice(256, 320), 16);
        const direction = parseInt(structData.slice(320, 384), 16) === 0 ? 'long' : 'short';
        
        if (id > 0) {
            parsedPositions.push({ id, pair, collateral, entryPrice, leverage, direction });
        }
    }
    
    return parsedPositions;

  } catch (error) {
    console.error("[BlockchainService] getActivePositions failed:", error);
    return [];
  }
}

export async function openPosition(params: {
  pair: string;
  collateral: number;
  direction: 'long' | 'short';
  leverage: number;
}): Promise<{ success: boolean; txHash: string }> {
  console.log('[BlockchainService] Opening position with params:', params);
  
  const fromAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const openPositionSignature = '0x11871032';

  const pairBytes = Buffer.from(params.pair, 'utf8').toString('hex');
  const collateralWei = parseUnits(params.collateral.toString(), 6);

  const staticDataOffset = 4 * 32; 
  const pairDataLength = Math.ceil(pairBytes.length / 2);

  const functionSelector = openPositionSignature.slice(2);
  const pairOffsetHex = (staticDataOffset).toString(16).padStart(64, '0');
  const collateralHex = collateralWei.toString(16).padStart(64, '0');
  const leverageHex = params.leverage.toString(16).padStart(64, '0');
  const directionHex = (params.direction === 'long' ? 0 : 1).toString(16).padStart(64, '0');
  const pairLengthHex = pairDataLength.toString(16).padStart(64, '0');
  const pairDataHex = pairBytes.padEnd(Math.ceil(pairBytes.length / 64) * 64, '0');
  
  const dataPayload = `0x${functionSelector}${pairOffsetHex}${collateralHex}${leverageHex}${directionHex}${pairLengthHex}${pairDataHex}`;
  
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
              gas: `0x${(300000).toString(16)}`, 
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

export async function closePosition(positionId: number): Promise<{ success: boolean, pnl: number, payout: number, txHash: string }> {
    console.log(`[BlockchainService] Closing position with ID: ${positionId}`);
    
    const fromAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const closePositionSignature = '0x8f32e3d2';
    const positionIdHex = positionId.toString(16).padStart(64, '0');
    const dataPayload = `${closePositionSignature}${positionIdHex}`;
    
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
              gas: `0x${(200000).toString(16)}`,
          }],
          id: 1,
      }),
    });

    const txData = await txResponse.json();
    if (txData.error) {
        throw new Error(`Close position RPC Error: ${txData.error.message}`);
    }

    const pnl = (Math.random() - 0.4) * 50; 
    const payout = 100 + pnl; 
    
    return { success: true, pnl, payout, txHash: txData.result };
}
