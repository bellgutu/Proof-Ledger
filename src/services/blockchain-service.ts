

/**
 * @fileoverview
 * This service is the bridge between the ProfitForge frontend and your custom local blockchain.
 * Each function is designed to be connected to your blockchain's RPC endpoint.
 */

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545'; // Your blockchain's HTTP RPC endpoint

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: number;
}

// TODO: Add your deployed contract addresses and metadata here.
// The key should be the symbol and the value should be the contract address.
const ERC20_CONTRACTS: { [symbol: string]: { address: string, name: string, decimals: number } } = {
    'WETH': { address: '0x0b306bf915c4d645ff596e518faf3f9669b97016', name: 'Wrapped Ether', decimals: 18 },
    'USDT': { address: '0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae', name: 'Tether', decimals: 6 },
    'SOL': { address: '0x3aa5ebb10dc797cac828524e59a333d0a371443c', name: 'Solana', decimals: 9 },
    'BNB': { address: '0x59b670e9fa9d0a427751af201d676719a970857b', name: 'BNB', decimals: 18 },
    'XRP': { address: '0x322813fd9a801c5507c9de605d63cea4f2ce6c44', name: 'XRP', decimals: 6 },
    'LINK': { address: '0x4a679253410272dd5232b3ff7cf5dbb88f295319', name: 'Chainlink', decimals: 18 },
    'BTC': { address: '0x09635f643e140090a9a8dcd712ed6285858cebef', name: 'Wrapped Bitcoin', decimals: 8 },
};

// TODO: Add your perpetuals protocol contract addresses
const PERPETUALS_CONTRACT_ADDRESS = 'YOUR_PERPETUALS_CONTRACT_ADDRESS';


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
        if (contract.address.startsWith('YOUR_')) {
          console.log(`[BlockchainService] Skipping ${symbol} due to placeholder address.`);
          continue; 
        }

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
                const balance = parseInt(erc20data.result, 16) / (10 ** contract.decimals);
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
    const valueInWei = `0x${(amount * 1e18).toString(16)}`;
    txParams = {
        from: fromAddress,
        to: toAddress,
        value: valueInWei,
        gas: `0x${(21000).toString(16)}`, // Gas limit for ETH transfer
        gasPrice: `0x${gasPrice.toString(16)}`,
    };
  } else {
    // For ERC20 tokens
    const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
    if (!contractInfo || contractInfo.address.startsWith('YOUR_')) {
      throw new Error(`Contract for ${tokenSymbol} is not configured.`);
    }
    const transferSignature = '0xa9059cbb';
    const paddedToAddress = toAddress.substring(2).padStart(64, '0');
    
    // Use BigInt for precise calculation with decimals
    const valueInSmallestUnit = BigInt(Math.floor(amount * (10 ** contractInfo.decimals)));
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

    