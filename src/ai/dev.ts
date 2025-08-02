import { config } from 'dotenv';
config();

import '@/ai/flows/trading-strategy-assistant.ts';
import '@/ai/flows/news-generator.ts';
import '@/ai/flows/whale-watcher-flow.ts';
import '@/ai/flows/chart-analyzer-flow.ts';
import '@/ai/flows/whitepaper-analyzer-flow.ts';
import '@/ai/flows/rebalance-narrator-flow.ts';
import '@/ai/flows/contract-auditor-flow.ts';
import '@/ai/flows/token-auditor-flow.ts';
