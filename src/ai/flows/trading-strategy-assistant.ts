
'use server';

/**
 * @fileOverview Provides an AI-powered trading strategy assistant that analyzes market trends
 * and suggests potential strategies based on user risk profiles.
 *
 * - getTradingStrategy - a function to retrieve trading strategies.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
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
    .describe('A potential trading strategy suggestion based on the input. Use Markdown for formatting (headings, lists, bold).'),
  riskConsiderations: z
    .string()
    .describe('Important risk considerations for the suggested strategy. Use Markdown for formatting (headings, lists, bold).'),
  disclaimer: z.string().describe('A disclaimer that this is not financial advice.'),
});
export type TradingStrategyOutput = z.infer<typeof TradingStrategyOutputSchema>;

export async function getTradingStrategy(input: TradingStrategyInput): Promise<TradingStrategyOutput> {
  return tradingStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tradingStrategyPrompt',
  model: googleAI('gemini-1.5-flash-latest'),
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

IMPORTANT: Format the 'strategySuggestion' and 'riskConsiderations' outputs using Markdown for clear presentation (e.g., use headings, bullet points, and bold text).

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
