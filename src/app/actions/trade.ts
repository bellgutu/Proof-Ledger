
'use server';

import { config } from 'dotenv';
import path from 'path';
import { createWalletClient, http, parseAbi, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';

config({ path: path.resolve(process.cwd(), 'src/.env') });

const LOCAL_CHAIN_RPC_URL = 'http://host.docker.internal:8545';

if (!process.env.LOCAL_PRIVATE_KEY) {
  throw new Error('FATAL: LOCAL_PRIVATE_KEY is not defined in the environment variables. Please check your .env file.');
}

const account = privateKeyToAccount(process.env.LOCAL_PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
  account,
  chain: localhost,
  transport: http(LOCAL_CHAIN_RPC_URL),
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

export async function approveCollateralAction(amount: string): Promise<{ success: boolean; txHash: `0x${string}` }> {
  if (!PERPETUALS_CONTRACT_ADDRESS) throw new Error('Perpetuals contract address is not configured');
  if (!USDT_CONTRACT_ADDRESS) throw new Error('USDT contract address is not configured.');
  
  const amountInWei = parseUnits(amount, 18);

  const txHash = await client.writeContract({
    account,
    address: USDT_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: "approve",
    args: [PERPETUALS_CONTRACT_ADDRESS, amountInWei]
  });

  return { success: true, txHash };
}

export async function openPositionAction(params: {
    side: number;
    size: string;
    collateral: string;
}): Promise<{ success: boolean; txHash: `0x${string}` }> {
  if (!PERPETUALS_CONTRACT_ADDRESS) throw new Error("Perpetuals contract address not set.");
  
  const sizeInWei = parseUnits(params.size, 18);
  const collateralInWei = parseUnits(params.collateral, 18);

  const txHash = await client.writeContract({
    account,
    address: PERPETUALS_CONTRACT_ADDRESS,
    abi: perpetualsAbi,
    functionName: "openPosition",
    args: [params.side, sizeInWei, collateralInWei]
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
