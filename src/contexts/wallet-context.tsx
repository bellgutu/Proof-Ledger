
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useConnect, useDisconnect, useEnsName, useChainId, useSwitchChain } from 'wagmi';
import { type Address, type Chain } from 'viem';

// --- TYPE DEFINITIONS ---

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: Address | undefined;
  chain: Chain | undefined;
  ensName: string | null | undefined;
}

interface WalletActions {
  connect: () => void;
  disconnect: () => void;
  switchChain: (chainId: number) => void;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);


export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  // --- WAGMI HOOKS ---
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connect, connectors } = useConnect({
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet.",
      });
    }
  });
  const { disconnect: wagmiDisconnect } = useDisconnect({
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Your wallet has been disconnected.",
      });
    }
  });
  const { data: ensName } = useEnsName({ address });
  const { switchChain: wagmiSwitchChain } = useSwitchChain({
     onError: (error) => {
      toast({
        variant: "destructive",
        title: "Chain Switch Failed",
        description: error.message || "Could not switch network.",
      });
    }
  });

  // --- WRAPPER ACTIONS ---
  const handleConnect = useCallback(() => {
    // Connect to the first available connector, which is typically the injected one (MetaMask).
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    } else {
       toast({
        variant: "destructive",
        title: "No Connector Found",
        description: "Please install a wallet like MetaMask.",
      });
    }
  }, [connect, connectors, toast]);

  const handleDisconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);
  
  const handleSwitchChain = useCallback((chainId: number) => {
    wagmiSwitchChain({ chainId });
  }, [wagmiSwitchChain]);


  const walletState: WalletState = {
    isConnected,
    isConnecting,
    address,
    chain,
    ensName,
  };

  const walletActions: WalletActions = {
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchChain: handleSwitchChain,
  };
  
  const value: WalletContextType = {
      walletState,
      walletActions
  }

  return (
    <WalletContext.Provider value={value}>
        {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
