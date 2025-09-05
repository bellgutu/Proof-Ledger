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

The application uses a `.env` file for managing all environment-specific configuration. For local development and testnet deployment, you should create a `.env.local` file by copying the `.env` template. This ensures a clean separation between code and configuration and makes switching between different blockchain networks trivial.

#### Key Environment Variables:
- `NEXT_PUBLIC_CHAIN_RPC_URL`: The RPC URL for the target blockchain network (e.g., from Infura or Alchemy).
- `LOCAL_PRIVATE_KEY`: The private key for the contract deployer wallet. **This account has ownership privileges over the core contracts.** This key is required for certain admin-level tools and should NEVER be committed to version control.
- `NEXT_PUBLIC_*_ADDRESS`: The deployed addresses for all core contracts and ERC20 tokens on your target network.

All required variables have placeholders in the root `.env` file.

---

## 3. Path to Production

The application is architected for a seamless transition from local development to testnet and finally to a full mainnet launch.

### Stage 1: Local Development
- **Network**: **Hardhat / Anvil** - The application defaults to using a local Hardhat network (`http://localhost:8545`) if the `NEXT_PUBLIC_CHAIN_RPC_URL` environment variable is not set. All contracts should be deployed via a local script (`npx hardhat run scripts/deploy.js --network localhost`), and the resulting addresses should be updated in your `.env.local` file.

### Stage 2: Testnet Deployment (Live on Sepolia)
- **Recommended Network**: **Sepolia** (or another public Ethereum testnet).
- **Configuration Status**: The application is now configured to dynamically switch to a testnet.
- **Process**:
    1. Deploy the full suite of smart contracts to your chosen testnet.
    2. Create a `.env.local` file in the project root by copying the `.env` template.
    3. Populate the `.env.local` file with all the contract addresses from your testnet deployment and a `NEXT_PUBLIC_CHAIN_RPC_URL` from a node provider (e.g., Infura or Alchemy).
    4. Populate the `LOCAL_PRIVATE_KEY` with the private key of the deployer account.
    5. Restart the application. It will now be connected to the testnet, ready for full end-to-end testing in a public environment.

### Stage 3: Mainnet Launch
- **Network**: **Ethereum Mainnet** (or other target EVM-compatible chain).
- **Process**:
    1. **Conduct a Final Security Audit**: Although the contracts have been extensively tested, a formal, third-party security audit is a critical step before deploying to mainnet to ensure the highest level of security and to protect user funds.
    2. Deploy the audited contracts to the mainnet.
    3. Update your production environment variables with the final mainnet contract addresses and a mainnet RPC URL from a reliable node provider.
    4. The application will be fully operational on the mainnet, ready for public use.
