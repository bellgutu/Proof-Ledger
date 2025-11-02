
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Loader2, HardHat, ShieldCheck } from 'lucide-react';
import { type Address, createPublicClient, http, custom, createWalletClient } from 'viem';
import { sepolia } from 'viem/chains';
import { useToast } from '@/hooks/use-toast';
import DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';

const mainContractAddress = DEPLOYED_CONTRACTS.MainContract as Address;
const mainContractAbi = DEPLOYED_CONTRACTS.abis.MainContract;

const contractsToAuthorize = [
    { name: 'AIPredictiveLiquidityOracle', type: 'AI_ORACLE', address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address },
    { name: 'AdaptiveMarketMaker', type: 'MARKET_MAKER', address: DEPLOYED_CONTRACTS.AdaptiveMarketMaker as Address },
    { name: 'AdvancedPriceOracle', type: 'PRICE_ORACLE', address: DEPLOYED_CONTRACTS.AdvancedPriceOracle as Address },
    { name: 'ProofBond', type: 'PROOF_BOND', address: DEPLOYED_CONTRACTS.ProofBond as Address },
    { name: 'SafeVault', type: 'SAFE_VAULT', address: DEPLOYED_CONTRACTS.SafeVault as Address }
];

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
});

export const EcosystemAuthorizerPanel = () => {
    const [account, setAccount] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [statuses, setStatuses] = useState<Record<string, boolean | null>>({});
    const { toast } = useToast();

    const checkStatuses = useCallback(async () => {
        setIsLoading(true);
        const newStatuses: Record<string, boolean> = {};
        try {
            for (const contract of contractsToAuthorize) {
                const isAuthorized = await publicClient.readContract({
                    address: mainContractAddress,
                    abi: mainContractAbi,
                    functionName: 'isAuthorizedContract',
                    args: [contract.address]
                });
                newStatuses[contract.name] = isAuthorized;
            }
            setStatuses(newStatuses);
        } catch (e) {
            console.error("Failed to check contract statuses", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch authorization statuses.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (account) {
            checkStatuses();
        }
    }, [account, checkStatuses]);

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast({ variant: 'destructive', title: 'Wallet not found', description: 'Please install a browser wallet like MetaMask.' });
            return;
        }
        try {
            const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(address as Address);
            toast({ title: 'Wallet Connected' });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Connection Failed', description: 'Could not connect to wallet.' });
        }
    };

    const authorizeAll = async () => {
        if (!account || !window.ethereum) return;

        setIsAuthorizing(true);
        const walletClient = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) });

        try {
            for (const contract of contractsToAuthorize) {
                if (!statuses[contract.name]) {
                    toast({ title: `Authorizing ${contract.name}...` });
                    const { request } = await publicClient.simulateContract({
                        account,
                        address: mainContractAddress,
                        abi: mainContractAbi,
                        functionName: 'authorizeContract',
                        args: [contract.address, contract.type],
                    });
                    const hash = await walletClient.writeContract(request);
                    await publicClient.waitForTransactionReceipt({ hash });
                    toast({ title: `✅ ${contract.name} Authorized!` });
                }
            }
            toast({ title: 'Success', description: 'All required contracts have been authorized.' });
            await checkStatuses();
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Authorization Failed', description: e.shortMessage || 'An error occurred.' });
        } finally {
            setIsAuthorizing(false);
        }
    };

    const StatusIndicator = ({ status }: { status: boolean | null }) => {
        if (status === null || isLoading) {
            return <span className="flex items-center text-muted-foreground"><Loader2 className="mr-2 animate-spin"/> Checking...</span>;
        }
        if (status) {
            return <span className="flex items-center text-green-500"><CheckCircle className="mr-2"/> Authorized</span>;
        }
        return <span className="flex items-center text-yellow-500"><AlertTriangle className="mr-2"/> Not Authorized</span>;
    };
    
    const allAuthorized = Object.values(statuses).every(s => s === true);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <ShieldCheck className="text-primary"/>
                    Ecosystem Authorizer
                </CardTitle>
                <CardDescription>
                    Authorize core smart contracts to enable full functionality of the Trust Layer and Autonomous AMM ecosystems.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-2">Contract Authorization Status</h4>
                    <div className="space-y-2">
                        {contractsToAuthorize.map((contract) => (
                            <div key={contract.name} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{contract.name}:</span>
                                <StatusIndicator status={statuses[contract.name]} />
                            </div>
                        ))}
                    </div>
                </div>

                {!account ? (
                    <Button onClick={connectWallet} className="w-full">
                        Connect Wallet to Check Status
                    </Button>
                ) : (
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Connected as: <span className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span></p>
                        <Button
                            onClick={authorizeAll}
                            disabled={isAuthorizing || isLoading || allAuthorized}
                            className="w-full"
                        >
                            {isAuthorizing ? <Loader2 className="mr-2 animate-spin"/> : <HardHat className="mr-2"/>}
                            {isAuthorizing ? 'Authorizing...' : 'Authorize All Contracts'}
                        </Button>
                        {allAuthorized && !isLoading && (
                            <p className="text-sm text-green-600">All contracts are authorized and fully functional.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
