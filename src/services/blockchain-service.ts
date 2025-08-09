
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
    'WETH': { address: 'YOUR_WETH_CONTRACT_ADDRESS', name: 'Wrapped Ether', decimals: 18 },
    'USDC': { address: 'YOUR_USDC_CONTRACT_ADDRESS', name: 'USD Coin', decimals: 6 },
    // Add other tokens here, for example:
    // 'LINK': { address: '0x...', name: 'Chainlink', decimals: 18 },
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
        const contract = ERC20_CONTRACTS[symbol];
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

        if (!erc20response.ok) throw new Error(`Failed to fetch ${symbol} balance with status: ${erc20response.status}`);
        const erc20data = await erc20response.json();
        if (erc20data.error) throw new Error(`${symbol} balance RPC Error: ${erc20data.error.message}`);
        
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
 * Simulates fetching a gas fee. In a real app, this would use eth_gasPrice.
 * @returns A promise that resolves to a simulated gas fee in ETH.
 */
export async function getGasFee(): Promise<number> {
    const gasPrice = 20e-9; // 20 Gwei
    const gasLimit = 21000; 
    return gasPrice * gasLimit;
}

/**
 * Sends a transaction for ETH or an ERC20 token.
 * This is a placeholder function. You will need to implement the actual `eth_sendTransaction` call.
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
  console.log(`[BlockchainService] Simulating send of ${amount} ${tokenSymbol} from ${fromAddress} to ${toAddress}`);

  // In a real application, you would use a library like ethers.js or viem
  // to construct the correct transaction data (e.g., for an ERC20 transfer)
  // and then use eth_sendTransaction. This is a placeholder.

  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

  return {
    success: true,
    txHash: `0x_simulated_${Array(54).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
  };
}
