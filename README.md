# **ProfitForge: The Infrastructure for Your Own Decentralized Bank**

**ProfitForge is a next-generation platform providing the infrastructure for communities, DAOs, and individuals to deploy, customize, and own their own autonomous financial systems on-chain.**

This is not just another DeFi application; it is a functional, on-chain demonstration of a new paradigm where users are owners, not customers. The platform is built on a foundation of self-owned smart contracts that handle liquidity, yield optimization, and treasury management with verifiable, data-driven automation.

> **[Read the Full Whitepaper](./WHITEPAPER.md)**

---

## **The Vision: Financial Self-Ownership**

The current financial system, both traditional and decentralized, is built on intermediation. ProfitForge flips this model on its head. We believe the future of finance is ownership, not just access.

Our platform provides the core components for anyone to run their own decentralized bank — safely, transparently, and without seeking permission.

-   **No Custody:** You always control your funds.
-   **No Intermediaries:** Interact directly with on-chain logic.
-   **Full Ownership:** You deploy and own the contracts.

## **Live Ecosystems on Sepolia Testnet**

ProfitForge showcases two interconnected ecosystems that serve as the building blocks for an autonomous bank.

### **1. The Trust Layer: Institutional-Grade Infrastructure**

This is the governance and security foundation for a self-owned financial entity. It's a suite of contracts for secure issuance, governance, and management of tokenized assets.

-   **`MainContract`**: The central security hub, managing contract authorizations and the protocol treasury.
-   **`ProofBond`**: A contract for minting unique, yield-bearing bond NFTs, enabling on-chain asset tokenization.
-   **`OpenGovernor`**: A DAO contract for decentralized governance over the entire ecosystem.
-   **`SafeVault`**: An autonomous treasury that collects fees and deploys them into yield-generating strategies.

**➡️ Explore this live on the [Trust Layer Page](/trust-layer).**

### **2. The Autonomous Market Engine**

This system demonstrates the power of data-driven automation in market-making. It replaces static, inefficient models with dynamic, on-chain logic.

-   **`AdaptiveMarketMaker`**: An AMM that uses on-chain data to dynamically adjust trading fees based on volume, maximizing LP returns and lowering costs for traders.
-   **`AIPredictiveLiquidityOracle`**: A decentralized network where providers stake capital to submit market predictions, with economic incentives ensuring data integrity.
-   **`AdvancedPriceOracle`**: A manipulation-resistant price oracle that aggregates multiple data sources for a secure price feed.

**➡️ Explore this live on the [AMM Demo Page](/amm-demo).**

---

## **Technical Stack**

-   **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI
-   **Autonomous Logic**: Genkit with Google Gemini
-   **Blockchain Interaction**: Viem, Wagmi, Web3Modal
-   **Smart Contracts**: Solidity, Hardhat

## **Getting Started**

The application is configured to run on the **Sepolia testnet**.

1.  Ensure you have a browser wallet (e.g., MetaMask) installed and connected.
2.  Switch your wallet's network to **Sepolia**.
3.  Acquire Sepolia ETH from a public faucet.
4.  Use the "Faucet" on the **AMM Demo** page to get mock tokens for interaction.
5.  Explore the **Trust Layer** and **AMM Demo** pages to interact with the live contracts.
