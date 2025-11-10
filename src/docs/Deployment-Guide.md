# EnterpriseVerifi: Deployment Guide

This document provides a guide for deploying the EnterpriseVerifi application, including environment configuration and the path to production.

---

## 1. Hosting & Deployment

- **Platform**: **Firebase App Hosting** - The `apphosting.yaml` file is pre-configured for seamless deployment to Firebase App Hosting, which provides a managed, scalable environment for the Next.js application.

---

## 2. Environment Configuration

The application uses environment variables for configuration. For both local development and live deployment, you should create a `.env.local` file by copying the `.env` template.

#### Key Environment Variables:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your project ID from WalletConnect Cloud, required for wallet connections.
- Other variables for API keys and service integrations as they are added.

---

## 3. Path to Production

The application is architected for a seamless transition from local development to testnet and finally to a full mainnet launch.

### Stage 1: Local Development
- The application can be run locally using `npm run dev`.

### Stage 2: Testnet Deployment
- Once backend services and smart contracts are deployed to a testnet (e.g., Sepolia), the frontend can be configured to connect to them via environment variables.

### Stage 3: Mainnet Launch
- After successful testing and audits, the platform can be deployed to production and connected to mainnet services.
