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
- **Styling**: **Tailwind CSS** - A utility-first CSS framework that enables rapid and consistent styling directly within the component markup. The app uses a theming system built with CSS variables for easy customization of colors (e.g., dark mode).
- **State Management**: **React Context API (`WalletContext`)** - All wallet-related state, including connection status, address, balances, and transactions, is managed centrally in `WalletContext`. This provides a clean and predictable way to access blockchain data across the entire application.
- **Data Fetching**: The application uses a combination of native `fetch` within Server Components for server-side data retrieval and client-side hooks for dynamic data. Next.js's built-in caching mechanisms provide SWR-like behavior out of the box.
- **Charting**: **Recharts** is used for simple, static charts, while **TradingView Advanced Charts** are integrated for interactive, professional-grade financial charting.
- **Forms**: **React Hook Form** with **Zod** for schema validation is used for all forms, ensuring a robust and user-friendly form submission experience.

---

## 2. AI Backend (Genkit)

All AI-powered features are built using Genkit, Google's open-source framework for building production-ready AI applications.

- **Framework**: **Genkit**
- **Language**: **TypeScript**
- **Core Models**: **Google Gemini Family (Gemini 1.5 Flash)** - This powerful and efficient model is used for all generative AI tasks, including analysis, summarization, and structured data generation.
- **Deployment**: Genkit flows are defined as server-side TypeScript modules (`.ts` files with the `'use server';` directive). This allows them to be seamlessly integrated as server actions within the Next.js application, making them ready for deployment to any serverless environment like Google Cloud Functions or Firebase App Hosting.

#### Key Genkit Flows:
- `trading-strategy-assistant.ts`: Generates trading strategies.
- `whale-watcher-flow.ts`: Analyzes transactions for a user-provided list of wallet addresses.
- `whitepaper-analyzer-flow.ts`: Analyzes documents from URLs.
- `contract-auditor-flow.ts`: Simulates contract security audits.
- `token-auditor-flow.ts`: Analyzes tokens for "meme coin" red flags.
- `watchlist-flow.ts`: Generates intelligence briefings for user-specified assets.

---

## 3. Blockchain Interaction

The application interacts with the blockchain using modern, type-safe tools.

- **Client Library**: **Viem** - A modern, lightweight, and type-safe TypeScript interface for interacting with Ethereum and other EVM chains. It is used for all contract reads and for preparing transactions.
- **Wallet Integration**: The application relies on a browser-injected `window.ethereum` provider (like MetaMask) for all user-initiated transactions, ensuring users maintain full control over their private keys. For local development, it also supports a private key from an environment variable for a consistent testing wallet.
- **Contract Interaction**: All smart contract calls (reads and writes) are managed through `viem`'s `publicClient` (for read operations) and `walletClient` (for write operations), ensuring a clear separation of concerns.

---

## 4. Security & Best Practices

- **Separation of Concerns**: Client-side logic is clearly separated from server-side (AI) logic using Next.js App Router conventions and `'use server';` directives.
- **Environment Variables**: Sensitive data like private keys and RPC URLs are stored in environment variables (`.env.local`) and are never exposed to the client.
- **Type Safety**: TypeScript is used across the entire stack to minimize runtime errors and improve code maintainability.
- **On-chain Logic**: The application correctly defers all state-changing blockchain operations (swaps, deposits, trades) to the user's wallet for signing. This is a critical security measure that ensures the user always maintains control of their assets.
- **Error Handling**: The application includes UI components like toasts and dialogs to provide clear, immediate feedback to the user on transaction status (pending, success, failed), creating a transparent and trustworthy user experience.
