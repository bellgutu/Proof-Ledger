

'use server';

import { createWalletClient, custom, http, createPublicClient, parseUnits, getContract, formatUnits } from 'viem';
import { localhost } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ERC20_CONTRACTS, DEX_CONTRACT_ADDRESS, VAULT_CONTRACT_ADDRESS, GOVERNOR_CONTRACT_ADDRESS, DEX_ABI, VAULT_ABI, GOVERNOR_ABI } from '@/services/blockchain-service';

const localKey = process.env.LOCAL_PRIVATE_KEY;
const anvilChain = { ...localhost, id: 31337 };


export async function addLiquidityAction(params: {
    tokenA: `0x${string}`;
    tokenB: `0x${string}`;
    stable: boolean;
    amountADesired: bigint;
    amountBDesired: bigint;
}): Promise<{ success: boolean; txHash: `0x${string}` }> {
    throw new Error("This server action is deprecated. Liquidity is now added on the client-side via WalletContext.");
}


export async function swapTokensAction(
    fromToken: string,
    toToken: string,
    amountIn: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    throw new Error("This server action is deprecated. Swaps are now handled client-side via WalletContext.");
}


export async function depositToVaultAction(
    amount: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    throw new Error("This server action is deprecated. Vault deposits are now handled client-side via WalletContext.");
}

export async function withdrawFromVaultAction(
    amount: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    throw new Error("This server action is deprecated. Vault withdrawals are now handled client-side via WalletContext.");
}

export async function voteOnProposalAction(
    proposalId: string,
    support: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    throw new Error("This server action is deprecated. Voting is now handled client-side via WalletContext.");
}
