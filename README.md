
# **ProfitForge: AI-Powered DeFi & Trading Platform**

[![Status](https://img.shields.io/badge/status-live_on_testnet-green)](https://sepolia.etherscan.io/address/0xeD11d5816028FD0eb5b86C97b986Bf4fF21D61B8)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**ProfitForge is a next-generation decentralized finance (DeFi) platform showcasing two live, fully-deployed ecosystems on the Sepolia testnet: an AI-Powered Automated Market Maker (AMM) and a robust Trust Layer for tokenized Real-World Assets (RWAs).**

This is not a concept—it is a functional, on-chain application demonstrating a paradigm shift in AMM design and institutional-grade asset tokenization.

> **[Read the Full Whitepaper](./WHITEPAPER.md)**

---

## **Two Live Ecosystems, One Platform**

ProfitForge's core innovation lies in its dual-ecosystem architecture, which you can interact with directly in this application.

### 1. The AI-Powered AMM Ecosystem

This system reinvents the AMM by introducing a decentralized AI layer to optimize market parameters in real-time.

*   **`AdaptiveMarketMaker`**: An advanced AMM that uses AI predictions to dynamically adjust trading fees based on volume, maximizing capital efficiency for liquidity providers and lowering costs for traders.
*   **`AIPredictiveLiquidityOracle`**: A decentralized network where AI agents stake capital to submit predictions. A consensus mechanism with economic incentives (rewards) and penalties (slashing) ensures data integrity.
*   **`AdvancedPriceOracle`**: A manipulation-resistant price oracle that aggregates multiple data sources to provide a secure price feed.

**➡️ Explore this live on the [AMM Demo Page](/amm-demo).**

### 2. The Trust Layer for Tokenized Assets

This ecosystem provides a full suite of contracts for the secure issuance, governance, and management of tokenized, yield-bearing real-world assets.

*   **`MainContract`**: The central security and governance hub, managing contract authorizations and the protocol treasury.
*   **`ProofBond`**: An ERC721-based contract for minting unique, yield-bearing bond NFTs with all terms stored immutably on-chain.
*   **`OpenGovernor`**: A DAO contract allowing for decentralized governance over the entire ecosystem.
*   **`SafeVault`**: An autonomous treasury that collects protocol fees and deploys them into yield-generating strategies.

**➡️ Explore this live on the [Trust Layer Page](/).**

---

## **Platform Features**

Beyond the core ecosystems, ProfitForge offers a comprehensive suite of tools for traders and analysts:

*   **Market Analysis**: Live market dashboards, TradingView charting, and AI-generated intelligence briefings.
*   **AI-Powered Tools**:
    *   **AI Trading Strategy Assistant**: Generates trading strategies based on user-defined risk profiles.
    *   **AI Auditors**: Simulates security audits for smart contracts and risk analysis for tokens.
    *   **Whale Watcher**: AI-driven analysis of significant on-chain movements.
*   **Portfolio Management**: A comprehensive dashboard of asset holdings, transaction history, and wallet management.
*   **DeFi Primitives**: Interfaces for perpetuals trading (simulated), token swaps, and liquidity provisioning.

## **Technical Stack**

*   **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI
*   **AI Backend**: Genkit with Google Gemini
*   **Blockchain Interaction**: Viem, Wagmi, Web3Modal
*   **Smart Contracts**: Solidity, Hardhat

## **Getting Started**

The application is configured to run on the **Sepolia testnet**.

1.  Ensure you have a browser wallet (e.g., MetaMask) installed.
2.  Connect your wallet within the application.
3.  Switch your wallet's network to **Sepolia**.
4.  Acquire Sepolia ETH from a public faucet.
5.  Use the "Faucet" buttons on the **AMM Demo** page to get mock ERC20 tokens to interact with the pools.
6.  Explore the **Trust Layer** and **AMM Demo** pages to interact with the live contracts.
