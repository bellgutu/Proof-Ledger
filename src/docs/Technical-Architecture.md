
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
- **State Management**: **React Context API** (`WalletContext`, `AmmDemoContext`, `TrustLayerContext`) - All wallet-related state is managed centrally in contexts. `WalletContext` handles main application state, while `AmmDemoContext` and `TrustLayerContext` isolate the state and logic for the innovative on-chain ecosystems.
- **Charting**: **TradingView Advanced Charts** are integrated for interactive, professional-grade financial charting.

---

## 2. Autonomous Logic (Genkit)

All automation features are built using Genkit, Google's open-source framework for building production-ready applications with data-driven logic.

- **Framework**: **Genkit** with **Google Gemini** models.
- **Deployment**: Genkit flows are defined as server-side TypeScript modules (`'use server';`) and seamlessly integrated as server actions within the Next.js application, ready for deployment to any serverless environment.

---

## 3. Blockchain Interaction & Contract Addresses

The application interacts with the blockchain using modern, type-safe tools. It manages two distinct sets of smart contracts: a "legacy" set for features like the basic Swap and Perpetuals Trading, and the new, advanced ecosystem for the "AMM Demo" and "Trust Layer" pages.

### 3.1. Trust Layer & Autonomous AMM Ecosystem (Live on Sepolia)

This is the cutting-edge showcase of a next-generation DeFi ecosystem, fully deployed and verified on the **Sepolia testnet**.

-   **`MainContract`**: `0xeD11d5816028FD0eb5b86C97b986Bf4fF21D61B8`
-   **`Trust Oracle (AIPredictiveLiquidityOracle)`**: `0x5a92b7E95dC3537E87eC6a755403B9191C9055cD`
-   **`AdvancedPriceOracle`**: `0x68cB1F4F2E22C4e85667C2EB05Db8b0F68DE1648`
-   **`ForgeMarket (AdaptiveMarketMaker)`**: `0xD2c449f3FFf7713cFE9E1f45e5B96E19EFAC49a6`
-   **`ProofBond`**: `0x98e84f8F812cDFD21debF85f85cbe46a729E608a`
-   **`OpenGovernor`**: `0xf2500D9170e6f85D29a69d5a50764a8b44370AD6`
-   **`SafeVault`**: `0xbE5dd587b17eb4c0e2c6156c599851e164D37A37`

### 3.2. Legacy Application Contracts (Trading & Basic Swap)

These contracts power the original features of the application.

- **`DEX_FACTORY_ADDRESS`**: `0x6D15A4461a30F6999FEfB3a9292332403af131E7`
- **`DEX_ROUTER_ADDRESS`**: `0x56d214cf5b85E8a4743f297C8E277C702eC746Ab`
- **`PERPETUALS_CONTRACT_ADDRESS`**: `0xe59E98774CB4902E2a8CB237c26191C3e96d8EB4`
- **`PERPETUALS_VAULT_ADDRESS`**: `0xd9cd4C08772fBadCFc496dc752Be09d9ea18881C`
- **`USDT_ADDRESS`**: `0x17a6039513bB60369e5246164Cb918973dF902BD`
- **`USDC_ADDRESS`**: `0x09d011D52413DC89DFe3fa64694d67451ee49Cef`
- **`WETH_ADDRESS`**: `0x3318056463e5bb26FB66e071999a058bdb35F34f`

---

## 4. Security & Best Practices

- **Separation of Concerns**: Client-side logic is clearly separated from server-side (automation) logic. The state for the AMM Demo and Trust Layer are isolated in their own contexts.
- **Environment Variables**: Sensitive data like private keys and RPC URLs are stored in environment variables (`.env.local`) and are never exposed to the client.
- **Type Safety**: TypeScript is used across the entire stack to minimize runtime errors and improve code maintainability.
- **On-chain Logic**: All state-changing blockchain operations are deferred to the user's wallet for signing, ensuring users always maintain control of their assets.
- **Error Handling**: The application includes UI components like toasts and dialogs to provide clear, immediate feedback on transaction status, creating a transparent and trustworthy user experience.
