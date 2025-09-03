# ProfitForge: Project Specifications

This document provides a comprehensive overview of the ProfitForge application, its core features, and links to more detailed technical documentation.

**Jump to:**
- [Technical Architecture](./docs/Technical-Architecture.md)
- [Deployment Guide](./docs/Deployment-Guide.md)

---

## 1. Project Overview

**ProfitForge** is an AI-powered cryptocurrency trading and portfolio management platform designed to provide users with a competitive edge in the DeFi market. It combines real-time market data, on-chain trading environments, direct DeFi protocol interaction, and a suite of advanced AI-powered analytical tools.

The platform is architected as a modern, full-stack web application built on a robust and scalable technology stack, prioritizing user experience, security, and performance.

---

## 2. Core Features

### 2.1. Market & Data Analysis
- **Live Market Dashboard**: Real-time price tracking for major cryptocurrencies, sourced via the CoinGecko API. The dashboard provides a quick, at-a-glance view of market performance.
- **Detailed Asset View**: In-depth chart and metric analysis for individual cryptocurrencies, featuring TradingView for advanced, interactive charting capabilities.
- **AI Intelligence Briefing**: An AI-generated summary for user-watched assets, synthesizing simulated news, on-chain activity, and technical analysis into a concise intelligence report.
- **Web3 News Feed**: An AI-curated news feed showcasing recent articles and developments in the blockchain industry, providing users with timely market context.

### 2.2. Trading & DeFi
- **Perpetuals Trading**: A full-featured trading interface for perpetual futures on major assets (e.g., ETH/USDT). It includes an order book, collateral management, leverage controls, and P&L tracking.
- **Token Swap**: On-chain token swaps leveraging a DEX router architecture, allowing for direct and efficient trading between various assets.
- **Liquidity Provisioning**: Functionality to add and manage liquidity in V2 (standard), V3 (concentrated), and stable-swap pools, enabling users to earn trading fees.
- **AI Strategy Vault**: A sophisticated DeFi vault where users can deposit WETH and allow an AI agent to suggest and execute rebalancing and yield-farming strategies.

### 2.3. AI-Powered Tooling
- **AI Trading Strategy Assistant**: Generates potential trading strategies based on user-defined market trends and risk profiles (low, medium, high).
- **AI White Paper Analyzer**: Ingests a URL to a white paper and provides a structured analysis covering the project's summary, tokenomics, and potential red flags.
- **AI Auditors**:
  - **Smart Contract Auditor**: Provides a simulated security analysis of a given smart contract address, checking for common vulnerabilities.
  - **Token Auditor**: Analyzes a token address for risks commonly associated with "meme coins" or potential scams, such as liquidity and ownership concentration.
- **Whale Watcher**: Allows users to monitor specified wallet addresses. It uses AI to analyze significant on-chain movements to derive and explain market sentiment (Bullish, Bearish, Neutral).

### 2.4. Portfolio Management
- **Connected Wallet Dashboard**: A comprehensive view of the user's on-chain asset holdings, balances, and real-time market values.
- **Transaction History**: A detailed and filterable log of all user-initiated on-chain activity, including swaps, transfers, and trades.
- **Send/Receive Functionality**: A standard, secure interface for transferring and receiving crypto assets directly from the user's connected wallet.
