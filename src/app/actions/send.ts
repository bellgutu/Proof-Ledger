
'use server';

import { createWalletClient, http, parseUnits, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const LOCAL_CHAIN_RPC_URL = 'http://host.docker.internal:8545';

const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}`, decimals: number } } = {
    'USDT': { address: '0xf48883f2ae4c4bf4654f45997fe47d73daa4da07', decimals: 18 },
    'USDC': { address: '0x093d305366218d6d09ba10448922f10814b031dd', decimals: 18 },
    'WETH': { address: '0x492844c46cef2d751433739fc3409b7a4a5ba9a7', decimals: 18 },
    'LINK': { address: '0xf0f5e9b00b92f3999021fd8b88ac75c351d93fc7', decimals: 18 },
};

const erc20Abi = [
    {
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    }
] as const;

export async function sendTokensAction(
  toAddress: string,
  tokenSymbol: string,
  amount: number,
  fromAddress: string,
): Promise<{ success: boolean; txHash: `0x${string}` }> {

  if (!process.env.LOCAL_PRIVATE_KEY) {
    throw new Error("LOCAL_PRIVATE_KEY is not set in the environment variables.");
  }
  
  const account = privateKeyToAccount(`0x${process.env.LOCAL_PRIVATE_KEY}`);

  const walletClient = createWalletClient({
    account,
    chain: localhost,
    transport: http(LOCAL_CHAIN_RPC_URL),
  });

  try {
    let txHash: `0x${string}`;
    const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];

    if (tokenSymbol === 'ETH') {
        txHash = await walletClient.sendTransaction({
            to: toAddress as `0x${string}`,
            value: parseUnits(amount.toString(), 18)
        });
    } else {
        if (!contractInfo || !contractInfo.address) {
            throw new Error(`Token symbol ${tokenSymbol} not supported for sending.`);
        }
        txHash = await walletClient.writeContract({
            address: contractInfo.address,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [toAddress as `0x${string}`, parseUnits(amount.toString(), contractInfo.decimals)],
            account: fromAddress as `0x${string}`
        });
    }
    
    const publicClient = createPublicClient({ chain: localhost, transport: http(LOCAL_CHAIN_RPC_URL) });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if(receipt.status === 'reverted') {
      throw new Error("Transaction reverted by the contract.");
    }
    
    return { success: true, txHash };

  } catch (error: any) {
    console.error('Transaction failed:', error);
    throw new Error(error.shortMessage || error.message || "An unknown error occurred during the transaction.");
  }
}
