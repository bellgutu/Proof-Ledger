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
- `NEXT_PUBLIC_DEX_ROUTER_ADDRESS`: The address of the main DEX Router contract.
- `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS`: The address of the AI Strategy Vault contract.
- `NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS`: The address of the perpetuals trading contract.
- `NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS`: The address of the governance contract.
- `NEXT_PUBLIC_TREASURY_ADDRESS`: The address for collecting protocol fees.
- `NEXT_PUBLIC_ERC20_CONTRACT_ADDRESSES`: A JSON string containing the addresses for all deployed ERC-20 tokens.
- `LOCAL_PRIVATE_KEY`: The private key for the local development/deployer wallet. **This should NEVER be committed to version control.**
- `NEXT_PUBLIC_CHAIN_RPC_URL`: The RPC URL for the target blockchain network (e.g., from Infura or Alchemy).

---

## 3. Path to Production

The application is architected for a seamless transition from local development to testnet and finally to a full mainnet launch.

### Stage 1: Local Development
- **Network**: **Hardhat / Anvil** - The application defaults to using a local Hardhat network (`http://localhost:8545`) if the `NEXT_PUBLIC_CHAIN_RPC_URL` environment variable is not set. All contracts should be deployed via a local script (`npx hardhat run scripts/deploy.js --network localhost`), and the resulting addresses should be updated in the `src/services/blockchain-service.ts` file or loaded via environment variables.

### Stage 2: Testnet Deployment (Ready)
- **Recommended Network**: **Sepolia** (or another public Ethereum testnet).
- **Configuration Status**: The application is now configured to dynamically switch to a testnet.
- **Process**:
    1. Deploy the full suite of smart contracts to your chosen testnet.
    2. Create a `.env.local` file in the project root.
    3. Add the `NEXT_PUBLIC_CHAIN_RPC_URL` variable to your `.env.local` file with the RPC URL from a node provider (e.g., Infura or Alchemy).
    4. Update the contract addresses in `src/services/blockchain-service.ts` to match your new testnet deployment.
    5. Restart the application. It will now be connected to the testnet, ready for full end-to-end testing in a public environment.

### Stage 3: Mainnet Launch
- **Network**: **Ethereum Mainnet** (or other target EVM-compatible chain).
- **Process**:
    1. **Conduct a Final Security Audit**: Although the contracts have been extensively tested, a formal, third-party security audit is a critical step before deploying to mainnet to ensure the highest level of security and to protect user funds.
    2. Deploy the audited contracts to the mainnet.
    3. Update your production environment variables with the final mainnet contract addresses and a mainnet RPC URL from a reliable node provider.
    4. The application will be fully operational on the mainnet, ready for public use.
