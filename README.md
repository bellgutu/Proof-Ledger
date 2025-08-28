# ProfitForge

This is a NextJS application built in Firebase Studio.

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
- **Perpetuals Trading**: A full-featured trading interface for ETH/USDC perpetual futures, including an order book, collateral management, and P&L tracking.
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