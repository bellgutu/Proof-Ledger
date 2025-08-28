
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

## 3. Technical Architecture

### 3.1. Frontend
- **Framework**: **Next.js (App Router)** - Leverages Server Components for performance and a modern, file-based routing system.
- **Language**: **TypeScript** - For type safety and improved developer experience.
- **UI Components**: **ShadCN UI** - A collection of beautifully designed, accessible, and composable components built on Radix UI.
- **Styling**: **Tailwind CSS** - A utility-first CSS framework for rapid and consistent styling.
- **State Management**: **React Context API** (`WalletContext`) - Centralized management for wallet state, balances, transactions, and blockchain interactions.
- **Data Fetching**: Native `fetch` API within Server Components and client-side hooks, with SWR-like caching behavior provided by Next.js.
- **Charting**: **Recharts** for static charts and **TradingView Advanced Charts** for interactive financial charting.
- **Forms**: **React Hook Form** with **Zod** for schema validation.

### 3.2. AI Backend (Genkit)
- **Framework**: **Genkit** - Google's open-source framework for building production-ready AI applications.
- **Language**: **TypeScript**
- **Core Models**: **Google Gemini Family (Gemini 1.5 Flash)** - Used for all generative AI tasks, including analysis, summarization, and structured data generation.
- **Deployment**: Genkit flows are defined as server-side TypeScript modules (`.ts` files with `'use server';`), seamlessly integrated with the Next.js application. Ready for deployment to a serverless environment like Google Cloud Functions.
- **Key Flows**:
  - `trading-strategy-assistant.ts`: Generates trading strategies.
  - `whale-watcher-flow.ts`: Analyzes transactions for a user-provided list of wallet addresses.
  - `whitepaper-analyzer-flow.ts`: Analyzes documents from URLs.
  - `contract-auditor-flow.ts`: Simulates contract security audits.

### 3.3. Blockchain Interaction
- **Client Library**: **Viem** - A modern, lightweight, and type-safe TypeScript interface for interacting with Ethereum.
- **Wallet Integration**: Relies on a browser-injected `window.ethereum` provider (like MetaMask) for user-owned wallets. Also supports a private key from environment variables for a consistent testing or demo wallet.
- **Contract Interaction**: All smart contract calls (reads and writes) are managed through `viem`'s `publicClient` and `walletClient`.

## 4. Deployment & Path to Production

The application is architected for a seamless transition from local development to testnet and finally to a full mainnet launch.

### 4.1. Hosting
- **Platform**: **Firebase App Hosting** - The `apphosting.yaml` file is configured for seamless deployment. Provides a managed, scalable environment for the Next.js application with features like CI/CD, custom domains, and a global CDN.

### 4.2. Blockchain Environments
The frontend is configured to read blockchain details (contract addresses, RPC URLs) from environment variables, allowing for easy switching between networks.

- **Stage 1: Local Development (Current)**
  - **Network**: **Hardhat / Anvil** - Used as the local blockchain development and testing network.
  - **Configuration**: The application defaults to using the local Hardhat network (`localhost:8545`). All contracts are deployed via a local script.

- **Stage 2: Testnet Deployment**
  - **Recommended Network**: **Sepolia** (or another public testnet).
  - **Process**:
    1. Deploy the full suite of smart contracts to the chosen testnet.
    2. Update the `.env.local` file with the new contract addresses and a testnet RPC URL (e.g., from Infura or Alchemy).
    3. The application will automatically connect to the testnet for full end-to-end testing in a public environment.

- **Stage 3: Mainnet Launch**
  - **Network**: **Ethereum Mainnet** (or other target EVM chain).
  - **Process**:
    1. Conduct a final, comprehensive audit of the smart contracts.
    2. Deploy the audited contracts to the mainnet.
    3. Update the `.env.local` file with the final mainnet contract addresses and a mainnet RPC URL.
    4. The application will be fully operational on the mainnet, ready for public use.

### 4.3. Environment Configuration
- **Environment Variables**: A `.env.local` file is used to manage all environment-specific configuration, including private keys (for the demo wallet) and contract addresses. This ensures a clean separation between code and configuration and makes network switching trivial.

## 5. Security & Best Practices

- **Separation of Concerns**: Client-side logic is clearly separated from server-side (AI) logic using Next.js App Router conventions.
- **Environment Variables**: Sensitive data like private keys and RPC URLs are stored in environment variables and are not exposed to the client.
- **Type Safety**: TypeScript is used across the stack to minimize runtime errors.
- **On-chain Logic**: The application correctly defers all state-changing blockchain operations (swaps, deposits) to the user's wallet for signing, ensuring the user maintains control of their assets.
- **Error Handling**: The application includes UI components and toast notifications to provide clear feedback to the user on transaction status (pending, success, failed).
