'use server';

/**
 * @fileOverview An AI agent that simulates and analyzes crypto whale movements.
 *
 * - getWhaleWatchData - A function that returns simulated whale transactions and a market sentiment analysis.
 * - WhaleWatchData - The return type for the getWhaleWatchData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WhaleTransactionSchema = z.object({
    id: z.string().describe('A unique ID for the transaction, e.g., a mock hash.'),
    asset: z.string().describe('The symbol of the crypto asset, e.g., BTC, ETH.'),
    amount: z.number().describe('The amount of the asset transferred.'),
    amountUSD: z.number().describe('The equivalent value of the transaction in USD.'),
    from: z.string().describe("The source of the funds, either 'Unknown Wallet' or an exchange name."),
    to: z.string().describe("The destination of the funds, either 'Unknown Wallet' or an exchange name."),
});

const WhaleWatchDataSchema = z.object({
    transactions: z.array(WhaleTransactionSchema).length(7).describe('An array of 7 recent, significant whale transactions.'),
    sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']).describe('The overall market sentiment derived from these transactions.'),
    analysis: z.string().describe('A brief (1-2 sentence) explanation for the sentiment analysis.'),
});
export type WhaleWatchData = z.infer<typeof WhaleWatchDataSchema>;

export async function getWhaleWatchData(pair: string): Promise<WhaleWatchData> {
  return whaleWatcherFlow(pair);
}

const prompt = ai.definePrompt({
  name: 'whaleWatcherPrompt',
  input: { schema: z.string() },
  output: { schema: WhaleWatchDataSchema },
  prompt: `You are a crypto market analyst specializing in on-chain analysis. You are observing the movements for the pair {{{input}}}.

Generate a list of 7 recent, plausible-sounding, large whale transactions. The transactions should reflect a clear market sentiment (either Bullish, Bearish, or Neutral). For example, large inflows to exchanges might suggest a Bearish sentiment (intention to sell), while large outflows from exchanges could be Bullish (intention to hold).

Based on the transactions you generate, provide an overall market sentiment and a brief, 1-2 sentence analysis explaining your reasoning. Make the transaction details sound authentic.
`,
});

const whaleWatcherFlow = ai.defineFlow(
  {
    name: 'whaleWatcherFlow',
    inputSchema: z.string(),
    outputSchema: WhaleWatchDataSchema,
  },
  async (pair) => {
    const {output} = await prompt(pair);
    return output!;
  }
);
