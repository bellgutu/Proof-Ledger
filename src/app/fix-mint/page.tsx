
'use client';

import { ContractDiagnostics } from '@/components/contracts/ContractDiagnostics';
import { WorkingDigitalTwinMinter } from '@/components/contracts/WorkingDigitalTwinMinter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Wrench, Rocket } from 'lucide-react';

export default function FixMintPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Fix Minting Issues</h1>
        <p className="text-muted-foreground mt-2">
          Step-by-step solution to fix the high gas fee issue
        </p>
      </div>

      {/* Critical Warning */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Problem Identified</h3>
              <p className="text-red-700 dark:text-red-400/80 text-sm mt-1">
                The high gas fee indicates the contract is reverting. This is usually due to:
              </p>
              <ul className="list-disc list-inside mt-1 text-red-600 dark:text-red-400/70 text-xs">
                <li>Contract is PAUSED</li>
                <li>Missing role permissions (VERIFIER_ROLE)</li>
                <li>Invalid parameters</li>
                <li>Access control restrictions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Step 1: Run Contract Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContractDiagnostics />
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">What to look for:</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 bg-white dark:bg-card rounded border">
                <p className="text-sm font-medium">Contract Status</p>
                <p className="text-xs text-muted-foreground mt-1">Should show ✅ ACTIVE</p>
              </div>
              <div className="p-3 bg-white dark:bg-card rounded border">
                <p className="text-sm font-medium">VERIFIER_ROLE</p>
                <p className="text-xs text-muted-foreground mt-1">Should show ✅ Granted</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Fix Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Step 2: Fix Any Issues Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium">If Contract is PAUSED:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Unpause Contract" button in diagnostics
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium">If Missing VERIFIER_ROLE:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Grant" button next to VERIFIER_ROLE
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Ready to Mint:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once both issues are fixed, proceed to Step 3
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Mint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Step 3: Mint Digital Twin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorkingDigitalTwinMinter />
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-300">Expected Outcome</p>
                <p className="text-green-700 dark:text-green-400/80 mt-1">
                  After fixing the issues, minting should work with normal gas fees.
                </p>
                <ul className="list-disc list-inside mt-1 text-green-600 dark:text-green-400/70 text-xs">
                  <li>Gas fee should be normal, not excessive</li>
                  <li>Transaction should not show "likely to fail"</li>
                  <li>You should see a confirmation toast</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etherscan Direct Link */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Contract Interaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <a 
              href="https://sepolia.etherscan.io/address/0xb2bc365953cfff11e80446905393a9cfa48de2e6#writeContract"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
            >
              ↗️ Open Etherscan Write Contract
            </a>
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet and try minting directly on Etherscan to verify the contract works
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
