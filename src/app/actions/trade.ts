
'use server';

/**
 * @deprecated This server action is deprecated. Transaction logic has been moved to the client-side WalletContext.
 */
export async function approveCollateralAction(amount: string): Promise<{ success: boolean; txHash: `0x${string}` }> {
  throw new Error("approveCollateralAction is deprecated. Use the client-side approveCollateral function from WalletContext.");
}

/**
 * @deprecated This server action is deprecated. Transaction logic has been moved to the client-side WalletContext.
 */
export async function openPositionAction(params: {
    side: number;
    size: string;
    collateral: string;
}): Promise<{ success: boolean; txHash: `0x${string}` }> {
  throw new Error("openPositionAction is deprecated. Use the client-side openPosition function from WalletContext.");
}

/**
 * @deprecated This server action is deprecated. Transaction logic has been moved to the client-side WalletContext.
 */
export async function closePositionAction(): Promise<{ success: boolean, txHash: `0x${string}` }> {
    throw new Error("closePositionAction is deprecated. Use the client-side closePosition function from WalletContext.");
}
