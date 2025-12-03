'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Diamond, 
  Wheat, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { WorkingMinter } from '@/components/contracts/WorkingMinter';

// Mock data based on your Vercel dashboard
const ASSET_TYPES = [
  { id: 1, name: 'Real Estate', icon: Building, count: 6, value: '$2.1M', color: 'bg-blue-100 text-blue-600' },
  { id: 2, name: 'Luxury Goods', icon: Diamond, count: 5, value: '$1.5M', color: 'bg-purple-100 text-purple-600' },
  { id: 3, name: 'Commodities', icon: Wheat, count: 4, value: '$600K', color: 'bg-amber-100 text-amber-600' },
];

const SYSTEM_STATUS = [
  { label: 'Oracle Network', status: '5/5 Active', icon: CheckCircle, color: 'text-green-500' },
  { label: 'Insurance Pool', status: '$2.5M', icon: Shield, color: 'text-blue-500' },
  { label: 'Pending Claims', status: '2', icon: Clock, color: 'text-amber-500' },
  { label: 'System Health', status: 'Optimal', icon: CheckCircle, color: 'text-green-500' },
];

export function MainDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome to Proof Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please connect your wallet to continue</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ASSET_TYPES.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{asset.name}</p>
                  <p className="text-2xl font-bold mt-1">{asset.count}</p>
                  <p className="text-sm text-muted-foreground">{asset.value}</p>
                </div>
                <div className={`p-3 rounded-full ${asset.color}`}>
                  <asset.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SYSTEM_STATUS.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-lg font-bold">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Minting Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Digital Asset Minting</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://proof-ledger.vercel.app', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Live Dashboard
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Mint new digital assets on the blockchain. Each asset is registered as an ERC721 token with metadata stored on IPFS.
            </p>
            
            {/* Working Minter Component */}
            <WorkingMinter />
            
            {/* Help Section */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Troubleshooting Minting</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Ensure you have enough ETH for gas fees</li>
                    <li>Make sure you're connected to Sepolia testnet</li>
                    <li>Check that the contract address is correct</li>
                    <li>Verify you have minting permissions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'Asset Minted', asset: 'Luxury Watch', time: '2 minutes ago', status: 'success' },
              { action: 'Oracle Verification', asset: 'Real Estate', time: '15 minutes ago', status: 'pending' },
              { action: 'Insurance Claim', asset: 'Commodity Batch', time: '1 hour ago', status: 'processed' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  {activity.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.asset}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
