'use server';
/**
 * @fileOverview An AI agent that analyzes a whitepaper from a URL.
 *
 * - analyzeWhitePaper - A function that takes a URL and returns a summary and analysis.
 * - WhitePaperAnalysisOutput - The return type for the analyzeWhitePaper function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WhitePaperAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe('A detailed analysis of the whitepaper in Markdown format. Cover the summary, tokenomics, and potential red flags.'),
});
export type WhitePaperAnalysisOutput = z.infer<typeof WhitePaperAnalysisOutputSchema>;

export async function analyzeWhitePaper(url: string): Promise<WhitePaperAnalysisOutput> {
  return whitePaperAnalyzerFlow(url);
}

const prompt = ai.definePrompt({
  name: 'whitePaperAnalyzerPrompt',
  input: {schema: z.string()},
  output: {schema: WhitePaperAnalysisOutputSchema},
  prompt: `You are a cryptocurrency and blockchain expert. You are tasked with analyzing a white paper from the provided URL.

Fetch the content from the URL: {{{input}}}

If the URL points to a PDF, analyze the text of the PDF. If it's a webpage, find a link to a whitepaper PDF on that page and analyze it.

Your analysis should be in Markdown format and include the following sections:
1.  **Summary:** A brief overview of the project's goals and its core innovation.
2.  **Tokenomics:** Details on the token, its total supply, distribution, and utility.
3.  **Potential Red Flags:** Any concerning aspects like team anonymity, a vague roadmap, or centralization risks.

Return a detailed and objective analysis.
`,
});

const whitePaperAnalyzerFlow = ai.defineFlow(
  {
    name: 'whitePaperAnalyzerFlow',
    inputSchema: z.string(),
    outputSchema: WhitePaperAnalysisOutputSchema,
  },
  async url => {
    // This flow would ideally use a tool to fetch the URL content.
    // For now, we simulate the analysis based on the prompt structure.
    const {output} = await prompt(url);
    return output!;
  }
);
