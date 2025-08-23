
'use server';

/**
 * @fileOverview An AI agent that generates a plausible crypto news feed.
 *
 * - getNewsBriefing - A function that returns a list of simulated news articles.
 * - NewsBriefing - The return type for the getNewsBriefing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsArticleSchema = z.object({
    id: z.number().describe("A unique integer ID for the article."),
    title: z.string().describe("A compelling, realistic headline for a crypto news article."),
    url: z.string().url().describe("A plausible-sounding, but fake, URL to the full article."),
    domain: z.string().describe("The domain name of the fictional news source (e.g., 'coinjournal.io', 'web3wire.news')."),
    createdAt: z.string().datetime().describe("The ISO 8601 timestamp for when the article was published."),
});

const NewsBriefingSchema = z.object({
  articles: z.array(NewsArticleSchema).length(8).describe("An array of 8 unique, simulated crypto news articles."),
});
export type NewsBriefing = z.infer<typeof NewsBriefingSchema>;


export async function getNewsBriefing(): Promise<NewsBriefing> {
  return newsGeneratorFlow();
}

const prompt = ai.definePrompt({
  name: 'newsGeneratorPrompt',
  output: { schema: NewsBriefingSchema },
  prompt: `You are a crypto news editor AI. Your task is to generate a list of 8 recent, realistic, and compelling news articles about the cryptocurrency market.

The articles should cover a range of topics, including:
- Price movements of major assets (e.g., Bitcoin, Ethereum).
- New developments in DeFi protocols.
- Regulatory news from different countries.
- The launch of a new, interesting, but fictional altcoin project.
- A significant partnership between a crypto company and a traditional finance firm.

For each article, generate a unique ID, a catchy headline, a plausible but fake URL, a fictional domain name, and a recent ISO 8601 timestamp. Make the domains sound like legitimate crypto news outlets.
`,
});

const newsGeneratorFlow = ai.defineFlow(
  {
    name: 'newsGeneratorFlow',
    outputSchema: NewsBriefingSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
