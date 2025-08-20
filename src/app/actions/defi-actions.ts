

'use server';

import { createWalletClient, custom, http, createPublicClient, parseUnits, getContract, formatUnits } from 'viem';
import { localhost } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ERC20_CONTRACTS, DEX_CONTRACT_ADDRESS, VAULT_CONTRACT_ADDRESS, GOVERNOR_CONTRACT_ADDRESS, DEX_ABI, VAULT_ABI, GOVERNOR_ABI } from '@/services/blockchain-service';

// This file is being kept for potential future use or for admin-only functions,
// but the core user-facing DeFi logic has been moved to the client-side WalletContext
// to properly integrate with MetaMask. The functions below are effectively deprecated
// for the main user flow.

const localKey = process.env.LOCAL_PRIVATE_KEY;

const getAdminWalletClient = () => {
    if (!localKey) {
        throw new Error('LOCAL_PRIVATE_KEY is not set in the environment variables.');
    }
    const account = privateKeyToAccount(`0x${localKey}`);
    const anvilChain = { ...localhost, id: 31337 };

    return createWalletClient({
        account,
        chain: anvilChain,
        transport: http(),
    });
}

const getAdminPublicClient = () => {
    const anvilChain = { ...localhost, id: 31337 };
    return createPublicClient({
        chain: anvilChain,
        transport: http(),
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
