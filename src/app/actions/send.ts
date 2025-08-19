
'use server';

/**
 * @deprecated This server action has been deprecated in favor of client-side transaction handling
 * directly within the wallet context to avoid server-to-blockchain networking issues.
 * The new implementation uses the browser's wallet provider (e.g., MetaMask) to sign and send.
 * See `src/contexts/wallet-context.tsx`.
 */
export async function sendTokensAction(
  toAddress: string,
  tokenSymbol: string,
  amount: number,
): Promise<{ success: boolean; txHash: `0x${string}` }> {

  throw new Error('This `sendTokensAction` is deprecated. Use the client-side `sendTokens` function from `useWallet` context instead.');

}
