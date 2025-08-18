'use server';

/**
 * @fileOverview An AI agent that generates an intelligence briefing for a watched asset.
 *
 * - getWatchlistBriefing - A function that returns a summary for a given asset.
 * - WatchlistBriefing - The return type for the getWatchlistBriefing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WatchlistBriefingSchema = z.object({
  symbol: z.string().describe('The ticker symbol of the asset.'),
  briefing: z.string().describe('A concise, one-paragraph intelligence briefing summarizing recent news, whale activity, and technical analysis for the asset.'),
});
export type WatchlistBriefing = z.infer<typeof WatchlistBriefingSchema>;

export async function getWatchlistBriefing(symbol: string): Promise<WatchlistBriefing> {
  return watchlistFlow(symbol);
}

const prompt = ai.definePrompt({
  name: 'watchlistPrompt',
  input: { schema: z.string() },
  output: { schema: WatchlistBriefingSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
  prompt: `You are a crypto intelligence analyst. Your task is to provide a concise, one-paragraph intelligence briefing for the asset: {{{input}}}.

The 'symbol' in your output **must** match the asset symbol provided in the input.

Your briefing should synthesize plausible, simulated information from three key areas:
1.  **Recent News:** Mention a recent development, partnership, or narrative affecting the asset.
2.  **Whale Activity:** Describe a significant on-chain movement by large holders (e.g., moving assets to/from exchanges).
3.  **Technical Analysis:** Reference a key chart pattern or indicator that suggests a potential price direction.

Combine these three points into a single, coherent paragraph. The tone should be professional and insightful.
`,
});

const watchlistFlow = ai.defineFlow(
  {
    name: 'watchlistFlow',
    inputSchema: z.string(),
    outputSchema: WatchlistBriefingSchema,
  },
  async (symbol) => {
    const { output } = await prompt(symbol);
    return output!;
  }
);
