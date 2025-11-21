
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

// The content below is a snapshot of your README.md file.
// In a more advanced setup, you could fetch this from a file or a CMS.
const readmeContent = `
# Proof Ledger - Comprehensive Audit & Documentation
🎯 PLATFORM OVERVIEW
Proof Ledger is a comprehensive decentralized platform for asset verification, digital twin creation, and insurance on the Ethereum blockchain. Built with enterprise-grade security and complete transparency.

📋 DEPLOYED CONTRACTS
🎭 TrustOracle
Address: 0xac9529cebb617265749910f24edc62e047050a55
Etherscan: https://sepolia.etherscan.io/address/0xac9529cebb617265749910f24edc62e047050a55
Purpose: Decentralized oracle network for asset data validation
Standard: Custom implementation with OpenZeppelin security
🏷️ ProofLedgerCore
Address: 0xb2bC365953cFfF11e80446905393a9cFa48dE2e6
Etherscan: https://sepolia.etherscan.io/address/0xb2bC365953cFfF11e80446905393a9cFa48dE2e6
Purpose: ERC721 NFT-based digital twin registry
Standard: ERC721 with OpenZeppelin extensions
🛡️ InsuranceHub
Address: 0x6e4BC9f2b8736Da118aFBD35867F29996E9571BB
Etherscan: https://sepolia.etherscan.io/address/0x6e4BC9f2b8736Da118aFBD35867F29996E9571BB
Purpose: Decentralized insurance marketplace
Standard: Custom implementation with OpenZeppelin security

# PLATFORM ENHANCEMENTS & FEATURES
This section details the significant improvements made to the Proof Ledger platform, enhancing its functionality, user experience, and technical architecture.

## Phase 1: Core Dashboard & Oracle Onboarding
- **Enhanced Oracle Onboarding:** A step-by-step, guided onboarding process was created in the Oracle Partner Console. This includes KYC/AML checks, ETH staking with clear slashing rules, and API key generation. The financial incentives (Base Fee, Bonus, Penalties) were also rebalanced to be more attractive and realistic.
- **Improved Navigation:** The main sidebar navigation was updated to be more intuitive. The "Asset Verification" section now functions as a collapsible accordion, providing direct access to sub-pages without an intermediate hub.

## Phase 2: Advanced Features
- **Interactive Provenance Timeline:** The asset detail page now features a dynamic, visual timeline for provenance history. This replaces the static text list with an interactive, icon-based component that makes an asset's lifecycle easy to track.
- **Oracle Reputation Dashboard:** The Oracle Partner Console now includes a comprehensive reputation dashboard, giving data providers a clear view of their performance metrics, including accuracy, uptime, rank, and slashed amounts.
- **Interactive Insurance Hub:** The claims center on the insurance page was enhanced to be fully interactive. It now displays detailed information for any selected claim, including "Payout Approved" status, transaction details, and direct Etherscan links.

## Phase 3: Integration & Optimization
- **Live Sensor Data Feeds:** The platform now integrates real-time data. This was implemented by creating a mock API for sensor data and connecting it to the Commodities verification page, which now displays live environmental data with periodic refreshing.
- **Advanced Search & Filtering:** Client-side search functionality was added to the Compliance page, allowing for real-time filtering of KYC/AML partners by name or email.
- **Mobile-Responsive Design:** The layout of complex pages, such as the Shipping & Logistics Hub, was optimized for tablet and mobile devices to ensure a consistent and user-friendly experience across all screen sizes.

## Phase 4: Marketplace & Analytics
- **Asset Transfer Interface:** The Real Estate verification page now includes an "Ownership Management" feature. This allows for the initiation of a secure, multi-signature transfer of the digital asset title to a new owner, laying the groundwork for a full marketplace.
`;


export default function DocumentationPage() {
  // A simple markdown to HTML converter
  const convertMarkdownToHtml = (markdown: string) => {
    let html = markdown;

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b pb-2">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');

    // Bold and Italics
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/<\/li>\n<li>/gim, '</li><li>'); // Fix spacing between list items
    html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
    
    // Links (simple regex, might not cover all cases)
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-secondary p-4 rounded-md overflow-x-auto"><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/gim, '<code class="bg-secondary/50 px-1 py-0.5 rounded-sm text-sm">$1</code>');

    // Paragraphs
    html = html.split('\n\n').map(paragraph => {
      if (paragraph.startsWith('<') || paragraph.trim() === '') {
        return paragraph;
      }
      return `<p>${paragraph}</p>`;
    }).join('');

    return html;
  };

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <div className="flex items-center gap-4">
            <FileText className="h-12 w-12 text-primary" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Platform Documentation
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                A comprehensive overview of the Proof Ledger architecture, contracts, and features.
                </p>
            </div>
        </div>
      </div>
      <Card>
        <CardContent className="p-6 md:p-8">
          <div 
            className="prose prose-invert prose-headings:text-primary max-w-none"
            dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(readmeContent) }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
