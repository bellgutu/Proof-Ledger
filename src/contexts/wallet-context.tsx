
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import type { Transaction, VaultStrategy, Proposal } from '@/components/pages/finance';


type AssetSymbol = 'ETH' | 'USDC' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'BTC' | 'WETH' | 'LINK';

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

  // DeFi State
  transactions: Transaction[];
  vaultWeth: number;
  vaultUsdc: number;
  activeStrategy: VaultStrategy | null;
  proposals: Proposal[];

  // Liquidity State
  availablePools: Pool[];
  userPositions: UserPosition[];
}

interface WalletActions {
  connectWallet: () => void;
  disconnectWallet: () => void;
  updateBalance: (symbol: string, amount: number) => void;

  // DeFi Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status'>) => void;
  setVaultWeth: React.Dispatch<SetStateAction<number>>;
  setVaultUsdc: React.Dispatch<SetStateAction<number>>;
  setActiveStrategy: React.Dispatch<SetStateAction<VaultStrategy | null>>;
  setProposals: React.Dispatch<SetStateAction<Proposal[]>>;

  // Liquidity Actions
  setAvailablePools: React.Dispatch<SetStateAction<Pool[]>>;
  setUserPositions: React.Dispatch<SetStateAction<UserPosition[]>>;
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
    LINK: { name: 'Chainlink', symbol: 'LINK', price: 0, change: 0},
};

const initialAvailablePools: Pool[] = [
    { id: '1', name: 'WETH/USDC', type: 'V2', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5, feeTier: 0.3 },
    { id: '4', name: 'USDC/USDT', type: 'Stable', token1: { symbol: 'USDC', amount: 0 }, token2: { symbol: 'USDT', amount: 0 }, tvl: 250_000_000, volume24h: 55_000_000, apr: 2.8 },
    { id: '2', name: 'WETH/USDT', type: 'V2', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDT', amount: 0 }, tvl: 120_000_000, volume24h: 25_000_000, apr: 11.8, feeTier: 0.3 },
    { id: '3', name: 'SOL/USDC', type: 'V3', token1: { symbol: 'SOL', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 80_000_000, volume24h: 40_000_000, apr: 18.2, feeTier: 0.05, priceRange: { min: 120, max: 200 } },
];

const initialProposals: Proposal[] = [
    { id: '1', title: 'Increase LP Rewards for WETH/USDC', description: 'Boost the rewards for the WETH/USDC pool by 5% to attract more liquidity.', votesFor: 1250000, votesAgainst: 340000 },
    { id: '2', title: 'Onboard a new collateral asset: LINK', description: 'Allow Chainlink (LINK) to be used as collateral within the protocol.', votesFor: 850000, votesAgainst: 600000 },
    { id: '3', title: 'Adjust AI Vault Risk Parameters', description: 'Slightly increase the risk tolerance of the AI Strategy Vault to pursue higher yields.', votesFor: 450000, votesAgainst: 480000 },
];

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState<Balances>({
    ETH: 10,
    WETH: 5,
    USDC: 25000,
    BTC: 0.5,
    SOL: 100,
    USDT: 10000,
    LINK: 500,
    BNB: 15,
    XRP: 5000,
  });
  
  const [marketData, setMarketData] = useState<MarketData>(initialMarketData);
  const [isMarketDataLoaded, setIsMarketDataLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0.00');

  // DeFi State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vaultWeth, setVaultWeth] = useState(0);
  const [vaultUsdc, setVaultUsdc] = useState(0);
  const [activeStrategy, setActiveStrategy] = useState<VaultStrategy | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);

  // Liquidity State
  const [availablePools, setAvailablePools] = useState<Pool[]>(initialAvailablePools);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);

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
        const coinIds = 'bitcoin,ethereum,solana,binancecoin,ripple,tether,usd-coin,chainlink';
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
        
        if (!response.ok) {
          throw new Error(`CoinGecko API request failed with status ${response.status}`);
        }
        
        const liveData = await response.json();

        setMarketData(prevData => {
            const newData: MarketData = { ...prevData };
            
            const mapCoinGeckoToSymbol: { [key: string]: AssetSymbol } = {
              'bitcoin': 'BTC',
              'ethereum': 'ETH',
              'solana': 'SOL',
              'binancecoin': 'BNB',
              'ripple': 'XRP',
              'tether': 'USDT',
              'usd-coin': 'USDC',
              'chainlink': 'LINK',
            };

            for (const id in liveData) {
                const symbol = mapCoinGeckoToSymbol[id];
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
    setTimeout(() => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
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

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'status'>) => {
    setTransactions(prev => [...prev, { id: new Date().toISOString(), status: 'Completed', ...transaction }]);
  }, []);

  const value: WalletContextType = {
      walletState: { 
        isConnected, 
        isConnecting, 
        walletAddress, 
        balances, 
        walletBalance, 
        marketData, 
        isMarketDataLoaded,
        transactions,
        vaultWeth,
        vaultUsdc,
        activeStrategy,
        proposals,
        availablePools,
        userPositions,
      },
      walletActions: {
          connectWallet,
          disconnectWallet,
          updateBalance,
          addTransaction,
          setVaultWeth,
          setVaultUsdc,
          setActiveStrategy,
          setProposals,
          setAvailablePools,
          setUserPositions,
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
