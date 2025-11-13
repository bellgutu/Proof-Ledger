# Proof Ledger

Proof Ledger is a closed-loop system for end-to-end verification of shipping, insurance, and quality control. It is designed to reduce costs, mitigate risks, and increase efficiency for businesses that deal with physical assets and complex supply chains.

---

## For Investors & Founders

### The Problem

Global supply chains are plagued by inefficiency, fraud, and a lack of transparency. Billions are lost annually due to disputes, insurance claims, and manual verification processes that are slow, costly, and prone to error. High-value assets and commodities often lack a single, irrefutable source of truth regarding their provenance, condition, and custody.

### The Solution: Proof Ledger

Proof Ledger creates an **immutable digital twin** for physical assets. By leveraging a secure, verifiable ledger, we provide a single source of truth that is trusted by all parties in the supply chain—from logistics providers and insurers to financers and compliance officers.

Our platform enables:
- **Parametric Insurance:** Automate insurance claims based on verifiable, real-time data triggers (e.g., a broken container seal, temperature deviation), reducing claim cycles from months to minutes.
- **Supply Chain Finance:** Allow businesses to unlock liquidity by using their verified, in-transit assets as collateral.
- **Reduced Risk & Fraud:** Create an unbreakable chain of custody, making it nearly impossible to dispute provenance or tamper with records.
- **Operational Efficiency:** Eliminate manual paperwork, reduce administrative overhead, and accelerate contract execution (FOB/CIF).

### Target Market & Opportunity

Our primary market includes:
1.  **Logistics & Shipping Companies:** Seeking to reduce disputes and offer premium, verifiable services.
2.  **Insurance & Financial Institutions:** Looking to de-risk their portfolios and create innovative, data-driven products.
3.  **High-Value Goods Industries:** Such as luxury items, gemstones, and specialized commodities, where provenance is paramount.

The global supply chain and trade finance market represents a multi-trillion dollar industry. By capturing even a fraction of this market through a transaction- and subscription-based model, the revenue potential is substantial. Proof Ledger is positioned to become the definitive verification layer for global trade.

---

## Technical Stack

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS with ShadCN UI
-   **Mapping**: Leaflet with OpenStreetMap
-   **Deployment**: Vercel

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) version 20 or later.
-   [Vercel CLI](https://vercel.com/docs/cli) (optional, for command-line deployment).

### 1. Installation

Clone the repository and install the project dependencies:

```bash
git clone https://github.com/bellgutu/Proof-Ledger.git
cd Proof-Ledger
npm install
```

### 2. Running the Development Server

To run the application in development mode, use the following command. This will start the app on `http://localhost:3000`.

```bash
npm run dev
```

### 3. Building for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

---

## Deployment

This application is optimized for easy deployment to **Vercel**.

### Prerequisites

1.  Create a Vercel account at [vercel.com](https://vercel.com).
2.  Push your code to your GitHub repository (`https://github.com/bellgutu/Proof-Ledger`).

### Deployment Steps (via Vercel Dashboard)

1.  **Import Project**: From your Vercel dashboard, click "Add New..." and select "Project".
2.  **Import Git Repository**: Select the `Proof-Ledger` repository from your GitHub account. Vercel will automatically detect that it's a Next.js project.
3.  **Configure Project**: No special configuration is needed. The project is ready to be deployed as is.
4.  **Deploy**: Click the "Deploy" button.

Vercel will build and deploy your application. Any future pushes to the `main` branch will automatically trigger a new deployment.
