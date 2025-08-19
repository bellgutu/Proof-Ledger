
'use server';

/**
 * @deprecated This server action is deprecated. Transaction logic has been moved to the client-side WalletContext.
 */
export async function sendTokensAction(
  toAddress: string,
  tokenSymbol: string,
  amount: number,
  fromAddress: string,
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    throw new Error("sendTokensAction is deprecated. Use the client-side sendTokens function from WalletContext.");
}
