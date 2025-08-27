
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { checkAllContracts } from '@/services/blockchain-service';

export const ContractStatusPanel = () => {
    const [contractStatus, setContractStatus] = useState<{
        contracts: Array<{name: string, address: string | undefined, deployed: boolean}>;
        tokens: Array<{name: string, address: string | undefined, deployed: boolean}>;
        allDeployed: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const status = await checkAllContracts();
            setContractStatus(status);
        } catch (error) {
            console.error("Error checking contract status:", error);
            setContractStatus(null);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);
    
    if (loading) {
        return (
            <div className="bg-muted p-4 rounded-md mb-4 text-muted-foreground">
                <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Checking contract deployment status...</span>
                </div>
            </div>
        );
    }
    
    if (!contractStatus) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-md mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium">Error</h3>
                        <div className="mt-2 text-sm ">
                            <p>Failed to check contract deployment status.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!contractStatus.allDeployed) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-md mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium">Contracts Not Deployed</h3>
                        <div className="mt-2 text-sm">
                            <p>Some contracts are not deployed. Please run the deployment script:</p>
                            <pre className="mt-2 p-2 bg-destructive/20 rounded text-xs font-mono">
                                npx hardhat run scripts/deploy.js --network localhost
                            </pre>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 gap-x-4">
                            <div>
                                <h4 className="text-sm font-medium">Core Contracts</h4>
                                <ul className="mt-1 text-sm font-mono">
                                    {contractStatus.contracts.map((contract, index) => (
                                        <li key={index} className="flex items-center">
                                            <span className={`mr-2 ${contract.deployed ? 'text-green-400' : 'text-red-400'}`}>{contract.deployed ? <CheckCircle size={14}/> : <XCircle size={14}/>}</span>
                                            <span>{contract.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium">Token Contracts</h4>
                                <ul className="mt-1 text-sm font-mono">
                                    {contractStatus.tokens.map((token, index) => (
                                        <li key={index} className="flex items-center">
                                            <span className={`mr-2 ${token.deployed ? 'text-green-400' : 'text-red-400'}`}>{token.deployed ? <CheckCircle size={14}/> : <XCircle size={14}/>}</span>
                                            <span>{token.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-green-500/10 border border-green-500/20 text-green-300 p-4 rounded-md mb-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium">All Contracts Deployed</h3>
                    <div className="mt-2 text-sm">
                        <p>All contracts are successfully deployed and accessible.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
