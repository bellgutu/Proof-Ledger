'use server';

/**
 * @fileOverview An AI agent that analyzes crypto whale movements for a given list of addresses.
 *
 * - getWhaleWatchData - A function that returns simulated whale transactions and a market sentiment analysis.
 * - WhaleWatchData - The return type for the getWhaleWatchData function.
 * - WhaleWatchInput - The input type for the getWhaleWatchData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WhaleTransactionSchema = z.object({
    id: z.string().describe('A unique ID for the transaction, e.g., a mock hash.'),
    asset: z.string().describe('The symbol of the crypto asset, e.g., BTC, ETH.'),
    amount: z.number().describe('The amount of the asset transferred.'),
    amountUSD: z.number().describe('The equivalent value of the transaction in USD.'),
    from: z.string().describe("The source of the funds, either an exchange name or one of the monitored wallet addresses."),
    to: z.string().describe("The destination of the funds, either an exchange name or one of the monitored wallet addresses."),
});

const WhaleWatchInputSchema = z.object({
    wallets: z.array(z.string()).describe('A list of wallet addresses to monitor.'),
});
export type WhaleWatchInput = z.infer<typeof WhaleWatchInputSchema>;


const WhaleWatchDataSchema = z.object({
    transactions: z.array(WhaleTransactionSchema).length(7).describe('An array of 7 recent, significant whale transactions related to the provided wallet addresses.'),
    sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']).describe('The overall market sentiment derived from these transactions.'),
    analysis: z.string().describe('A brief (1-2 sentence) explanation for the sentiment analysis based on the activity of the monitored wallets.'),
});
export type WhaleWatchData = z.infer<typeof WhaleWatchDataSchema>;

export async function getWhaleWatchData(input: WhaleWatchInput): Promise<WhaleWatchData> {
  return whaleWatcherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'whaleWatcherPrompt',
  input: { schema: WhaleWatchInputSchema },
  output: { schema: WhaleWatchDataSchema },
  prompt: `You are a crypto market analyst specializing in on-chain analysis. You are observing the movements of a specific list of "whale" wallets provided by the user.

Monitored Wallets:
{{{json wallets}}}

Generate a list of 7 recent, plausible-sounding, large transactions that would be characteristic of these wallets. The transactions should reflect a clear market sentiment (either Bullish, Bearish, or Neutral). For example, large outflows from exchanges to these wallets might suggest a Bullish sentiment (intention to hold), while large inflows from these wallets to exchanges could be Bearish (intention to sell).

Ensure some of the generated transactions originate from or are sent to the monitored wallet addresses.

Based on the transactions you generate, provide an overall market sentiment and a brief, 1-2 sentence analysis explaining your reasoning. Make the transaction details sound authentic.
`,
});

const whaleWatcherFlow = ai.defineFlow(
  {
    name: 'whaleWatcherFlow',
    inputSchema: WhaleWatchInputSchema,
    outputSchema: WhaleWatchDataSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

    