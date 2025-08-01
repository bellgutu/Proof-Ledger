"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction } from 'react';

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string;
  ethBalance: number;
  usdcBalance: number;
  bnbBalance: number;
  usdtBalance: number;
  xrpBalance: number;
  walletBalance: string;
}

interface WalletActions {
  connectWallet: () => void;
  disconnectWallet: () => void;
  setEthBalance: (updater: SetStateAction<number>) => void;
  setUsdcBalance: (updater: SetStateAction<number>) => void;
  setBnbBalance: (updater: SetStateAction<number>) => void;
  setUsdtBalance: (updater: SetStateAction<number>) => void;
  setXrpBalance: (updater: SetStateAction<number>) => void;
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
    bnbBalance: 50,
    usdtBalance: 10000,
    xrpBalance: 20000,
  });
  const [walletBalance, setWalletBalance] = useState('0.00');

  useEffect(() => {
    const ethPrice = 3500;
    const bnbPrice = 600;
    const xrpPrice = 0.5;
    const total = 
        walletData.ethBalance * ethPrice + 
        walletData.usdcBalance + 
        walletData.bnbBalance * bnbPrice + 
        walletData.usdtBalance + 
        walletData.xrpBalance * xrpPrice;
    setWalletBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [walletData.ethBalance, walletData.usdcBalance, walletData.bnbBalance, walletData.usdtBalance, walletData.xrpBalance]);

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

  const setBnbBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, bnbBalance: typeof updater === 'function' ? updater(prev.bnbBalance) : updater }));
  };

  const setUsdtBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, usdtBalance: typeof updater === 'function' ? updater(prev.usdtBalance) : updater }));
  };

  const setXrpBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, xrpBalance: typeof updater === 'function' ? updater(prev.xrpBalance) : updater }));
  };

  const value = {
      walletState: { ...walletData, walletBalance },
      walletActions: {
          connectWallet,
          disconnectWallet,
          setEthBalance,
          setUsdcBalance,
          setBnbBalance,
          setUsdtBalance,
          setXrpBalance,
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
