
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction } from 'react';

type AssetSymbol = 'ETH' | 'USDC' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'BTC';

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
};


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
    solBalance: 100,
  });
  
  const [marketData, setMarketData] = useState<MarketData>(initialMarketData);
  const [isMarketDataLoaded, setIsMarketDataLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0.00');

  useEffect(() => {
    if (!isMarketDataLoaded) return;
    const total = 
        walletData.ethBalance * marketData.ETH.price + 
        walletData.usdcBalance * marketData.USDC.price + 
        walletData.bnbBalance * marketData.BNB.price + 
        walletData.usdtBalance * marketData.USDT.price + 
        walletData.xrpBalance * marketData.XRP.price +
        walletData.solBalance * marketData.SOL.price;
    setWalletBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [walletData, marketData, isMarketDataLoaded]);

  // Real-time market data fetching from CoinGecko
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const coinIds = 'bitcoin,ethereum,solana,binancecoin,ripple,tether,usd-coin';
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}`);
        if (!response.ok) {
          throw new Error('Failed to fetch market data from CoinGecko');
        }
        const data = await response.json();
        
        setMarketData(prevData => {
            const newData: MarketData = { ...initialMarketData, ...prevData };
            data.forEach((coin: any) => {
                const symbol = coin.symbol.toUpperCase() as AssetSymbol;
                if (newData[symbol]) {
                    newData[symbol] = {
                        ...newData[symbol],
                        price: coin.current_price,
                        change: coin.price_change_percentage_24h,
                    };
                }
            });
            return newData;
        });

        if (!isMarketDataLoaded) {
          setIsMarketDataLoaded(true);
        }

      } catch (error) {
        console.error("Error fetching market data:", error);
      }
    };

    fetchMarketData();
    const marketUpdateInterval = setInterval(fetchMarketData, 5000); // Update every 5 seconds

    return () => clearInterval(marketUpdateInterval);
  }, [isMarketDataLoaded]);

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

  const setSolBalance = (updater: SetStateAction<number>) => {
    setWalletData(prev => ({ ...prev, solBalance: typeof updater === 'function' ? updater(prev.solBalance) : updater }));
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
