

'use server';

import { createWalletClient, custom, http, createPublicClient, parseUnits, getContract, formatUnits, defineChain, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';
import { ERC20_CONTRACTS, DEX_CONTRACT_ADDRESS, VAULT_CONTRACT_ADDRESS, GOVERNOR_CONTRACT_ADDRESS, DEX_ABI, VAULT_ABI, GOVERNOR_ABI } from '@/services/blockchain-service';

function getAdminWalletClient() {
    const localKey = process.env.LOCAL_PRIVATE_KEY;
    if (!localKey) {
        throw new Error('LOCAL_PRIVATE_KEY is not set in the environment variables.');
    }
    const account = privateKeyToAccount(localKey as `0x${string}`);
    const anvilChain = { ...localhost, id: 31337 };

    return createWalletClient({
        account,
        chain: anvilChain,
        transport: http('http://localhost:8545'),
    });
}

function getAdminPublicClient() {
    const anvilChain = { ...localhost, id: 31337 };
    return createPublicClient({
        chain: anvilChain,
        transport: http('http://localhost:8545'),
    });
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
