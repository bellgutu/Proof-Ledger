'use server';
/**
 * @fileOverview An AI agent that provides a basic security audit for a smart contract address.
 *
 * - auditContract - A function that takes a contract address and returns a security analysis.
 * - ContractAuditOutput - The return type for the auditContract function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContractAuditOutputSchema = z.object({
  analysis: z
    .string()
    .describe('A detailed security analysis of the smart contract in Markdown format. Cover potential vulnerabilities like reentrancy, integer overflow/underflow, and access control issues. Provide a summary of the findings.'),
});
export type ContractAuditOutput = z.infer<typeof ContractAuditOutputSchema>;

export async function auditContract(address: string): Promise<ContractAuditOutput> {
  return contractAuditorFlow(address);
}

const prompt = ai.definePrompt({
  name: 'contractAuditorPrompt',
  input: {schema: z.string()},
  output: {schema: ContractAuditOutputSchema},
  prompt: `You are a world-class smart contract security auditor. You are tasked with conducting a basic security audit of the smart contract at the following address: {{{input}}}

Your analysis should be in Markdown format and cover the following:
1.  **Summary:** A brief overview of the contract's likely purpose.
2.  **Potential Vulnerabilities:** A list of potential security risks (e.g., reentrancy, unchecked external calls, integer overflow/underflow, improper access control). For each, briefly explain the risk.
3.  **Conclusion:** A summary of your findings and a recommendation.

This is a simulation. Do not actually fetch any on-chain data. Generate a plausible-sounding analysis based on the address format.
`,
});

const contractAuditorFlow = ai.defineFlow(
  {
    name: 'contractAuditorFlow',
    inputSchema: z.string(),
    outputSchema: ContractAuditOutputSchema,
  },
  async address => {
    const {output} = await prompt(address);
    return output!;
  }
);
