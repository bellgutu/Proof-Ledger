
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

interface Balances {
  [symbol: string]: number;
}

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string;
  balances: Balances;
  walletBalance: string;
  marketData: MarketData;
  isMarketDataLoaded: boolean;
}

interface WalletActions {
  connectWallet: () => void;
  disconnectWallet: () => void;
  setBalances: React.Dispatch<SetStateAction<Balances>>;
  updateBalance: (symbol: string, amount: number) => void;
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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState<Balances>({});
  
  const [marketData, setMarketData] = useState<MarketData>(initialMarketData);
  const [isMarketDataLoaded, setIsMarketDataLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0.00');

  // Calculate total wallet balance whenever underlying assets or prices change
  useEffect(() => {
    if (!isMarketDataLoaded) return;
    const total = Object.entries(balances).reduce((acc, [symbol, balance]) => {
      const price = marketData[symbol]?.price || 0;
      return acc + (balance * price);
    }, 0);
    setWalletBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [balances, marketData, isMarketDataLoaded]);

  // Fetch real-time market data from CoinGecko
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const coinIds = 'bitcoin,ethereum,solana,binancecoin,ripple,tether,usd-coin';
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
        const liveData = await response.json();

        setMarketData(prevData => {
            const newData: MarketData = { ...prevData };
            
            const mapCoinGeckoToSymbol = {
              'bitcoin': 'BTC',
              'ethereum': 'ETH',
              'solana': 'SOL',
              'binancecoin': 'BNB',
              'ripple': 'XRP',
              'tether': 'USDT',
              'usd-coin': 'USDC'
            };

            for (const id in liveData) {
                const symbol = mapCoinGeckoToSymbol[id as keyof typeof mapCoinGeckoToSymbol];
                if (symbol && newData[symbol]) {
                    newData[symbol].price = liveData[id].usd;
                    newData[symbol].change = liveData[id].usd_24h_change;
                }
            }
            
            // Ensure WETH tracks ETH price
            if (newData.ETH && newData.ETH.price > 0) {
              newData.WETH.price = newData.ETH.price;
              newData.WETH.change = newData.ETH.change;
            }

            return newData;
        });

        if (!isMarketDataLoaded) {
          setIsMarketDataLoaded(true);
        }

      } catch (error) {
        console.error("Error fetching market data from CoinGecko:", error);
      }
    };

    fetchMarketData();
    const marketUpdateInterval = setInterval(fetchMarketData, 30000); // Fetch prices every 30 seconds

    return () => clearInterval(marketUpdateInterval);
  }, [isMarketDataLoaded]);

  const connectWallet = useCallback(() => {
    setIsConnecting(true);
    setTimeout(async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      
      const assets = await BlockchainService.getWalletAssets(address);
      
      const newBalances = assets.reduce((acc: Balances, asset) => {
        acc[asset.symbol] = asset.balance;
        return acc;
      }, {});

      setBalances(newBalances);
      setWalletAddress(address);
      setIsConnected(true);
      setIsConnecting(false);
    }, 1500);
  }, []);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setWalletAddress('');
    setBalances({});
  }, []);
  
  const updateBalance = useCallback((symbol: string, amount: number) => {
    setBalances(prev => ({
        ...prev,
        [symbol]: (prev[symbol] || 0) + amount
    }));
  }, []);

  const value: WalletContextType = {
      walletState: { isConnected, isConnecting, walletAddress, balances, walletBalance, marketData, isMarketDataLoaded },
      walletActions: {
          connectWallet,
          disconnectWallet,
          setBalances,
          updateBalance,
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
