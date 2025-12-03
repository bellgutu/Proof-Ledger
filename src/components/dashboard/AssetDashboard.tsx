'use client';

import { useWallet } from '@/components/wallet-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Diamond, 
  Wheat, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { WorkingMinter } from '@/components/contracts/WorkingMinter';

export function AssetDashboard() {
  const { account, isConnected, contractData } = useWallet();

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Asset Dashboard</CardTitle>
          <CardDescription>Connect your wallet to view assets</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Mock data based on your Vercel dashboard
  const dashboardData = {
    totalAssets: 15,
    totalValue: "$4.2M",
    insuredAssets: 8,
    pendingVerification: 3,
    recentActivity: [
      { id: 1, type: "Mint", asset: "Luxury Watch", time: "2 min ago", status: "completed" },
      { id: 2, type: "Insurance", asset: "Real Estate", time: "15 min ago", status: "pending" },
      { id: 3, type: "Verification", asset: "Commodity", time: "1 hour ago", status: "completed" },
    ],
    assetTypes: [
      { type: "Real Estate", count: 6, icon: Building, color: "text-blue-500" },
      { type: "Luxury Goods", count: 5, icon: Diamond, color: "text-purple-500" },
      { type: "Commodities", count: 4, icon: Wheat, color: "text-amber-500" },
    ],
    systemStatus: {
      oracles: "5/5 Active",
      insurancePool: "$2.5M",
      claimsThisMonth: 2,
      avgResponse: "1.2s"
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold mt-1">{dashboardData.totalAssets}</p>
              </div>
              <Building className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold mt-1">{dashboardData.totalValue}</p>
              </div>
              <Diamond className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Insured Assets</p>
                <p className="text-2xl font-bold mt-1">{dashboardData.insuredAssets}</p>
              </div>
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Verification</p>
                <p className="text-2xl font-bold mt-1">{dashboardData.pendingVerification}</p>
              </div>
              <Clock className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="assets">My Assets</TabsTrigger>
          <TabsTrigger value="mint">Mint New</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="oracle">Oracle Status</TabsTrigger>
        </TabsList>
        
        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Digital Assets</CardTitle>
              <CardDescription>Your blockchain-verified assets</CardDescription>
            </CardHeader>
            <CardContent>
              {contractData && contractData.userAssets && contractData.userAssets.length > 0 ? (
                <div className="space-y-4">
                  {contractData.userAssets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          {asset.assetType === 1 ? <Building/> : asset.assetType === 2 ? <Diamond/> : <Wheat/>}
                        </div>
                        <div>
                          <h4 className="font-semibold">{asset.name || 'Digital Asset'}</h4>
                          <p className="text-sm text-muted-foreground">{asset.assetType === 1 ? 'Real Estate' : asset.assetType === 2 ? 'Luxury Good' : 'Commodity'}</p>
                          <p className="text-sm">Token ID: {asset.tokenId.toString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          asset.verified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {asset.verified ? 'Verified' : 'Pending'}
                        </span>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No assets found</h3>
                  <p className="text-muted-foreground mt-2">
                    Mint your first digital asset to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Mint Tab */}
        <TabsContent value="mint">
          <WorkingMinter />
        </TabsContent>
        
        {/* Insurance Tab */}
        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Coverage</CardTitle>
              <CardDescription>Active policies and claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.assetTypes.map((item) => (
                  <div key={item.type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <item.icon className={`h-8 w-8 ${item.color}`} />
                      <div>
                        <h4 className="font-medium">{item.type}</h4>
                        <p className="text-sm text-muted-foreground">{item.count} assets</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">$500K Coverage</p>
                      <p className="text-sm text-green-600">✓ Insured</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Total Insurance Pool</h4>
                    <p className="text-2xl font-bold">{dashboardData.systemStatus.insurancePool}</p>
                    <p className="text-sm text-muted-foreground">Available for claims</p>
                  </div>
                  <Shield className="h-12 w-12 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Oracle Tab */}
        <TabsContent value="oracle">
          <Card>
            <CardHeader>
              <CardTitle>Oracle Network Status</CardTitle>
              <CardDescription>Real-time oracle performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">Active Oracles</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.systemStatus.oracles}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">Avg Response Time</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.systemStatus.avgResponse}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Recent Oracle Submissions</h4>
                  {['GIA Grading', 'SGS Certification', 'Lloyd\'s Register', 'Verra Registry'].map((name, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Just now</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {activity.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.asset}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{activity.time}</p>
                  <p className={`text-xs ${activity.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {activity.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
