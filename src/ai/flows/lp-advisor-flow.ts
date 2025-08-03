'use server';

/**
 * @fileOverview An AI agent that suggests optimal liquidity pool pairings.
 *
 * - getLpStrategy - A function that returns a list of suggested LP strategies.
 * - LPStrategy - The return type for a single strategy suggestion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LPStrategySchema = z.object({
  pair: z.string().describe("The token pair for the suggested liquidity pool, formatted as 'TOKEN1/TOKEN2'."),
  feeTier: z.number().describe("The recommended fee tier for this pair (e.g., 0.05, 0.3, 1.0)."),
  justification: z.string().describe("A brief, 1-2 sentence explanation for why this is a good LP strategy right now, considering factors like volume, volatility, or recent news."),
});
export type LPStrategy = z.infer<typeof LPStrategySchema>;

const LPStrategyOutputSchema = z.object({
    strategies: z.array(LPStrategySchema).length(3).describe('An array of 3 unique and compelling liquidity pool strategy suggestions.'),
});


export async function getLpStrategy(): Promise<LPStrategyOutputSchema> {
  return lpAdvisorFlow();
}

const prompt = ai.definePrompt({
  name: 'lpAdvisorPrompt',
  output: { schema: LPStrategyOutputSchema },
  prompt: `You are a DeFi strategist AI. Your goal is to identify and suggest the most promising liquidity pool opportunities based on simulated current market conditions.

Generate a list of 3 unique and compelling liquidity pool strategies. For each strategy, provide:
1.  A token pair (e.g., "WETH/USDC").
2.  A recommended fee tier (0.05, 0.3, or 1.0).
3.  A concise justification (1-2 sentences) explaining why it's a good opportunity. Consider factors like recent news, expected trading volume, and volatility.

Make the suggestions diverse and plausible for a typical DeFi user.
`,
});

const lpAdvisorFlow = ai.defineFlow(
  {
    name: 'lpAdvisorFlow',
    outputSchema: LPStrategyOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
