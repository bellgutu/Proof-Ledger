# ProfitForge: Project Specifications

This document provides a comprehensive overview of the ProfitForge application, its core features, and its underlying technical architecture.

---

## 1. Project Overview

**ProfitForge** is an AI-powered cryptocurrency trading and portfolio management platform designed to provide users with a competitive edge in the DeFi market. It combines real-time market data, on-chain trading environments, direct DeFi protocol interaction, and a suite of advanced AI-powered analytical tools.

The platform is architected as a modern, full-stack web application built on a robust and scalable technology stack, prioritizing user experience, security, and performance.

---

## 2. Core Features

### 2.1. Market & Data Analysis
- **Live Market Dashboard**: Real-time price tracking for major cryptocurrencies.
- **Detailed Asset View**: In-depth chart and metric analysis for individual cryptocurrencies.
- **AI Intelligence Briefing**: An AI-generated summary for user-watched assets.
- **Web3 News Feed**: An AI-curated news feed showcasing recent articles and developments.

### 2.2. Trading & DeFi
- **Perpetuals Trading**: A simulated trading interface for ETH/USDC perpetual futures.
- **Token Swap**: On-chain token swaps leveraging a legacy DEX router architecture.
- **Liquidity Provisioning**: Functionality to add and manage liquidity in V2, V3, and stable-swap pools (legacy).
- **AI Strategy Vault**: A DeFi vault where users can deposit WETH and allow an AI agent to suggest and execute rebalancing strategies.

### 2.3. AI-Powered Tooling
- **AI Trading Strategy Assistant**: Generates potential trading strategies based on market trends and risk profiles.
- **AI Auditors**: Provides simulated security analysis of a given smart contract or token address.
- **Whale Watcher**: Allows users to monitor specified wallet addresses and analyzes on-chain movements to derive market sentiment.

### 2.4. Portfolio Management
- **Connected Wallet Dashboard**: A comprehensive view of the user's on-chain asset holdings.
- **Transaction History**: A detailed log of all user-initiated on-chain activity.
- **Send/Receive Functionality**: A standard interface for transferring and receiving crypto assets.

### 2.5. Innovative AMM Demo: A Live, AI-Powered Ecosystem

The technical centerpiece of ProfitForge is a **live, fully deployed AI-powered AMM ecosystem on the Sepolia testnet**. This is a functional showcase of four production-ready smart contracts working in concert.

-   **`AdaptiveMarketMaker` with Dynamic Fees**: An advanced AMM that moves beyond static fees. It leverages AI predictions to optimize trading fees based on real-time trade volume, creating a more efficient market for both traders and liquidity providers.
-   **`AIPredictiveLiquidityOracle`**: A sophisticated, multi-provider oracle where AI agents can stake ETH to submit predictions on optimal fees and market volatility. A consensus mechanism with slashing ensures accuracy and discourages malicious actors.
-   **`AdvancedPriceOracle`**: A robust, multi-source price oracle with historical tracking and volatility calculations to provide secure and reliable price data.
-   **`MainContract` (Ecosystem Controller)**: A central hub that manages contract authorizations, the protocol treasury, emergency pause functionality, and fee collection, ensuring robust security and governance.

The "AMM Demo" page provides a dedicated interface to interact with this live ecosystem, allowing users to create pools, manage liquidity, and perform swaps in a truly next-generation DeFi environment.
