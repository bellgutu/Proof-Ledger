# Proof Ledger

Proof Ledger is a closed-loop system for end-to-end verification of shipping, insurance, and quality control. It is designed to reduce costs, mitigate risks, and increase efficiency for businesses that deal with physical assets and complex supply chains.

## Technical Stack

-   **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI
-   **Deployment**: Vercel

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) version 20 or later.
-   [Vercel CLI](https://vercel.com/docs/cli) for deployment (optional).

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/bellgutu/Proof-Ledger.git
cd proof-ledger
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

This application is configured for easy deployment to **Vercel**.

### Prerequisites

1.  Create a Vercel account at [vercel.com](https://vercel.com).
2.  Push your code to your GitHub repository.

### Deployment Steps (via Vercel Dashboard)

1.  **Import Project**: From your Vercel dashboard, click "Add New..." and select "Project".
2.  **Import Git Repository**: Select the `Proof-Ledger` repository from your GitHub account. Vercel will automatically detect that it's a Next.js project.
3.  **Configure Project**: You may need to add your Environment Variables (like `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) in the project settings on Vercel.
4.  **Deploy**: Click the "Deploy" button.

Vercel will now build and deploy your application. The `vercel.json` file is already configured for this process.
# Proof-Ledger
