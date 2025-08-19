
'use server';

import { config } from 'dotenv';
import path from 'path';
import { createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';

config({ path: path.resolve(process.cwd(), 'src/.env') });

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545';

if (!process.env.LOCAL_PRIVATE_KEY) {
  throw new Error('FATAL: LOCAL_PRIVATE_KEY is not defined in the environment variables. Please check your .env file.');
}

const account = privateKeyToAccount(process.env.LOCAL_PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
  account,
  chain: localhost,
  transport: http(LOCAL_CHAIN_RPC_URL, {
    fetchOptions: {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    }
  }),
});

const perpetualsAbi = parseAbi([
  "function openPosition(uint8 side, uint256 size, uint256 collateral)",
  "function closePosition()"
]);

const erc20Abi = parseAbi([
    "function approve(address spender, uint256 amount) external returns (bool)"
]);

const PERPETUALS_CONTRACT_ADDRESS = '0xf62eec897fa5ef36a957702aa4a45b58fe8fe312';
const USDT_CONTRACT_ADDRESS = '0xf48883f2ae4c4bf4654f45997fe47d73daa4da07';

export async function approveCollateralAction(amount: bigint): Promise<{ success: boolean; txHash: `0x${string}` }> {
  if (!PERPETUALS_CONTRACT_ADDRESS) throw new Error('Perpetuals contract address is not configured');
  if (!USDT_CONTRACT_ADDRESS) throw new Error('USDT contract address is not configured.');

  const txHash = await client.writeContract({
    account,
    address: USDT_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: "approve",
    args: [PERPETUALS_CONTRACT_ADDRESS, amount]
  });

  return { success: true, txHash };
}

export async function openPositionAction(params: {
    side: number;
    size: bigint;
    collateral: bigint;
}): Promise<{ success: boolean; txHash: `0x${string}` }> {
  if (!PERPETUALS_CONTRACT_ADDRESS) throw new Error("Perpetuals contract address not set.");

  const txHash = await client.writeContract({
    account,
    address: PERPETUALS_CONTRACT_ADDRESS,
    abi: perpetualsAbi,
    functionName: "openPosition",
    args: [params.side, params.size, params.collateral]
  });

  return { success: true, txHash };
}

export async function closePositionAction(): Promise<{ success: boolean, txHash: `0x${string}` }> {
    if (!PERPETUALS_CONTRACT_ADDRESS) throw new Error("Perpetuals contract address not set.");
    
    const txHash = await client.writeContract({
        account,
        address: PERPETUALS_CONTRACT_ADDRESS,
        abi: perpetualsAbi,
        functionName: "closePosition",
        args: []
    });

    return { success: true, txHash };
}

    
