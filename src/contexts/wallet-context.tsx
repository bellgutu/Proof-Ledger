"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction } from 'react';

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string;
  ethBalance: number;
  usdcBalance: number;
  walletBalance: string;
}

interface WalletActions {
  connectWallet: () => void;
  disconnectWallet: () => void;
  setEthBalance: (updater: SetStateAction<number>) => void;
  setUsdcBalance: (updater: SetStateAction<number>) => void;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletData, setWalletData] = useState({
    isConnected: false,
    isConnecting: false,
    walletAddress: '',
    ethBalance: 10,
    usdcBalance: 25000,
  });
  const [walletBalance, setWalletBalance] = useState('0.00');

  useEffect(() => {
    const ethPrice = 3500; // Simulated price
    const total = walletData.ethBalance * ethPrice + walletData.usdcBalance;
    setWalletBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [walletData.ethBalance, walletData.usdcBalance]);

  const connectWallet = useCallback(() => {
    setWalletData(prev => ({ ...prev, isConnecting: true }));
    setTimeout(() => {
      const address = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setWalletData(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        walletAddress: address,
      }));
    }, 1500);
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletData(prev => ({ ...prev, isConnected: false, walletAddress: '' }));
  }, []);
  
  const setEthBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, ethBalance: typeof updater === 'function' ? updater(prev.ethBalance) : updater }));
  };

  const setUsdcBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, usdcBalance: typeof updater === 'function' ? updater(prev.usdcBalance) : updater }));
  };

  const value = {
      walletState: { ...walletData, walletBalance },
      walletActions: {
          connectWallet,
          disconnectWallet,
          setEthBalance,
          setUsdcBalance,
      }
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
