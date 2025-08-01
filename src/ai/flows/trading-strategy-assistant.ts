'use server';

/**
 * @fileOverview Provides an AI-powered trading strategy assistant that analyzes market trends
 * and suggests potential strategies based on user risk profiles.
 *
 * - getTradingStrategy - A function to retrieve trading strategies.
 * - TradingStrategyInput - The input type for the getTradingStrategy function.
 * - TradingStrategyOutput - The return type for the getTradingStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TradingStrategyInputSchema = z.object({
  marketTrends: z.string().describe('The current market trends and conditions.'),
  riskProfile: z
    .enum(['low', 'medium', 'high'])
    .describe('The user risk profile: low, medium, or high.'),
});
export type TradingStrategyInput = z.infer<typeof TradingStrategyInputSchema>;

const TradingStrategyOutputSchema = z.object({
  strategySuggestion: z
    .string()
    .describe('A potential trading strategy suggestion based on the input.'),
  riskConsiderations: z
    .string()
    .describe('Important risk considerations for the suggested strategy.'),
  disclaimer: z.string().describe('A disclaimer that this is not financial advice.'),
});
export type TradingStrategyOutput = z.infer<typeof TradingStrategyOutputSchema>;

export async function getTradingStrategy(input: TradingStrategyInput): Promise<TradingStrategyOutput> {
  return tradingStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tradingStrategyPrompt',
  input: {schema: TradingStrategyInputSchema},
  output: {schema: TradingStrategyOutputSchema},
  prompt: `You are an AI-powered trading strategy assistant. Analyze the current market trends and suggest a potential trading strategy based on the user's risk profile.

Market Trends: {{{marketTrends}}}
Risk Profile: {{{riskProfile}}}

Consider the following:
- Low risk profiles should focus on capital preservation and stable returns.
- Medium risk profiles can tolerate some volatility for potentially higher returns.
- High risk profiles are comfortable with significant volatility for the chance of very high returns.

Provide a strategy suggestion, important risk considerations, and a disclaimer that this is not financial advice.

Remember to NOT provide any specific buy or sell recommendations. Only provide general trading strategy suggestions and risk considerations.

Output should be in markdown format.

`,
});

const tradingStrategyFlow = ai.defineFlow(
  {
    name: 'tradingStrategyFlow',
    inputSchema: TradingStrategyInputSchema,
    outputSchema: TradingStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
