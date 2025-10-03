# ProfitForge: Deployment Guide

This document provides a guide for deploying the ProfitForge application, including environment configuration and the path to production.

**Jump to:**
- [Project Specifications](../SPECIFICATIONS.md)
- [Technical Architecture](./Technical-Architecture.md)

---

## 1. Hosting & Deployment

- **Platform**: **Firebase App Hosting** - The `apphosting.yaml` file is pre-configured for seamless deployment to Firebase App Hosting, which provides a managed, scalable environment for the Next.js application.

---

## 2. Environment Configuration

The application uses environment variables for configuration. For both local development and live deployment, you should create a `.env.local` file by copying the `.env` template.

#### Key Environment Variables:
- `NEXT_PUBLIC_SEPOLIA_RPC_URL`: Your RPC URL for the Sepolia testnet (e.g., from Alchemy or Infura). If this is not set, the app will default to a local Hardhat/Anvil node.
- `NEXT_PUBLIC_*_ADDRESS`: The deployed addresses for all core smart contracts on the target network. The addresses for the new AI-powered AMM ecosystem are stored in `src/lib/contract-addresses.json`, while legacy contract addresses are in `src/lib/legacy-contract-addresses.json`.

---

## 3. Path to Production

The application is architected for a seamless transition from local development to testnet and finally to a full mainnet launch.

### Stage 1: Local Development
- **Network**: **Hardhat / Anvil** - The application defaults to using a local Hardhat network (`http://localhost:8545`) if the `NEXT_PUBLIC_SEPOLIA_RPC_URL` is not set.

### Stage 2: Testnet Deployment (Live on Sepolia)
- **Status**: **ACTIVE**. The new AI-Powered AMM ecosystem is fully deployed and verified on the Sepolia testnet.
- **Network**: Sepolia Testnet
- **Chain ID**: `11155111`
- **Block Explorer**: `https://sepolia.etherscan.io`
- **Process**:
    1. Create a `.env.local` file by copying the `.env` template.
    2. Populate it with your `NEXT_PUBLIC_SEPOLIA_RPC_URL` from a node provider like Alchemy or Infura.
    3. The application is now connected to the live Sepolia testnet, ready for full end-to-end testing.

### Stage 3: Mainnet Launch
- **Network**: Ethereum Mainnet (or other target EVM-compatible chain).
- **Process**:
    1. **Conduct a Final Security Audit**: A formal, third-party security audit of the AI-powered AMM contracts is a critical step before deploying to mainnet.
    2. Deploy the audited contracts to the mainnet.
    3. Update production environment variables with the final mainnet contract addresses and a mainnet RPC URL.
