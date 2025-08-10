

/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * Each function is designed to be connected to your blockchain's RPC endpoint.
 */
import { parseUnits } from 'viem';

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545'; // Your blockchain's HTTP RPC endpoint

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: number;
}

// TODO: Add your deployed contract addresses and metadata here.
// The key should be the symbol and the value should be the contract address.
const ERC20_CONTRACTS: { [symbol: string]: { address: string, name: string, decimals: number } } = {
    'USDT': { address: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1', name: 'Tether', decimals: 6 },
    'USDC': { address: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed', name: 'USD Coin', decimals: 6 },
    'BTC': { address: '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d', name: 'Bitcoin', decimals: 8 },
    'WETH': { address: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1', name: 'Wrapped Ether', decimals: 18 },
    'LINK': { address: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f', name: 'Chainlink', decimals: 18 },
    'BNB': { address: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', name: 'BNB', decimals: 18 },
    'SOL': { address: '0xc5a5C42992dECbae36851359345FE25997F5C42d', name: 'Solana', decimals: 9 },
    'XRP': { address: '0x9A676e781A523b5d0C0e43731313A708CB607508', name: 'XRP', decimals: 6 },
};

// TODO: Add your perpetuals protocol contract addresses
const PERPETUALS_CONTRACT_ADDRESS = '0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf';
const VAULT_CONTRACT_ADDRESS = '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF';
const PRICE_ORACLE_ADDRESS = '0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf';


/**
 * Fetches a user's asset balances from the blockchain.
 * This is where you connect your frontend to your on-chain assets.
 * @param address The wallet address to query.
 * @returns A promise that resolves to an array of assets with their balances.
 */
export async function getWalletAssets(address: string): Promise<ChainAsset[]> {
  console.log(`[BlockchainService] Fetching assets for address: ${address}`);
  
  const assets: ChainAsset[] = [];
  
  try {
    // 1. Fetch ETH Balance (Native Asset)
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
            const ethBalance = parseInt(ethData.result, 16) / 1e18;
            assets.push({ symbol: 'ETH', name: 'Ethereum', balance: ethBalance });
        } else if (ethData.error) {
             console.error(`ETH balance RPC Error: ${ethData.error.message}`);
        }
    } else {
         console.error(`Failed to fetch ETH balance with status: ${ethBalanceResponse.status}`);
    }
  } catch (error) {
    console.error("Error connecting to local blockchain for ETH balance:", error);
  }
  
  // 2. Fetch ERC20 Token Balances
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
                const divisor = 10n ** BigInt(contract.decimals);

                // Perform division with BigInts, then convert to a floating-point number.
                const balance = Number(balanceWei / divisor) + Number(balanceWei % divisor) / Number(divisor);
                
                assets.push({ symbol, name: contract.name, balance });
             } else if (erc20data.error) {
                console.error(`[BlockchainService] ${symbol} balance RPC Error: ${erc20data.error.message}`);
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


/**
 * Fetches the current gas price from the blockchain.
 * @returns A promise that resolves to the gas price in wei.
 */
export async function getGasPrice(): Promise<number> {
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
      return parseInt(data.result, 16);
    } catch(e) {
      console.error("[BlockchainService] getGasPrice failed", e);
      return 20000000000; // Return a default value
    }
}

/**
 * Calculates a gas fee estimate.
 * @returns A promise that resolves to a simulated gas fee in ETH.
 */
export async function getGasFee(): Promise<number> {
    const gasPrice = await getGasPrice();
    const gasLimit = 21000; // Standard gas limit for a simple ETH transfer
    const feeInWei = gasPrice * gasLimit;
    return feeInWei / 1e18; // Convert to ETH
}

/**
 * Sends a transaction for ETH or an ERC20 token.
 * This function now constructs and sends a real transaction.
 * @param fromAddress The sender's wallet address.
 * @param toAddress The recipient's wallet address.
 * @param tokenSymbol The symbol of the token to send.
 * @param amount The amount of the token to send.
 * @returns A promise that resolves to an object indicating success and a transaction hash.
 */
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
        gas: `0x${(21000).toString(16)}`, // Gas limit for ETH transfer
        gasPrice: `0x${gasPrice.toString(16)}`,
    };
  } else {
    // For ERC20 tokens
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
      gas: `0x${(60000).toString(16)}`, // Typical gas limit for ERC20 transfer
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


// --- Live Trading Functions ---

export interface Position {
  id: number;
  pair: string;
  collateral: number;
  entryPrice: number;
  leverage: number;
  direction: 'long' | 'short';
}

export async function getActivePositions(address: string): Promise<Position[]> {
  // TODO: Implement the logic to call your smart contract's `getPositions` function.
  // This is a placeholder that returns an empty array.
  console.log(`[BlockchainService] Fetching active positions for ${address}...`);
  if (PERPETUALS_CONTRACT_ADDRESS.startsWith('YOUR_')) {
    console.warn("[BlockchainService] Perpetuals contract address not set. Returning empty positions.");
    return [];
  }
  
  // Example of what the implementation might look like:
  // const response = await fetch(LOCAL_CHAIN_RPC_URL, { ... });
  // const data = await response.json();
  // return parsePositions(data.result);

  return [];
}

export async function openPosition(params: {
  pair: string;
  collateral: number;
  direction: 'long' | 'short';
  leverage: number;
}): Promise<{ success: boolean; txHash: string }> {
  // TODO: Implement the logic to call your smart contract's `openPosition` function.
  console.log('[BlockchainService] Opening position with params:', params);
  if (PERPETUALS_CONTRACT_ADDRESS.startsWith('YOUR_')) {
    throw new Error("Perpetuals contract address not set. Cannot open position.");
  }

  // This is a placeholder response.
  return new Promise(resolve => setTimeout(() => resolve({
    success: true,
    txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('')
  }), 1500));
}

export async function closePosition(positionId: number): Promise<{ success: boolean, pnl: number, payout: number }> {
    // TODO: Implement the logic to call your smart contract's `closePosition` function.
    console.log(`[BlockchainService] Closing position with ID: ${positionId}`);
    if (PERPETUALS_CONTRACT_ADDRESS.startsWith('YOUR_')) {
        throw new Error("Perpetuals contract address not set. Cannot close position.");
    }
    
    // This is a placeholder response.
    const pnl = (Math.random() - 0.4) * 50; // Simulate some profit or loss
    const payout = 100 + pnl; // Placeholder payout
    return new Promise(resolve => setTimeout(() => resolve({
        success: true,
        pnl,
        payout
    }), 1500));
}

    

    
