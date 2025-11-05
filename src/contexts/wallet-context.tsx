
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useEnsName } from 'wagmi';
import { type Address, type Chain } from 'viem';
import { useWeb3Modal } from '@web3modal/wagmi/react';

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
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => void;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);


export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { open } = useWeb3Modal();

  // --- WAGMI HOOKS ---
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  
  // --- WRAPPER ACTIONS ---
  const handleConnect = useCallback(() => {
    open();
  }, [open]);

  const handleDisconnect = useCallback(async () => {
    // Web3Modal handles disconnect. We can just open it.
    open();
  }, [open]);
  
  const handleSwitchChain = useCallback((chainId: number) => {
    open({ view: 'Networks' });
  }, [open]);


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
