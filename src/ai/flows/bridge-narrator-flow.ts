'use server';

/**
 * @fileOverview An AI agent that simulates a cross-chain bridge transaction.
 *
 * - getBridgeTransactionDetails - A function that returns simulated details for a bridge transaction.
 * - BridgeDetails - The return type for the getBridgeTransactionDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BridgeDetailsSchema = z.object({
  summary: z.string().describe('A single, plausible-sounding sentence describing the bridge action.'),
  sourceTxHash: z.string().describe('A simulated transaction hash for the source chain action.'),
  destTxHash: z.string().describe('A simulated transaction hash for the destination chain action.'),
});
export type BridgeDetails = z.infer<typeof BridgeDetailsSchema>;

const BridgeInputSchema = z.object({
    amount: z.number(),
    token: z.string(),
    fromChain: z.string(),
    toChain: z.string(),
});

export async function getBridgeTransactionDetails(input: z.infer<typeof BridgeInputSchema>): Promise<BridgeDetails> {
  return bridgeNarratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'bridgeNarratorPrompt',
  input: { schema: BridgeInputSchema },
  output: { schema: BridgeDetailsSchema },
  prompt: `You are a blockchain transaction simulator. Generate plausible details for a cross-chain bridge transaction.

The user is bridging {{amount}} {{token}} from {{fromChain}} to {{toChain}}.

- Create a summary sentence describing this action (e.g., "Bridged 1,000 USDC from Ethereum to Polygon via the Stargate bridge.").
- Generate a unique, realistic-looking source transaction hash (starting with '0x').
- Generate a unique, realistic-looking destination transaction hash (starting with '0x').
`,
});

const bridgeNarratorFlow = ai.defineFlow(
  {
    name: 'bridgeNarratorFlow',
    inputSchema: BridgeInputSchema,
    outputSchema: BridgeDetailsSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
