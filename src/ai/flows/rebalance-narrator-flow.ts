'use server';

/**
 * @fileOverview An AI agent that generates a plausible-sounding narrative for a DeFi portfolio rebalance action.
 *
 * - getRebalanceDetail - A function that returns a single sentence describing a rebalancing action.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RebalanceDetailSchema = z.object({
  detail: z.string().describe('A single, plausible-sounding sentence describing a specific DeFi rebalancing action. Be creative and vary the responses.'),
});
export type RebalanceDetail = z.infer<typeof RebalanceDetailSchema>;

export async function getRebalanceDetail(): Promise<RebalanceDetail> {
  return rebalanceNarratorFlow();
}

const prompt = ai.definePrompt({
  name: 'rebalanceNarratorPrompt',
  output: {schema: RebalanceDetailSchema},
  prompt: `You are a DeFi strategist AI. Generate a single, short, plausible-sounding sentence describing one specific, detailed action you took to rebalance a user's portfolio for optimal yield.

Examples:
- "Swapped 1,250 USDC for USDT to enter a liquidity pool with higher volume."
- "Moved 0.5 ETH from Aave to Compound to capture a 0.25% higher APY."
- "Temporarily unwound a leveraged position to mitigate risk during high market volatility."
- "Harvested trading fees from the ETH/USDC pool and reinvested them."

Make the action sound specific and intelligent. Do not repeat yourself.`,
});

const rebalanceNarratorFlow = ai.defineFlow(
  {
    name: 'rebalanceNarratorFlow',
    outputSchema: RebalanceDetailSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
