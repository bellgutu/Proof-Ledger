
import { WorkingDigitalTwinMinter } from '@/components/contracts/WorkingDigitalTwinMinter';
import { OracleManager } from '@/components/contracts/OracleManager';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Building, Database, Activity } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Proof Ledger Platform</h1>
        <p className="text-muted-foreground mt-2">
          Enterprise-grade digital asset verification and management
        </p>
      </div>

      {/* Wallet Overview */}
      <WalletDashboard />

      {/* Main Tabs */}
      <Tabs defaultValue="mint" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="mint" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Mint Assets
          </TabsTrigger>
          <TabsTrigger value="oracle" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Oracle Network
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            My Assets
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Monitor
          </TabsTrigger>
        </TabsList>

        {/* Mint Tab */}
        <TabsContent value="mint" className="space-y-6">
          <WorkingDigitalTwinMinter />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Real Estate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Property, land, buildings with legal verification
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Luxury Goods</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Watches, jewelry, art with provenance tracking
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commodities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gold, oil, agricultural products with quality verification
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Oracle Tab */}
        <TabsContent value="oracle">
          <OracleManager />
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>My Digital Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Asset list will appear here after minting
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle>Live System Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">ProofLedgerCore: Online</span>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">TrustOracle: 5/5 Oracles Active</span>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">InsuranceHub: $2.5M Pool Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <p className="text-xs text-muted-foreground mt-1">Digital Twin Minting</p>
            </div>
            <div>
              <p className="font-medium">TrustOracle</p>
              <p className="font-mono text-xs mt-1 break-all">
                0xac9529cebb617265749910f24edc62e047050a55
              </p>
              <p className="text-xs text-muted-foreground mt-1">Verification Network</p>
            </div>
            <div>
              <p className="font-medium">InsuranceHub</p>
              <p className="font-mono text-xs mt-1 break-all">
                0x6e4bc9f2b8736da118afbd35867f29996e9571bb
              </p>
              <p className="text-xs text-muted-foreground mt-1">Risk Management</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
