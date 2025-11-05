
'use server';

/**
 * @fileOverview An AI agent that analyzes candlestick chart data to identify technical patterns.
 *
 * - analyzeChartPatterns - A function that takes chart data and returns identified patterns.
 * - ChartAnalysisData - The return type for the analyzeChartPatterns function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google';
import {z} from 'genkit';

const CandlestickSchema = z.object({
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    time: z.number(),
});

const ChartAnalysisInputSchema = z.object({
  candles: z.array(CandlestickSchema).describe('An array of candlestick data points for the chart.'),
});
export type ChartAnalysisInput = z.infer<typeof ChartAnalysisInputSchema>;


const IdentifiedPatternSchema = z.object({
    name: z.string().describe('The name of the identified technical pattern (e.g., "Head and Shoulders", "Bullish Engulfing").'),
    type: z.enum(['Bullish', 'Bearish', 'Neutral']).describe('The sentiment of the pattern.'),
    description: z.string().describe('A brief (1-2 sentence) explanation of the pattern and its potential implications.'),
});

const ChartAnalysisDataSchema = z.object({
    patterns: z.array(IdentifiedPatternSchema).describe('An array of identified technical patterns.'),
});
export type ChartAnalysisData = z.infer<typeof ChartAnalysisDataSchema>;

export async function analyzeChartPatterns(input: ChartAnalysisInput): Promise<ChartAnalysisData> {
  return chartAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chartAnalyzerPrompt',
  model: googleAI('gemini-1.5-flash-latest'),
  input: { schema: ChartAnalysisInputSchema },
  output: { schema: ChartAnalysisDataSchema },
  prompt: `You are an expert technical analyst. Analyze the following series of candlestick data and identify any significant technical analysis patterns.

Candlestick Data:
{{{json candles}}}

For each pattern you identify, provide its name, its sentiment (Bullish, Bearish, or Neutral), and a brief description of its implications. If no significant patterns are found, return an empty array.
`,
});

const chartAnalyzerFlow = ai.defineFlow(
  {
    name: 'chartAnalyzerFlow',
    inputSchema: ChartAnalysisInputSchema,
    outputSchema: ChartAnalysisDataSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
