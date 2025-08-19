
'use server';

import { createWalletClient, http, parseUnits, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const LOCAL_CHAIN_RPC_URL = 'http://host.docker.internal:8545';
const PERPETUALS_CONTRACT_ADDRESS = '0xf62eec897fa5ef36a957702aa4a45b58fe8fe312';
const USDT_CONTRACT_ADDRESS = '0xf48883f2ae4c4bf4654f45997fe47d73daa4da07';

const erc20Abi = [
    {
        "constant": false,
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    }
] as const;

const perpetualsAbi = [
    {
        "inputs": [
            { "name": "side", "type": "uint8" },
            { "name": "size", "type": "uint256" },
            { "name": "collateral", "type": "uint256" }
        ],
        "name": "openPosition",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "closePosition",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;


async function getWalletClient() {
  if (!process.env.LOCAL_PRIVATE_KEY) {
    throw new Error("LOCAL_PRIVATE_KEY is not set in the environment variables.");
  }
  const account = privateKeyToAccount(`0x${process.env.LOCAL_PRIVATE_KEY}`);
  
  return createWalletClient({
    account,
    chain: localhost,
    transport: http(LOCAL_CHAIN_RPC_URL),
  });
}

export async function approveCollateralAction(amount: string): Promise<{ success: boolean; txHash: `0x${string}` }> {
  const walletClient = await getWalletClient();
  try {
    const txHash = await walletClient.writeContract({
        address: USDT_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [PERPETUALS_CONTRACT_ADDRESS, parseUnits(amount, 18)]
    });
    
    const publicClient = createPublicClient({ chain: localhost, transport: http(LOCAL_CHAIN_RPC_URL) });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return { success: true, txHash };
  } catch (error: any) {
    console.error('Approval failed:', error);
    throw new Error(error.shortMessage || "Approval transaction failed.");
  }
}

export async function openPositionAction(params: {
    side: number;
    size: string;
    collateral: string;
}): Promise<{ success: boolean; txHash: `0x${string}` }> {
  const walletClient = await getWalletClient();
  const { side, size, collateral } = params;
  try {
    const txHash = await walletClient.writeContract({
        address: PERPETUALS_CONTRACT_ADDRESS,
        abi: perpetualsAbi,
        functionName: 'openPosition',
        args: [side, parseUnits(size, 18), parseUnits(collateral, 18)]
    });
    
    const publicClient = createPublicClient({ chain: localhost, transport: http(LOCAL_CHAIN_RPC_URL) });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return { success: true, txHash };
  } catch (error: any) {
    console.error('Open position failed:', error);
    throw new Error(error.shortMessage || "Open position transaction failed.");
  }
}

export async function closePositionAction(): Promise<{ success: boolean, txHash: `0x${string}` }> {
    const walletClient = await getWalletClient();
    try {
        const txHash = await walletClient.writeContract({
            address: PERPETUALS_CONTRACT_ADDRESS,
            abi: perpetualsAbi,
            functionName: 'closePosition'
        });

        const publicClient = createPublicClient({ chain: localhost, transport: http(LOCAL_CHAIN_RPC_URL) });
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        return { success: true, txHash };
    } catch(error: any) {
        console.error('Close position failed:', error);
        throw new Error(error.shortMessage || "Close position transaction failed.");
    }
}
