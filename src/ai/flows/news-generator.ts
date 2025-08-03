
'use server';

/**
 * @fileOverview An AI agent that generates synthetic Web3 news articles.
 *
 * - generateNews - A function that generates a list of news articles.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const NewsArticleSchema = z.object({
  id: z.number().describe('A unique numeric ID for the article, starting from 1.'),
  title: z.string().describe('The headline of the news article.'),
  content: z.string().describe('A short summary of the news article (2-3 sentences).'),
});
type NewsArticle = z.infer<typeof NewsArticleSchema>;

const NewsGeneratorOutputSchema = z.object({
    articles: z.array(NewsArticleSchema).length(6).describe('An array of 6 news articles.'),
});
export type NewsGeneratorOutput = z.infer<typeof NewsGeneratorOutputSchema>;

export async function generateNews(): Promise<NewsGeneratorOutput> {
  return newsGeneratorFlow();
}

const prompt = ai.definePrompt({
  name: 'newsGeneratorPrompt',
  model: googleAI('gemini-1.5-flash-latest'),
  output: {schema: NewsGeneratorOutputSchema},
  prompt: `You are a Web3 and cryptocurrency news journalist. Generate a list of 6 recent, plausible-sounding news headlines and short summaries. The topics should be varied and cover things like protocol upgrades, NFT marketplaces, institutional investment, Web3 gaming, regulation, and decentralized identity.

Make the content sound authentic and engaging.
`,
});

const newsGeneratorFlow = ai.defineFlow(
  {
    name: 'newsGeneratorFlow',
    outputSchema: NewsGeneratorOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
