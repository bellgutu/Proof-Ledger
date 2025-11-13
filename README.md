# Proof Ledger

Proof Ledger is a closed-loop system for end-to-end verification of shipping, insurance, and quality control. It is designed to reduce costs, mitigate risks, and increase efficiency for businesses that deal with physical assets and complex supply chains.

## Technical Stack

-   **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI
-   **Deployment**: Firebase App Hosting

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) version 20 or later.
-   [Firebase CLI](https://firebase.google.com/docs/cli) for deployment.

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone <your-repo-url>
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

This application is configured for easy deployment to **Firebase App Hosting**.

### Prerequisites

1.  Make sure you have the [Firebase CLI](https://firebase.google.com/docs/cli) installed and you are logged in (`firebase login`).
2.  Set up a Firebase project in the [Firebase Console](https://console.firebase.google.com/).

### Deployment Steps

1.  **Initialize Firebase (if not already done):**
    ```bash
    firebase init hosting
    ```
    When prompted, select "Use an existing project" and choose the project you created. For the hosting setup, use the default options and specify that it's a Next.js app.

2.  **Deploy the Application:**
    ```bash
    firebase deploy --only hosting
    ```

This command will build your Next.js application and deploy it to Firebase App Hosting. The `apphosting.yaml` and `firebase.json` files are already configured for this process.
