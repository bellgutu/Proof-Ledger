# Proof Ledger

Proof Ledger is a closed-loop system for end-to-end verification of shipping, insurance, and quality control. It is designed to reduce costs, mitigate risks, and increase efficiency for businesses that deal with physical assets and complex supply chains.

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
