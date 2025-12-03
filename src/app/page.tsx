import { MainDashboard } from '@/components/dashboard/MainDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Proof Ledger Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Blockchain-powered digital asset management platform
        </p>
      </div>

      {/* Warning Banner for Testnet */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800">Test Network Active</h3>
              <p className="text-blue-700 text-sm mt-1">
                You are connected to Sepolia testnet. Use test ETH for transactions.
                <br />
                <a 
                  href="https://sepoliafaucet.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  Get test ETH from Sepolia faucet
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <MainDashboard />

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">ProofLedgerCore</p>
              <p className="font-mono text-xs mt-1 break-all">
                0xb2bc365953cfff11e80446905393a9cfa48de2e6
              </p>
              <a 
                href="https://sepolia.etherscan.io/address/0xb2bc365953cfff11e80446905393a9cfa48de2e6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                View on Etherscan
              </a>
            </div>
            <div>
              <p className="font-medium">TrustOracle</p>
              <p className="font-mono text-xs mt-1 break-all">
                0xac9529cebb617265749910f24edc62e047050a55
              </p>
              <a 
                href="https://sepolia.etherscan.io/address/0xac9529cebb617265749910f24edc62e047050a55"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                View on Etherscan
              </a>
            </div>
            <div>
              <p className="font-medium">InsuranceHub</p>
              <p className="font-mono text-xs mt-1 break-all">
                0x6e4bc9f2b8736da118afbd35867f29996e9571bb
              </p>
              <a 
                href="https://sepolia.etherscan.io/address/0x6e4bc9f2b8736da118afbd35867f29996e9571bb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
