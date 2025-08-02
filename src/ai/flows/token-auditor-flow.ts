'use server';
/**
 * @fileOverview An AI agent that provides a basic risk analysis for a token address.
 *
 * - auditToken - A function that takes a token address and returns a risk analysis.
 * - TokenAuditOutput - The return type for the auditToken function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TokenAuditOutputSchema = z.object({
  analysis: z
    .string()
    .describe('A detailed risk analysis of the token in Markdown format. Cover potential red flags for "meme coins" or potential scams, such as ownership, liquidity, and distribution.'),
});
export type TokenAuditOutput = z.infer<typeof TokenAuditOutputSchema>;

export async function auditToken(address: string): Promise<TokenAuditOutput> {
  return tokenAuditorFlow(address);
}

const prompt = ai.definePrompt({
  name: 'tokenAuditorPrompt',
  input: {schema: z.string()},
  output: {schema: TokenAuditOutputSchema},
  prompt: `You are a cryptocurrency analyst specializing in identifying high-risk tokens and potential scams ("rug pulls"). You are tasked with analyzing the token at the following address: {{{input}}}

Your analysis should be in Markdown format and cover the following:
1.  **Summary:** A brief overview of what a token at this address might represent.
2.  **Potential Red Flags:** A list of potential risks associated with a token like this. Focus on things like:
    - **Liquidity:** Is the liquidity likely locked or concentrated in a few wallets?
    - **Ownership:** Is the contract ownership renounced, or can the creator mint new tokens?
    - **Distribution:** Is the token supply heavily concentrated in the hands of the developers?
3.  **Conclusion:** A summary of the risks and a final verdict on its potential as a speculative asset.

This is a simulation. Do not actually fetch any on-chain data. Generate a plausible-sounding analysis for a speculative "meme coin".
`,
});

const tokenAuditorFlow = ai.defineFlow(
  {
    name: 'tokenAuditorFlow',
    inputSchema: z.string(),
    outputSchema: TokenAuditOutputSchema,
  },
  async address => {
    const {output} = await prompt(address);
    return output!;
  }
);
