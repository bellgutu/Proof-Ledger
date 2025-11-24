
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers, type BrowserProvider } from 'ethers';
import { useToast } from './ui/use-toast';
import { getProvider } from '@/lib/blockchain';

interface WalletContextType {
    provider: BrowserProvider | null;
    account: string | null;
    chainId: bigint | null;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<bigint | null>(null);
    const { toast } = useToast();

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
        if (window.ethereum) {
            const ethProvider = getProvider();
            setProvider(ethProvider);

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, [handleAccountsChanged, handleChainChanged]);
    

    const value: WalletContextType = {
        provider,
        account,
        chainId,
        isConnected: !!account,
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
