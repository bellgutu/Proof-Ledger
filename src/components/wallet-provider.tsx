
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers, type BrowserProvider, type Log } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { getProvider, listenToEvent } from '@/lib/blockchain';
import { AppContracts } from '@/config/contracts';
import { Diamond, Wheat, Building } from 'lucide-react';

// Define the shape of an alert
export interface SystemAlert {
    source: string;
    message: string;
    impact: string;
    time: string;
    txHash?: string;
}

// Define the shape of an asset
export interface Asset {
    tokenId: string;
    name: string;
    assetType: string;
    status: string;
    icon: React.ReactNode;
    overview: { [key: string]: string };
    provenance: { status: string; date: string; verifier: string; icon: React.ElementType }[];
    insurance: { status: string; policyId: string; provider: string; coverage: string; nextPremiumDue: string; };
    custody: { current: string; location: string; history: { custodian: string; date: string; }[] };
}

interface WalletContextType {
    provider: BrowserProvider | null;
    account: string | null;
    chainId: bigint | null;
    isConnected: boolean;
    systemAlerts: SystemAlert[];
    myAssets: Asset[];
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

// A helper to create a new asset object when a mint event is detected
const createAssetFromEvent = (tokenId: string, assetType: number): Asset => {
    // This is still using mock details, but it's triggered by a REAL event.
    // In a full implementation, these details would be fetched from IPFS via the metadataURI.
    const baseAsset = {
        tokenId: tokenId,
        status: "Verified",
        provenance: [{ status: "Digital Twin Minted", date: new Date().toLocaleDateString(), verifier: "You", icon: ethers.ZeroAddress }],
        insurance: { status: "Not Insured", policyId: "N/A", provider: "N/A", coverage: "$0", nextPremiumDue: "N/A" },
        custody: { current: "You", location: "Your Wallet", history: [] },
    };

    switch (assetType) {
        case 2: // Luxury
            return {
                ...baseAsset,
                name: `Luxury Asset #${tokenId}`,
                assetType: "Luxury Good",
                icon: <Diamond className="h-8 w-8 text-primary" />,
                overview: { "Serial No.": `SN-${tokenId}`, "Minted On": new Date().toLocaleDateString() },
            };
        case 3: // Commodity
            return {
                ...baseAsset,
                name: `Commodity Batch #${tokenId}`,
                assetType: "Commodity",
                icon: <Wheat className="h-8 w-8 text-primary" />,
                overview: { "Batch ID": `BATCH-${tokenId}`, "Minted On": new Date().toLocaleDateString() },
            };
        case 1: // Real Estate
        default:
            return {
                ...baseAsset,
                name: `Real Estate #${tokenId}`,
                assetType: "Real Estate",
                icon: <Building className="h-8 w-8 text-primary" />,
                overview: { "Parcel ID": `APN-${tokenId}`, "Minted On": new Date().toLocaleDateString() },
            };
    }
};


export function WalletProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<bigint | null>(null);
    const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(initialAlerts);
    const [myAssets, setMyAssets] = useState<Asset[]>([]);
    const { toast } = useToast();

    const addAlert = useCallback((alert: Omit<SystemAlert, 'time'>) => {
        const newAlert = { ...alert, time: 'Just now' };
        setSystemAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 10)); // Keep a max of 10 alerts
    }, []);

    const handleAccountsChanged = useCallback((accounts: string[]) => {
        if (accounts.length === 0) {
            console.log('Please connect to MetaMask.');
            setAccount(null);
            setMyAssets([]); // Clear assets on disconnect
            toast({ title: "Wallet Disconnected", description: "Your wallet has been disconnected.", variant: "destructive" });
        } else if (accounts[0] !== account) {
            setAccount(accounts[0]);
            setMyAssets([]); // Clear assets on account switch
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
        setMyAssets([]); // Clear assets
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
            setMyAssets([]); // Clear any previous assets
            
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
                 const newAsset = createAssetFromEvent(tokenId.toString(), Number(assetType));
                 setMyAssets(prevAssets => [newAsset, ...prevAssets]);
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
        myAssets,
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
