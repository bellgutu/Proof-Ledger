
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { keccak256, toBytes, Hex } from 'viem';

const CONTRACT_ADDRESS = '0xb2bC365953cFfF11e80446905393a9cFa48dE2e6' as const;

// Define all roles from the contract
const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
  VERIFIER_ROLE: keccak256(toBytes('VERIFIER_ROLE')),
};

export function ContractDiagnostics() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [isChecking, setIsChecking] = useState(false);

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  // Check contract state
  const { data: isPaused, refetch: refetchPaused } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [{
      "inputs": [],
      "name": "paused",
      "outputs": [{ "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'paused',
  });

  // Check roles
  const { data: hasAdminRole, refetch: refetchAdminRole } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}],
    functionName: 'hasRole',
    args: [ROLES.DEFAULT_ADMIN_ROLE, address!],
    query: { enabled: !!address }
  });

  const { data: hasVerifierRole, refetch: refetchVerifierRole } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}],
    functionName: 'hasRole',
    args: [ROLES.VERIFIER_ROLE, address!],
    query: { enabled: !!address }
  });
  
  const runDiagnostics = async () => {
    setIsChecking(true);
    await Promise.all([refetchPaused(), refetchAdminRole(), refetchVerifierRole()]);
    // The results will be updated automatically by the hooks
    setIsChecking(false);
    toast({
        title: "Diagnostics Complete",
        description: "Contract state and roles have been refreshed.",
    });
  };

  const handleUnpause = async () => {
    if (!isPaused) {
      toast({ title: "Contract is not paused" });
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: [{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"}],
        functionName: 'unpause',
        args: []
      });
      toast({ title: "Unpause Transaction Sent", description: "Waiting for confirmation..."});
      // You can add logic here to wait for transaction receipt if needed
    } catch (error: any) {
      toast({
        title: "Failed to unpause",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGrantRole = async (role: Hex, roleName: string) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: [{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"}],
        functionName: 'grantRole',
        args: [role, address!]
      });
      toast({ title: `Grant Role Tx Sent`, description: `Granting ${roleName} to your address...` });
    } catch (error: any) {
      toast({
        title: "Failed to grant role",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
   useEffect(() => {
    if (address) {
      runDiagnostics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className='flex items-center gap-2'>
            <Shield className="h-5 w-5" />
            Contract Diagnostics
          </div>
           <Button
              onClick={runDiagnostics}
              disabled={isChecking || !address}
              size="sm"
              variant="outline"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Status */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Contract Status</p>
              <p className={`text-lg font-bold mt-1 ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
                {typeof isPaused === 'undefined' ? <Loader2 className="h-4 w-4 animate-spin"/> : isPaused ? '⛔ PAUSED' : '✅ ACTIVE'}
              </p>
            </div>
            {isPaused && hasAdminRole && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleUnpause}
                disabled={isWriting}
              >
                Unpause Contract
              </Button>
            )}
          </div>
        </div>

        {/* Role Permissions */}
        <div className="space-y-3">
          <p className="font-medium">Your Permissions</p>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span>DEFAULT_ADMIN_ROLE</span>
            </div>
            <div className="flex items-center gap-2">
              {typeof hasAdminRole === 'undefined' ? <Loader2 className="h-4 w-4 animate-spin"/> : hasAdminRole ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Granted</span>
                </>
              ) : (
                 <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>VERIFIER_ROLE</span>
            </div>
            <div className="flex items-center gap-2">
              {typeof hasVerifierRole === 'undefined' ? <Loader2 className="h-4 w-4 animate-spin"/> : hasVerifierRole ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Granted</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                   {hasAdminRole && (
                     <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGrantRole(ROLES.VERIFIER_ROLE, 'VERIFIER_ROLE')}
                        disabled={isWriting}
                      >
                        Grant
                      </Button>
                   )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-300">Why can't I mint?</p>
              <ul className="list-disc list-inside mt-1 text-blue-700 dark:text-blue-400/80">
                <li>Contract might be <strong>paused</strong> (click Unpause)</li>
                <li>You might need <strong>VERIFIER_ROLE</strong> (click Grant)</li>
              </ul>
              <p className="mt-2 text-blue-600 dark:text-blue-400 text-xs">
                First: Unpause if paused. Then: Grant VERIFIER_ROLE to yourself. You must have ADMIN_ROLE to perform these actions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
