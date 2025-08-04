
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction } from 'react';
import * as BlockchainService from '@/services/blockchain-service';

type AssetSymbol = 'ETH' | 'USDC' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'BTC' | 'WETH';

interface MarketData {
  [key: string]: {
    name: string;
    symbol: AssetSymbol;
    price: number;
    change: number;
  };
}

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string;
  ethBalance: number;
  usdcBalance: number;
  bnbBalance: number;
  usdtBalance: number;
  xrpBalance: number;
  solBalance: number;
  wethBalance: number;
  walletBalance: string;
  marketData: MarketData;
  isMarketDataLoaded: boolean;
}

interface WalletActions {
  connectWallet: () => void;
  disconnectWallet: () => void;
  setEthBalance: (updater: SetStateAction<number>) => void;
  setUsdcBalance: (updater: SetStateAction<number>) => void;
  setBnbBalance: (updater: SetStateAction<number>) => void;
  setUsdtBalance: (updater: SetStateAction<number>) => void;
  setXrpBalance: (updater: SetStateAction<number>) => void;
  setSolBalance: (updater: SetStateAction<number>) => void;
  setWethBalance: (updater: SetStateAction<number>) => void;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const initialMarketData: MarketData = {
    BTC: { name: 'Bitcoin', symbol: 'BTC', price: 0, change: 0 },
    ETH: { name: 'Ethereum', symbol: 'ETH', price: 0, change: 0 },
    SOL: { name: 'Solana', symbol: 'SOL', price: 0, change: 0 },
    BNB: { name: 'BNB', symbol: 'BNB', price: 0, change: 0 },
    XRP: { name: 'XRP', symbol: 'XRP', price: 0, change: 0 },
    USDT: { name: 'Tether', symbol: 'USDT', price: 1, change: 0 },
    USDC: { name: 'USD Coin', symbol: 'USDC', price: 1, change: 0 },
    WETH: { name: 'Wrapped Ether', symbol: 'WETH', price: 0, change: 0},
};


export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletData, setWalletData] = useState({
    isConnected: false,
    isConnecting: false,
    walletAddress: '',
    ethBalance: 0,
    usdcBalance: 0,
    bnbBalance: 0,
    usdtBalance: 0,
    xrpBalance: 0,
    solBalance: 0,
    wethBalance: 0,
  });
  
  const [marketData, setMarketData] = useState<MarketData>(initialMarketData);
  const [isMarketDataLoaded, setIsMarketDataLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0.00');

  // Calculate total wallet balance whenever underlying assets or prices change
  useEffect(() => {
    if (!isMarketDataLoaded) return;
    const total = 
        walletData.ethBalance * (marketData.ETH?.price || 0) + 
        walletData.usdcBalance * (marketData.USDC?.price || 0) + 
        walletData.bnbBalance * (marketData.BNB?.price || 0) + 
        walletData.usdtBalance * (marketData.USDT?.price || 0) + 
        walletData.xrpBalance * (marketData.XRP?.price || 0) +
        walletData.solBalance * (marketData.SOL?.price || 0) +
        walletData.wethBalance * (marketData.WETH?.price || 0);
    setWalletBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [walletData, marketData, isMarketDataLoaded]);

  // Fetch market data from our new blockchain service
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const chainData = await BlockchainService.getMarketDataFromChain();
        
        setMarketData(prevData => {
            const newData: MarketData = { ...initialMarketData };
            for (const symbol in chainData) {
                if (newData[symbol as AssetSymbol]) {
                    newData[symbol as AssetSymbol] = {
                        ...newData[symbol as AssetSymbol],
                        price: chainData[symbol].price,
                        change: chainData[symbol].change24h,
                    };
                }
            }
             // Ensure WETH tracks ETH price
            if (newData.ETH.price > 0) {
              newData.WETH.price = newData.ETH.price;
              newData.WETH.change = newData.ETH.change;
            }
            return newData;
        });

        if (!isMarketDataLoaded) {
          setIsMarketDataLoaded(true);
        }

      } catch (error) {
        console.error("Error fetching market data from service:", error);
      }
    };

    fetchMarketData();
    const marketUpdateInterval = setInterval(fetchMarketData, 60000); // Keep polling for fresh data

    return () => clearInterval(marketUpdateInterval);
  }, [isMarketDataLoaded]);

  const connectWallet = useCallback(() => {
    setWalletData(prev => ({ ...prev, isConnecting: true }));
    setTimeout(async () => {
      // In a real app, you would get this from MetaMask or another wallet provider.
      // We will use a hardcoded address for the demo.
      const address = `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`;
      
      const assets = await BlockchainService.getWalletAssets(address);
      
      const newBalances = {
        ethBalance: 0,
        usdcBalance: 0,
        wethBalance: 0,
      };

      assets.forEach(asset => {
        if (asset.symbol === 'ETH') newBalances.ethBalance = asset.balance;
        if (asset.symbol === 'USDC') newBalances.usdcBalance = asset.balance;
        if (asset.symbol === 'WETH') newBalances.wethBalance = asset.balance;
      });

      setWalletData(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        walletAddress: address,
        ...newBalances
      }));
    }, 1500);
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletData(prev => ({ 
        ...prev, 
        isConnected: false, 
        walletAddress: '',
        ethBalance: 0,
        usdcBalance: 0,
        bnbBalance: 0,
        usdtBalance: 0,
        xrpBalance: 0,
        solBalance: 0,
        wethBalance: 0,
    }));
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

  const setSolBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, solBalance: typeof updater === 'function' ? updater(prev.solBalance) : updater }));
  };
  
  const setWethBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, wethBalance: typeof updater === 'function' ? updater(prev.wethBalance) : updater }));
  };

  const value = {
      walletState: { ...walletData, walletBalance, marketData, isMarketDataLoaded },
      walletActions: {
          connectWallet,
          disconnectWallet,
          setEthBalance,
          setUsdcBalance,
          setBnbBalance,
          setUsdtBalance,
          setXrpBalance,
          setSolBalance,
          setWethBalance,
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
