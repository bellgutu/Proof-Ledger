# ProfitForge: Technical Specifications & Architecture

## 1. Project Overview

**ProfitForge** is an AI-powered cryptocurrency trading and portfolio management platform designed to provide users with a competitive edge in the DeFi market. It combines real-time market data, on-chain trading environments, direct DeFi protocol interaction, and a suite of advanced AI-powered analytical tools.

The platform is architected as a modern, full-stack web application built on a robust and scalable technology stack, prioritizing user experience, security, and performance.

## 2. Core Features

### 2.1. Market & Data Analysis
- **Live Market Dashboard**: Real-time price tracking for major cryptocurrencies, sourced via the CoinGecko API.
- **Detailed Asset View**: In-depth chart and metric analysis for individual cryptocurrencies, featuring TradingView for advanced charting.
- **AI Intelligence Briefing**: An AI-generated summary for watched assets, synthesizing simulated news, on-chain activity, and technical analysis.
- **Web3 News Feed**: An AI-curated news feed showcasing recent articles and developments in the blockchain industry.

### 2.2. Trading & DeFi
- **Perpetuals Trading**: A full-featured trading interface for perpetual futures on major assets (e.g., ETH/USDT), including an order book, collateral management, and P&L tracking.
- **Token Swap**: On-chain token swaps leveraging a DEX router architecture.
- **Liquidity Provisioning**: Functionality to add and manage liquidity in V2, V3, and stable-swap pools.
- **AI Strategy Vault**: A DeFi vault where users can deposit WETH and allow an AI agent to suggest and execute rebalancing strategies.

### 2.3. AI-Powered Tooling
- **AI Trading Strategy Assistant**: Generates potential trading strategies based on user-defined market trends and risk profiles.
- **AI White Paper Analyzer**: Ingests a URL to a white paper and provides a structured analysis covering the project's summary, tokenomics, and potential red flags.
- **AI Auditors**:
  - **Smart Contract Auditor**: Provides a simulated security analysis of a given contract address.
  - **Token Auditor**: Analyzes a token address for risks associated with "meme coins" or scams.
- **Whale Watcher**: Allows users to monitor specified wallet addresses. It uses AI to analyze significant on-chain movements to derive market sentiment.

### 2.4. Portfolio Management
- **Connected Wallet Dashboard**: A comprehensive view of the user's on-chain asset holdings, balances, and values.
- **Transaction History**: A detailed log of all user-initiated on-chain activity.
- **Send/Receive Functionality**: A standard interface for transferring and receiving crypto assets.

### 2.5. Innovative AMM Demo
- **AI-Powered AMM Ecosystem**: A technical demonstration of a next-generation DeFi ecosystem deployed on the Sepolia testnet. The ecosystem includes an `AdaptiveMarketMaker` with dynamic, volume-based fees, a multi-provider `AIPredictiveLiquidityOracle` with staking/slashing mechanics, an `AdvancedPriceOracle`, and a central `MainContract` controller.
- **Full AMM Functionality**: Users can create new liquidity pools, add/remove liquidity, and perform swaps within this isolated, AI-driven environment.
- **AI Oracle Simulation**: An interface for AI providers to submit fee and volatility predictions, demonstrating the consensus mechanism and its impact on pool parameters.
- **Live Analytics & Impact Analysis**: Dashboards displaying real-time pool performance (TVL, volume, APY) and the measurable benefits of the AI optimizations, such as reduced fees and improved capital efficiency.

## 3. Technical Architecture

### 3.1. Frontend
- **Framework**: **Next.js (App Router)** - Leverages Server Components for performance and a modern, file-based routing system.
- **Language**: **TypeScript** - For type safety and improved developer experience.
- **UI Components**: **ShadCN UI** - A collection of beautifully designed, accessible, and composable components built on Radix UI.
- **Styling**: **Tailwind CSS** - A utility-first CSS framework for rapid and consistent styling.
- **State Management**: **React Context API** (`WalletContext`, `AmmDemoContext`) - Centralized management for wallet state. `WalletContext` handles main application state, while `AmmDemoContext` isolates the state and logic for the innovative AMM showcase.
- **Data Fetching**: Native `fetch` API within Server Components and client-side hooks, with SWR-like caching behavior provided by Next.js.
- **Charting**: **Recharts** for static charts and **TradingView Advanced Charts** for interactive financial charting.
- **Forms**: **React Hook Form** with **Zod** for schema validation.

### 3.2. AI Backend (Genkit)
- **Framework**: **Genkit** - Google's open-source framework for building production-ready AI applications.
- **Language**: **TypeScript**
- **Core Models**: **Google Gemini Family (Gemini 1.5 Flash)** - Used for all generative AI tasks.
- **Deployment**: Genkit flows are defined as server-side TypeScript modules (`.ts` files with `'use server';`), seamlessly integrated with the Next.js application.

### 3.3. Blockchain Interaction
- **Client Library**: **Viem** - A modern, lightweight, and type-safe TypeScript interface for interacting with Ethereum.
- **Wallet Integration**: Relies on a browser-injected `window.ethereum` provider (like MetaMask).
- **Contract Interaction**: The application manages two sets of contracts: a legacy set for main features and a new, AI-powered ecosystem for the AMM Demo, each handled in its respective context to prevent conflicts. The primary interaction logic is managed through `viem`'s `publicClient` and `walletClient`.

## 4. Deployment & Path to Production

### 4.1. Hosting
- **Platform**: **Firebase App Hosting** - The `apphosting.yaml` file is configured for seamless deployment, providing a managed, scalable environment for the Next.js application.

### 4.2. Blockchain Environments
- **Stage 1: Local Development (Current)**
  - **Network**: **Hardhat / Anvil** - Used as the local blockchain development and testing network.
- **Stage 2: Testnet Deployment**
  - **Network**: **Sepolia** - The application's legacy and new AI-powered contracts are deployed and verified on the Sepolia public testnet.
  - **Configuration**: The application reads contract addresses and RPC URLs from environment variables, allowing for easy switching between networks.

- **Stage 3: Mainnet Launch**
  - The architecture is designed for a straightforward transition to mainnet following a comprehensive security audit.

## 5. Security & Best Practices
- **Separation of Concerns**: Client-side logic is clearly separated from server-side (AI) logic. State for the AMM Demo is isolated in its own React Context.
- **Environment Variables**: Sensitive data is stored in environment variables and is not exposed to the client.
- **Type Safety**: TypeScript is used across the stack to minimize runtime errors.
- **On-chain Logic**: State-changing blockchain operations are deferred to the user's wallet for signing, ensuring user control over assets.
