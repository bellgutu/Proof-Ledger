'use server';

/**
 * @fileOverview An AI agent that generates a plausible-sounding narrative for a DeFi portfolio rebalance action.
 *
 * - getRebalanceAction - A function that returns a structured object describing a rebalancing action.
 * - RebalanceAction - The return type for the getRebalanceAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RebalanceActionSchema = z.object({
  fromToken: z.enum(['ETH', 'WETH']).describe("The token being sold or moved."),
  toToken: z.enum(['ETH', 'WETH']).describe("The token being bought or received."),
  amount: z.number().describe("The amount of the 'fromToken' being used in the action."),
  summary: z.string().describe('A single, plausible-sounding sentence describing the specific DeFi rebalancing action.'),
});
export type RebalanceAction = z.infer<typeof RebalanceActionSchema>;

export async function getRebalanceAction(currentEth: number, currentWeth: number): Promise<RebalanceAction> {
  return rebalanceNarratorFlow({currentEth, currentWeth});
}

const prompt = ai.definePrompt({
  name: 'rebalanceNarratorPrompt',
  input: { schema: z.object({ currentEth: z.number(), currentWeth: z.number() }) },
  output: { schema: RebalanceActionSchema },
  prompt: `You are a DeFi strategist AI. Your goal is to rebalance a portfolio between ETH and WETH for optimal yield. The current holdings are {{currentEth}} ETH and {{currentWeth}} WETH.

Generate a single, plausible rebalancing action. The action should be a swap between ETH and WETH.
- If ETH is high, suggest wrapping some ETH into WETH.
- If WETH is high, suggest unwrapping some WETH back to ETH.
- The amount should be a small, realistic portion of the available balance (e.g., 10-20%).

Provide a summary sentence explaining the action, for example: "Wrapped 0.1 ETH to WETH to stake in a yield-bearing protocol." or "Unwrapped 0.2 WETH to ETH to pay for upcoming gas fees."

The 'fromToken' and 'toToken' must be different.
`,
});


const rebalanceNarratorFlow = ai.defineFlow(
  {
    name: 'rebalanceNarratorFlow',
    inputSchema: z.object({ currentEth: z.number(), currentWeth: z.number() }),
    outputSchema: RebalanceActionSchema,
  },
  async (input) => {
    // Ensure we don't try to rebalance from a zero balance
    if (input.currentEth <= 0 && Math.random() > 0.5) {
        return {
            fromToken: 'WETH',
            toToken: 'ETH',
            amount: parseFloat((input.currentWeth * 0.1).toFixed(4)),
            summary: `Unwrapped 0.1 WETH to ETH for gas fee optimization.`
        }
    }
     if (input.currentWeth <= 0) {
        return {
            fromToken: 'ETH',
            toToken: 'WETH',
            amount: parseFloat((input.currentEth * 0.1).toFixed(4)),
            summary: `Wrapped 0.1 ETH to WETH for liquidity provision.`
        }
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
