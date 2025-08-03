
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
  strategyName: z.string().describe("The name of the DeFi strategy to engage with (e.g., 'Lending on Aave', 'Providing Liquidity on Uniswap')."),
  fromToken: z.enum(['ETH', 'WETH', 'USDC']).describe("The token being sold or moved."),
  toToken: z.enum(['ETH', 'WETH', 'USDC']).describe("The token being bought or received."),
  amount: z.number().describe("The amount of the 'fromToken' being used in the action."),
  justification: z.string().describe("A detailed, 2-sentence explanation for why this specific action is being taken now, based on simulated market conditions."),
  riskAnalysis: z.string().describe("A brief analysis of the potential risks associated with this strategy (e.g., impermanent loss, smart contract risk)."),
  expectedApy: z.number().describe("The projected annual percentage yield (APY) for this investment strategy."),
});
export type RebalanceAction = z.infer<typeof RebalanceActionSchema>;

const RebalanceInputSchema = z.object({
    currentEth: z.number(),
    currentWeth: z.number(),
    currentUsdc: z.number(),
});

export async function getRebalanceAction(input: z.infer<typeof RebalanceInputSchema>): Promise<RebalanceAction> {
  return rebalanceNarratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rebalanceNarratorPrompt',
  input: { schema: RebalanceInputSchema },
  output: { schema: RebalanceActionSchema },
  prompt: `You are a DeFi strategist AI. Your goal is to rebalance a portfolio for optimal yield. The current vault holdings are {{currentWeth}} WETH and {{currentUsdc}} USDC.

Generate a single, plausible rebalancing action. The action should be a swap between WETH and USDC to enter a specific DeFi strategy.
- If WETH is high and USDC is low, suggest swapping WETH for USDC to provide liquidity in a stable pair.
- If USDC is high and WETH is low, suggest swapping USDC for WETH to lend it on a platform like Aave.
- The amount should be a realistic portion of the available balance.

Provide a clear justification for the action, a risk analysis, and an expected APY.
The 'fromToken' and 'toToken' must be different.
`,
});


const rebalanceNarratorFlow = ai.defineFlow(
  {
    name: 'rebalanceNarratorFlow',
    inputSchema: RebalanceInputSchema,
    outputSchema: RebalanceActionSchema,
  },
  async (input) => {
    // Ensure we don't try to rebalance from a zero balance
    if (input.currentEth > 0 && input.currentWeth === 0 && input.currentUsdc === 0) {
        return {
            fromToken: 'ETH',
            toToken: 'WETH',
            amount: parseFloat((input.currentEth * 0.5).toFixed(4)),
            strategyName: "Wrap ETH for DeFi",
            justification: "Wrapping ETH into WETH is the first step to enable participation in various DeFi protocols that use the ERC-20 standard.",
            riskAnalysis: "The primary risk is smart contract risk associated with the WETH contract itself, although it is widely audited and considered secure.",
            expectedApy: 0,
        }
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
