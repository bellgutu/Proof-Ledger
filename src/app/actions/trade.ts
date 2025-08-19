
'use server';

/**
 * @deprecated This server action has been deprecated in favor of client-side transaction handling
 * directly within the wallet context to avoid server-to-blockchain networking issues.
 * The new implementation uses the browser's wallet provider (e.g., MetaMask) to sign and send.
 * See `src/contexts/wallet-context.tsx`.
 */

export async function approveCollateralAction(amount: string): Promise<{ success: boolean; txHash: `0x${string}` }> {
  throw new Error('This `approveCollateralAction` is deprecated. Use the client-side function from `useWallet` context instead.');
}

export async function openPositionAction(params: {
    side: number;
    size: string;
    collateral: string;
}): Promise<{ success: boolean; txHash: `0x${string}` }> {
  throw new Error('This `openPositionAction` is deprecated. Use the client-side function from `useWallet` context instead.');
}

export async function closePositionAction(): Promise<{ success: boolean, txHash: `0x${string}` }> {
    throw new Error('This `closePositionAction` is deprecated. Use the client-side function from `useWallet` context instead.');
}
