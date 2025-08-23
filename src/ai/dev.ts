
import { config } from 'dotenv';
config();

import '@/ai/flows/trading-strategy-assistant.ts';
import '@/ai/flows/whale-watcher-flow.ts';
import '@/ai/flows/chart-analyzer-flow.ts';
import '@/ai/flows/whitepaper-analyzer-flow.ts';
import '@/ai/flows/rebalance-narrator-flow.ts';
import '@/ai/flows/contract-auditor-flow.ts';
import '@/ai/flows/token-auditor-flow.ts';
import '@/ai/flows/watchlist-flow.ts';
import '@/ai/flows/bridge-narrator-flow.ts';
import '@/ai/flows/lp-advisor-flow.ts';
import '@/ai/flows/news-generator-flow.ts';
import '@/app/actions/defi-actions.ts';
