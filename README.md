# Proof Ledger: A Comprehensive Platform Guide

Proof Ledger is a closed-loop system for end-to-end verification of shipping, insurance, and quality control. It is designed to reduce costs, mitigate risks, and increase efficiency for businesses that deal with physical assets and complex supply chains by creating an **immutable digital twin** for each asset.

This document provides a detailed breakdown of every feature and page within the Proof Ledger application.

---

## Table of Contents
1.  [Technical Stack](#technical-stack)
2.  [Core Concepts](#core-concepts)
3.  [Page-by-Page Feature Breakdown](#page-by-page-feature-breakdown)
    - [Enterprise Command Center (Dashboard)](#1-enterprise-command-center-dashboard)
    - [Asset Verification Hubs](#2-asset-verification-hubs)
        - [Real Estate Verification](#a-real-estate-verification)
        - [Luxury & Gemstone Verification](#b-luxury--gemstone-verification)
        - [Commodity & Agri-Asset Verification](#c-commodity--agri-asset-verification)
    - [Shipping & Logistics Hub](#3-shipping--logistics-hub)
    - [Insurance & Financial Services Hub](#4-insurance--financial-services-hub)
    - [Compliance & Governance Hub](#5-compliance--governance-hub)
    - [Proof Partner Console (Oracle Providers)](#6-proof-partner-console)
4.  [Getting Started](#getting-started)

---

## Technical Stack

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS with ShadCN UI
-   **Mapping**: Leaflet with OpenStreetMap
-   **Deployment**: Vercel

---

## Core Concepts

-   **Digital Twin**: A unique, non-fungible digital token that represents a physical asset on the blockchain. It contains the asset's full history, from provenance to its current state.
-   **Oracles (Proof Partners)**: Trusted, third-party entities (e.g., auditors, inspectors, data providers) that submit verified, real-world data to the platform. This data triggers state changes in the smart contracts governing the assets.
-   **Verified Status Snapshot (VSS)**: A time-stamped, hashed snapshot of an asset's condition, location, and ownership at a critical point in its lifecycle (e.g., before shipping).
-   **Parametric Triggers**: Automated events executed by smart contracts based on data from Oracles. For example, an insurance claim is automatically paid out if a container's temperature sensor reports a value outside the agreed-upon range.

---

## Page-by-Page Feature Breakdown

### 1. Enterprise Command Center (Dashboard)

**Path:** `/`

The Enterprise Command Center is the high-level, strategic dashboard for risk and financial triage. It provides a real-time, 30,000-foot view of the entire platform's health, risk exposure, and financial activity.

#### Key Widgets:

-   **Proof Score | Risk Triage:**
    -   **Total Risk Grade:** An aggregate score (e.g., "B+") that assesses the overall risk exposure across all assets and processes on the platform.
    -   **Escrow Utilization Rate:** Shows the percentage of total insurance escrow funds currently locked in active policies.
    -   **Pending Exceptions:** A count of active issues requiring manual intervention (e.g., tamper alerts, verification delays).
    -   **Blocked Transfers:** The number of asset transfers that are currently halted due to compliance or risk flags.

-   **Ledger-Secured Capital:**
    -   **Collateralized Assets Value:** The total dollar value of physical assets currently being used as collateral for financing.
    -   **Auto-Claims Payout (Month-to-Date):** The total value of insurance claims automatically processed and paid out by the system.
    -   **Available Liquidity Pool:** The amount of capital available from integrated financial partners for instant supply chain financing.

-   **Verified Asset Status Viewer:**
    -   **Shipments In-Transit:** A live count of all active shipments being tracked by the platform.
    -   **At-Risk Shipments:** A count of shipments that have triggered a risk alert (e.g., deviation from route, sensor anomaly).
    -   **FOB/CIF Verified (24h):** The number of shipments that have successfully passed a Free-on-Board or Cost-Insurance-Freight verification milestone in the last 24 hours.
    -   **Interactive Map:** A dynamic global map that visually pinpoints the real-time locations of all at-risk shipments, allowing operators to immediately identify and investigate problem areas.

-   **Ledger Integrity Status:**
    -   **Total Verified Assets:** A running total of all assets that have been successfully minted as digital twins on the platform.
    -   **Re-Verification Queue:** A count of assets whose periodic re-verification is due, ensuring data remains current.
    -   **Trust Oracle Health:** An integrity score representing the reliability and uptime of the data feeds from all connected Proof Partners.

-   **Critical System Alerts:**
    -   A log of high-priority events that could impact platform operations, such as an Oracle data feed going down, a smart contract automatically triggering a large insurance claim, or a new partner failing a compliance check.

### 2. Asset Verification Hubs

These pages provide specialized workflows to create the initial digital twin for different classes of assets.

#### A. Real Estate Verification

**Path:** `/asset-verification/real-estate`

This workflow establishes the immutable, verified digital title and legal status of a property.

-   **Title & Cadastral Data:**
    -   Inputs for the property's `Legal/Parcel ID` and `Geo-Coordinates`.
    -   Integrates with a **Geo-Fencing Oracle** to attest that the provided coordinates match the legal boundaries.
    -   A map visualizes the property's location.

-   **Valuation & Encumbrance:**
    -   Fields for the `Current Appraised Value` and `Last Appraisal Date`.
    -   A field to declare any existing liens or mortgages (`Encumbrance Status`).
    -   An indicator shows whether the asset is currently being used as collateral.

-   **Document Uploads:**
    -   Secure upload portals for mandatory legal documents: **Title Deed**, **Appraisal Report**, and **Survey Map**. These documents are hashed, and their hash is stored on-chain to ensure they are tamper-proof.

-   **Ownership Management & Finalization:**
    -   An interface to initiate a secure, multi-signature transfer of the property's digital title to a new owner's wallet address.
    -   `Connect Wallet` and `Finalize & Mint Asset` buttons to complete the verification process and create the digital twin on the blockchain.

#### B. Luxury & Gemstone Verification

**Path:** `/asset-verification/luxury-goods`

This workflow proves the provenance, authenticity, and grading of high-value, portable assets. The interface adapts based on the selected asset type.

-   **Initial Classification:**
    -   Users select the asset type: **Gemstone** or **Luxury Item**.
    -   If "Luxury Item" is chosen, a sub-type must be selected: **Watch, Bag, Automobile, or Garment**.

-   **Authenticity & Provenance:**
    -   A dynamic form captures unique identifiers for the selected asset type (e.g., `GIA ID` for a gemstone, `VIN` for an automobile, `Serial No.` for a watch).
    -   Integrates with specialized **Oracles** to cross-reference this data against official databases (e.g., GIA database for diamonds, DMV database for vehicles).

-   **High-Resolution Visuals:**
    -   A carousel displays uploaded 360-degree photos or videos of the asset. These visuals are cryptographically hashed to create a "visual fingerprint."
    -   Optional fields allow for the hashing of microscopic data, such as a gem's inclusion map.

-   **Security Sensor Data:**
    -   Displays a live feed from the asset's security packaging or associated sensors (e.g., GPS for a car, RFID for a garment, tamper-evident seal for a gem case).
    -   A **Trust Score** (e.g., "100%") reflects the integrity of the asset's journey, decreasing if any security alerts are triggered.

-   **Re-Verification Schedule:**
    -   Manages the asset's verification lifecycle, showing the last verified date and scheduling the next required re-verification.

#### C. Commodity & Agri-Asset Verification

**Path:** `/asset-verification/commodities`

This workflow is for fungible, bulk goods, focusing on batch quality and supply chain conditions.

-   **Initial Classification:**
    -   Users select the commodity type, such as **Wheat, Coffee, Crude Oil, or Steel**. The interface adapts accordingly.

-   **Batch & Quality Control:**
    -   A dynamic form captures quality metrics specific to the selected commodity (e.g., `Protein Content` for wheat, `API Gravity` for oil).

-   **Bulk Sensor Data Logging:**
    -   Displays live data from sensors monitoring the batch's environmental conditions (e.g., humidity, temperature, CO2 levels).
    -   Defines the **Critical Threshold Logic** (e.g., `Moisture > 13.5% AND Temp > 25°C`) that would trigger a quality-related alert.

-   **Certificate of Analysis (CoA):**
    -   A portal to upload a lab-generated CoA document. An AI extractor is ready to parse the document and automatically verify its data against the manually entered QC fields.

-   **Shipping Container Binding:**
    -   An interface to associate the commodity batch with one or more shipping container IDs.

-   **Fungibility Management:**
    -   Tools to **Split** a single batch into multiple new batches or **Merge** multiple batches into one, all while maintaining a clear, unbroken chain of provenance.

### 3. Shipping & Logistics Hub

**Path:** `/shipping`

This hub provides a single source of truth for goods in transit, enabling verifiable contract execution (FOB/CIF) and mitigating dispute risk.

-   **Shipment Workflow Creator:**
    -   Allows logistics managers to define a new smart contract workflow for a shipment by specifying the required milestones (e.g., "Port of Origin," "Customs Clearance," "Final Delivery").

-   **FOB/CIF Verification Portal:**
    -   An interface for on-site agents to securely verify key transfer events. It uses the agent's device location (`Location Stamp`) and allows for the upload of photo/video evidence before signing the transfer.

-   **Real-Time Exception & Dispute Queue:**
    -   A table listing all shipments that require attention or are in an active dispute.
    -   Selecting an exception opens the **Dispute Resolution** panel.

-   **Dispute Resolution Panel:**
    -   This powerful tool is activated when a discrepancy occurs. It visualizes the chain of events:
        1.  **Stage 1: Pre-Transit VSS:** Shows the asset's verified pristine condition before shipping.
        2.  **Stage 2: Event Trigger:** Pinpoints the exact event that caused the issue (e.g., "Tamper Alert Triggered"), attested to by an Oracle.
        3.  **Stage 3: Post-Damage VSS:** Shows the asset's damaged state upon arrival.
    -   By comparing these "Before & After" snapshots, liability can be isolated with certainty. The panel allows for the submission of additional evidence to a neutral arbitrator.

### 4. Insurance & Financial Services Hub

**Path:** `/insurance`

This hub is where financial products are bound to physical assets, automating claims and unlocking liquidity.

-   **Policy Binding & Escrow:**
    -   An interface to connect a specific `Asset/Shipment ID` to an `Insurance Policy ID`.
    -   The `Total Insured Value` is entered, and this section tracks the status of the claim escrow account, showing how much has been funded.

-   **Automated Claims Center:**
    -   A dashboard listing all active insurance claims. Claims are automatically triggered by Oracles and can have statuses like "Payout Approved," "Pending Verification," or "Disputed."
    -   Selecting a "Disputed" claim provides deep-dive details on why the parametric trigger fired, showing the exact data that breached the contract terms.

-   **Supply Chain Financing Portal:**
    -   Allows businesses to get instant loans by using their verified, in-transit assets as collateral.
    -   It displays a **Collateral Score** for the asset and the total **Liquidity Pool** available. A user can enter a borrow amount and request an instant payout.

-   **Payout & Reconciliation Log:**
    -   A human-readable ledger of all financial transactions on the platform, including insurance payouts and financing drawdowns, each linked to a verifiable on-chain transaction hash.

### 5. Compliance & Governance Hub

**Path:** `/compliance`

This hub is the control center for managing user identities, access rights, and generating audit reports.

-   **KYC/AML Partner Onboarding:**
    -   A table to manage and monitor the compliance status (e.g., "Verified," "Pending," "Revoked") of all business partners on the platform.

-   **Role-Based Access Control (RBAC):**
    -   An interface to define and manage granular user permissions. Roles like "Logistics Agent," "Finance Manager," or "Executive" can be assigned specific rights (e.g., "Mint Asset," "Approve Claim," "Read-only").

-   **Regulatory Audit Trail Generator:**
    -   A tool to generate time-stamped compliance reports for regulators, supporting various types like "Full Compliance," "Customs Declaration," or "Tax Reporting."

-   **System Health & Oracle Status:**
    -   A live monitor of the platform's core dependencies, showing the health of smart contracts and the latency/uptime of Oracle data feeds.

### 6. Proof Partner Console

**Path:** `/oracle-providers`

This is a secure, enterprise-grade interface for the trusted data partners (Oracles) who provide the real-world data that powers Proof Ledger.

-   **Performance Dashboard:**
    -   Key metrics on the partner's performance, including `Total Revenue` from data submissions, `API Requests`, `SLA Performance` (uptime), and `Reputation Score`.

-   **Manual Submission Console:**
    -   A form for partners to perform human-centric attestations, such as an expert's appraisal or an inspector's report. The form is dynamic and adapts to the type of certification being provided.

-   **Verified Data Submission API:**
    -   Provides API keys and endpoint information for partners to integrate their systems for automated, real-time data feeds.

-   **Payment & Audit Ledger:**
    -   A transparent, detailed record of all data attestations submitted by the partner and the revenue they have earned. It includes details on bonuses for high-quality data and penalties (slashing) for incorrect data.

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
