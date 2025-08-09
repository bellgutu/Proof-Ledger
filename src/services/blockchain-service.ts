

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
    'WETH': { address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', name: 'Wrapped Ether', decimals: 18 },
    'SOL': { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', name: 'Solana', decimals: 18 },
    'BNB': { address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', name: 'BNB', decimals: 18 },
    'XRP': { address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', name: 'XRP', decimals: 18 },
    'USDT': { address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', name: 'Tether', decimals: 18 },
    'LINK': { address: '0x0165878A594ca255338adfa4d48449f69242Eb8F', name: 'Chainlink', decimals: 18 },
};


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
    if (!ethBalanceResponse.ok) throw new Error(`Failed to fetch ETH balance with status: ${ethBalanceResponse.status}`);
    const ethData = await ethBalanceResponse.json();
    if (ethData.error) throw new Error(`ETH balance RPC Error: ${ethData.error.message}`);
    const ethBalance = parseInt(ethData.result, 16) / 1e18; // Convert from Wei to ETH
    assets.push({ symbol: 'ETH', name: 'Ethereum', balance: ethBalance });

    // 2. Fetch ERC20 Token Balances
    const BALANCE_OF_SIGNATURE = '0x70a08231';
    for (const symbol in ERC20_CONTRACTS) {
        const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
        if (contract.address.startsWith('YOUR_')) {
          console.log(`[BlockchainService] Skipping ${symbol} due to placeholder address.`);
          continue; // Skip if placeholder address
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

        if (!erc20response.ok) {
            console.error(`[BlockchainService] Failed to fetch ${symbol} balance with status: ${erc20response.status}`);
            continue;
        };
        const erc20data = await erc20response.json();
        if (erc20data.error) {
             console.error(`[BlockchainService] ${symbol} balance RPC Error: ${erc20data.error.message}`);
             continue;
        };
        
        const balance = parseInt(erc20data.result, 16) / (10 ** contract.decimals);
        assets.push({ symbol, name: contract.name, balance });
    }

  } catch (error) {
    console.error("Error connecting to local blockchain for wallet assets:", error);
    // Return an empty array or minimal data on error to prevent app crash
    if (assets.length === 0) { // If we failed before getting any balance
        return [{ symbol: 'ETH', name: 'Ethereum', balance: 0 }];
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
