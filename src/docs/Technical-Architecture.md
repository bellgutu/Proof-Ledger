# ProfitForge: Technical Architecture

This document provides a detailed breakdown of the technical architecture, technology stack, and security best practices for the ProfitForge application.

**Jump to:**
- [Project Specifications](../SPECIFICATIONS.md)
- [Deployment Guide](./Deployment-Guide.md)

---

## 1. Frontend Architecture

The frontend is a modern, performant, and type-safe web application built with industry best practices.

- **Framework**: **Next.js (App Router)** - We leverage the Next.js App Router to take full advantage of React Server Components, which reduce the amount of JavaScript sent to the client, leading to faster page loads. This also allows for a clean, file-based routing system and improved data fetching patterns.
- **Language**: **TypeScript** - The entire frontend is written in TypeScript, ensuring type safety, better autocompletion, and fewer runtime errors.
- **UI Components**: **ShadCN UI** - A collection of beautifully designed, accessible, and composable components built on Radix UI and Tailwind CSS. This allows for rapid development of a consistent and professional-looking user interface.
- **State Management**: **React Context API** (`WalletContext`, `AmmDemoContext`) - All wallet-related state is managed centrally in contexts. `WalletContext` handles main application state (balances, transactions, connection), while `AmmDemoContext` isolates the state and logic for the innovative AMM showcase, preventing conflicts with legacy contracts.
- **Charting**: **Recharts** is used for simple, static charts, while **TradingView Advanced Charts** are integrated for interactive, professional-grade financial charting.

---

## 2. AI Backend (Genkit)

All AI-powered features are built using Genkit, Google's open-source framework for building production-ready AI applications.

- **Framework**: **Genkit** with **Google Gemini** models.
- **Deployment**: Genkit flows are defined as server-side TypeScript modules (`'use server';`) and seamlessly integrated as server actions within the Next.js application, ready for deployment to any serverless environment.

---

## 3. Blockchain Interaction

The application interacts with the blockchain using modern, type-safe tools. It manages two distinct sets of smart contracts: a "legacy" set for the main application features and a new, advanced AI-powered ecosystem for the "AMM Demo" page.

### 3.1. Core Application Contracts (Legacy)
- **Contracts**: Includes a standard DEX Router, Perpetuals Vault, and Governance contracts.
- **Client Library**: **Viem** - A modern, lightweight, and type-safe TypeScript interface for interacting with Ethereum.
- **Wallet Integration**: Relies on a browser-injected `window.ethereum` provider (like MetaMask) via **Wagmi** and **Web3Modal**.

### 3.2. Innovative AMM Demo Contracts (AI-Powered Ecosystem)
This is a technical showcase of a next-generation DeFi ecosystem, fully deployed and verified on the **Sepolia testnet**.

- **Deployment**: A full suite of four production-ready smart contracts.
- **`MainContract` (Controller)**: A central hub managing contract authorizations, treasury, fees, and emergency pause functionality. Address: `0xD5162798db7eBC4f55a7197EAAb60eBdb09b9A9C`
- **`AdaptiveMarketMaker`**: An advanced AMM with dynamic, volume-based fee optimization. Address: `0xC687Dc2e94B6D2591551A5506236Dd64bd930C3C`
- **`AIPredictiveLiquidityOracle`**: A multi-provider oracle with staking/slashing mechanics to ensure accurate AI-driven liquidity predictions. Address: `0xc6a74BB5B17Ad5f56754AE3860750CcFff98524D`
- **`AdvancedPriceOracle`**: A robust, multi-source price oracle with historical tracking and volatility calculations. Address: `0xe80fb21a9F638C5A4244c27719DEBdA27e580563`
- **Interaction**: The AMM Demo page interacts with this isolated ecosystem via a dedicated React Context (`AmmDemoContext`), preventing conflicts with the legacy contracts used elsewhere in the application.

---

## 4. Security & Best Practices

- **Separation of Concerns**: Client-side logic is clearly separated from server-side (AI) logic. The state for the AMM Demo is also isolated in its own context.
- **Environment Variables**: Sensitive data like private keys and RPC URLs are stored in environment variables (`.env.local`) and are never exposed to the client.
- **Type Safety**: TypeScript is used across the entire stack to minimize runtime errors and improve code maintainability.
- **On-chain Logic**: All state-changing blockchain operations are deferred to the user's wallet for signing, ensuring users always maintain control of their assets.
- **Error Handling**: The application includes UI components like toasts and dialogs to provide clear, immediate feedback on transaction status, creating a transparent and trustworthy user experience.
