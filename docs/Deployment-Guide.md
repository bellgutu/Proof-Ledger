# ProfitForge: Deployment Guide

This document provides a guide for deploying the ProfitForge application, including environment configuration and the path to production from local development to a live mainnet launch.

**Jump to:**
- [Project Specifications](../SPECIFICATIONS.md)
- [Technical Architecture](./Technical-Architecture.md)

---

## 1. Hosting & Deployment

- **Platform**: **Firebase App Hosting** - The `apphosting.yaml` file is pre-configured for seamless deployment to Firebase App Hosting. This platform provides a managed, scalable environment for the Next.js application with powerful features like:
  - Automated CI/CD via a GitHub connection.
  - Custom domains and automated SSL certificates.
  - A global CDN for fast content delivery.
  - Integrated logging and monitoring.

To deploy, simply connect your GitHub repository to a Firebase App Hosting backend in the Firebase console.

---

## 2. Environment Configuration

The application uses a `.env.local` file to manage all environment-specific configuration. This ensures a clean separation between code and configuration and makes switching between different blockchain networks trivial.

#### Key Environment Variables:
- `NEXT_PUBLIC_CHAIN_RPC_URL`: The RPC URL for the target blockchain network (e.g., from Infura or Alchemy).
- `NEXT_PUBLIC_DEX_FACTORY_ADDRESS`: The address of the main DEX Factory contract.
- `NEXT_PUBLIC_DEX_ROUTER_ADDRESS`: The address of the main DEX Router contract.
- `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS`: The address of the AI Strategy Vault contract.
- `NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS`: The address of the perpetuals trading contract.
- `NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS`: The address of the governance contract.
- `NEXT_PUBLIC_USDT_ADDRESS`: The address for the USDT token contract.
- `NEXT_PUBLIC_USDC_ADDRESS`: The address for the USDC token contract.
- `NEXT_PUBLIC_WETH_ADDRESS`: The address for the WETH token contract.
- `NEXT_PUBLIC_LINK_ADDRESS`: The address for the LINK token contract.
- `NEXT_PUBLIC_BNB_ADDRESS`: The address for the BNB token contract.
- `NEXT_PUBLIC_SOL_ADDRESS`: The address for the SOL token contract.
- `LOCAL_PRIVATE_KEY`: The private key for the contract deployer wallet. **This account has ownership privileges over the core contracts.** This key is required for certain admin-level tools and should NEVER be committed to version control.

---

## 3. Path to Production

The application is architected for a seamless transition from local development to testnet and finally to a full mainnet launch.

### Stage 1: Local Development
- **Network**: **Hardhat / Anvil** - The application defaults to using a local Hardhat network (`http://localhost:8545`) if the `NEXT_PUBLIC_CHAIN_RPC_URL` environment variable is not set. All contracts should be deployed via a local script (`npx hardhat run scripts/deploy.js --network localhost`), and the resulting addresses should be updated in the `src/services/blockchain-service.ts` file or loaded via environment variables.

### Stage 2: Testnet Deployment (Live on Sepolia)
- **Recommended Network**: **Sepolia** (or another public Ethereum testnet).
- **Configuration Status**: The application is now configured to dynamically switch to a testnet.
- **Process**:
    1. Deploy the full suite of smart contracts to your chosen testnet.
    2. Create a `.env.local` file in the project root.
    3. Populate the `.env.local` file with all the contract addresses from your testnet deployment and a `NEXT_PUBLIC_CHAIN_RPC_URL` from a node provider (e.g., Infura or Alchemy).
    4. Restart the application. It will now be connected to the testnet, ready for full end-to-end testing in a public environment.

### Stage 3: Mainnet Launch
- **Network**: **Ethereum Mainnet** (or other target EVM-compatible chain).
- **Process**:
    1. **Conduct a Final Security Audit**: Although the contracts have been extensively tested, a formal, third-party security audit is a critical step before deploying to mainnet to ensure the highest level of security and to protect user funds.
    2. Deploy the audited contracts to the mainnet.
    3. Update your production environment variables with the final mainnet contract addresses and a mainnet RPC URL from a reliable node provider.
    4. The application will be fully operational on the mainnet, ready for public use.
