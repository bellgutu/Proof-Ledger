
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers, type BrowserProvider, type Log } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { getProvider, listenToEvent } from '@/lib/blockchain';
import { AppContracts } from '@/config/contracts';

// Define the shape of an alert
export interface SystemAlert {
    source: string;
    message: string;
    impact: string;
    time: string;
    txHash?: string;
}

interface WalletContextType {
    provider: BrowserProvider | null;
    account: string | null;
    chainId: bigint | null;
    isConnected: boolean;
    systemAlerts: SystemAlert[];
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initial alerts that are present on load
const initialAlerts: SystemAlert[] = [
    { source: "ORACLE DOWN", message: "GIA Grading Oracle latency > 5s", impact: "Luxury Minting", time: "1m ago" },
    { source: "CONTRACT ALERT", message: "Shipment SH-734-556 triggered Parametric Claim", impact: "Insurance", time: "5m ago" },
    { source: "COMPLIANCE", message: "New high-risk partner pending KYC approval", impact: "Onboarding", time: "2h ago" },
];

export function WalletProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<bigint | null>(null);
    const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(initialAlerts);
    const { toast } = useToast();

    const addAlert = useCallback((alert: Omit<SystemAlert, 'time'>) => {
        const newAlert = { ...alert, time: 'Just now' };
        setSystemAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 10)); // Keep a max of 10 alerts
    }, []);

    const handleAccountsChanged = useCallback((accounts: string[]) => {
        if (accounts.length === 0) {
            console.log('Please connect to MetaMask.');
            setAccount(null);
            toast({ title: "Wallet Disconnected", description: "Your wallet has been disconnected.", variant: "destructive" });
        } else if (accounts[0] !== account) {
            setAccount(accounts[0]);
            console.log('Account changed to:', accounts[0]);
            toast({ title: "Account Switched", description: `Connected to ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}` });
        }
    }, [account, toast]);

    const handleChainChanged = useCallback(() => {
        window.location.reload();
    }, []);

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setChainId(null);
        setSystemAlerts(initialAlerts); // Reset alerts
        toast({ title: "Wallet Disconnected" });
    };

    const connectWallet = useCallback(async () => {
        const ethProvider = getProvider();
        if (!ethProvider) {
            toast({ title: "Wallet Not Found", description: "Please install a browser wallet like MetaMask.", variant: "destructive" });
            return;
        }

        try {
            const accounts = await ethProvider.send('eth_requestAccounts', []);
            const network = await ethProvider.getNetwork();

            setProvider(ethProvider);
            setAccount(accounts[0]);
            setChainId(network.chainId);
            
            toast({ title: "Wallet Connected", description: `Connected to ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}` });

        } catch (error: any) {
            console.error("Failed to connect wallet:", error);
            toast({ title: "Connection Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
        }
    }, [toast]);
    
     useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const ethProvider = getProvider();
            if (!ethProvider) return;

            setProvider(ethProvider);

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            const checkConnection = async () => {
                try {
                    const accounts = await ethProvider.send('eth_accounts', []);
                    if (accounts.length > 0) {
                        handleAccountsChanged(accounts);
                        const network = await ethProvider.getNetwork();
                        setChainId(network.chainId);
                    }
                } catch (err) {
                    console.error("Could not check for existing connection:", err);
                }
            };
            checkConnection();

            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, [handleAccountsChanged, handleChainChanged]);

    // Effect for listening to contract events
    useEffect(() => {
        if (!provider || !account) return;

        const eventMappings: { contract: keyof AppContracts; event: string; handler: (...args: any[]) => void }[] = [
            { contract: 'trustOracle', event: 'OracleSlashed', handler: (oracle, amount, reason, event: Log) => {
                addAlert({ source: 'CONTRACT ALERT', message: `Oracle ${String(oracle).slice(0,6)}... slashed for ${ethers.formatEther(amount)} ETH`, impact: 'Oracle Network', txHash: event.transactionHash });
            }},
            { contract: 'proofLedgerCore', event: 'DigitalTwinMinted', handler: (tokenId, assetId, assetType, event: Log) => {
                addAlert({ source: 'MINTING', message: `New Digital Twin minted with ID ${tokenId.toString()}`, impact: 'Asset Registry', txHash: event.transactionHash });
            }},
             { contract: 'insuranceHub', event: 'ClaimFiled', handler: (claimId, policyId, claimant, amount, event: Log) => {
                addAlert({ source: 'INSURANCE EVENT', message: `Claim #${claimId.toString()} filed for ${ethers.formatUnits(amount, 2)} USD`, impact: 'Insurance', txHash: event.transactionHash });
            }},
        ];
        
        const unsubscribers: (() => void)[] = [];

        eventMappings.forEach(({ contract, event, handler }) => {
            listenToEvent(contract, event, handler, provider).then(unsubscriber => {
                if (unsubscriber) unsubscribers.push(unsubscriber);
            });
        });

        // Cleanup function to unsubscribe from all events
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };

    }, [provider, account, addAlert]);
    

    const value: WalletContextType = {
        provider,
        account,
        chainId,
        isConnected: !!account,
        systemAlerts,
        connectWallet,
        disconnectWallet
    };

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
