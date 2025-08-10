
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction, useRef } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { getWalletAssets, sendTransaction, type ChainAsset } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';

type AssetSymbol = 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'BTC' | 'WETH' | 'LINK' | 'USDC';

export interface Transaction {
  id: string;
  type: 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote' | 'Send' | 'Receive';
  details: string | React.ReactNode;
  status: 'Completed' | 'Pending' | 'Failed';
  token?: string;
  amount?: number;
}

export type { ChainAsset };

export interface VaultStrategy {
    name: string;
    value: number;
    asset: 'WETH';
    apy: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  userVote?: 'for' | 'against';
}


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
  transactions: Transaction[];
  vaultWeth: number;
  activeStrategy: VaultStrategy | null;
  proposals: Proposal[];
  availablePools: Pool[];
  userPositions: UserPosition[];
}

interface WalletActions {
  connectWallet: () => void;
  disconnectWallet: () => void;
  updateBalance: (symbol: string, amount: number) => void;
  setBalances: React.Dispatch<SetStateAction<Balances>>;
  sendTokens: (toAddress: string, tokenSymbol: string, amount: number) => Promise<{ success: boolean; txHash: string }>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status'>, status?: Transaction['status']) => string;
  setVaultWeth: React.Dispatch<SetStateAction<number>>;
  setActiveStrategy: React.Dispatch<SetStateAction<VaultStrategy | null>>;
  setProposals: React.Dispatch<SetStateAction<Proposal[]>>;
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
    { id: '2', name: 'WETH/USDT', type: 'V2', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDT', amount: 0 }, tvl: 120_000_000, volume24h: 25_000_000, apr: 11.8, feeTier: 0.3 },
];

const initialProposals: Proposal[] = [
    { id: '1', title: 'Increase LP Rewards for WETH/USDT', description: 'Boost the rewards for the WETH/USDT pool by 5% to attract more liquidity.', votesFor: 1250000, votesAgainst: 340000 },
    { id: '2', title: 'Onboard a new collateral asset: LINK', description: 'Allow Chainlink (LINK) to be used as collateral within the protocol.', votesFor: 850000, votesAgainst: 600000 },
];

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState<Balances>({});
  
  const [marketData, setMarketData] = useState<MarketData>(initialMarketData);
  const [isMarketDataLoaded, setIsMarketDataLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0.00');

  // DeFi State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vaultWeth, setVaultWeth] = useState(0);
  const [activeStrategy, setActiveStrategy] = useState<VaultStrategy | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);

  // Liquidity State
  const [availablePools, setAvailablePools] = useState<Pool[]>(initialAvailablePools);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  
  const { toast } = useToast();
  const balancesRef = useRef(balances);
  const transactionsRef = useRef(transactions);

  useEffect(() => {
    balancesRef.current = balances;
  }, [balances]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);


  // Calculate total wallet balance whenever underlying assets or prices change
  useEffect(() => {
    if (!isMarketDataLoaded || !isConnected) {
      setWalletBalance('0.00');
      return;
    };
    const total = Object.entries(balances).reduce((acc, [symbol, balance]) => {
      const price = marketData[symbol]?.price || 0;
      return acc + (balance * price);
    }, 0);
    setWalletBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [balances, marketData, isMarketDataLoaded, isConnected]);

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
    const marketUpdateInterval = setInterval(fetchMarketData, 30000);

    return () => clearInterval(marketUpdateInterval);
  }, [isMarketDataLoaded]);
  
  const getTxHistoryStorageKey = (address: string) => `tx_history_${address}`;

  const loadTransactions = useCallback((address: string) => {
    try {
        const storedHistory = localStorage.getItem(getTxHistoryStorageKey(address));
        if (storedHistory) {
            setTransactions(JSON.parse(storedHistory));
        } else {
            setTransactions([]);
        }
    } catch (e) {
        console.error("Failed to load transaction history:", e);
        setTransactions([]);
    }
  }, []);

  const persistTransactions = useCallback((txs: Transaction[], address: string) => {
      if (!address) return;
       try {
        // Remove react components before storing
        const storableTxs = txs.map(tx => {
            if (typeof tx.details !== 'string') {
                return {...tx, details: 'React Component'};
            }
            return tx;
        });
        localStorage.setItem(getTxHistoryStorageKey(address), JSON.stringify(storableTxs));
       } catch (e) {
        console.error("Failed to persist transaction history:", e);
       }
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'status'>, status: Transaction['status'] = 'Completed') => {
    const newTxId = new Date().toISOString() + Math.random();
    setTransactions(prevTxs => {
      const newTx = { id: newTxId, status, ...transaction };
      const newTxs = [...prevTxs, newTx];
      if (walletAddress) {
        persistTransactions(newTxs, walletAddress);
      }
      return newTxs;
    });
    return newTxId;
  }, [walletAddress, persistTransactions]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    setWalletAddress(address);

    try {
        const assets = await getWalletAssets(address);
        const newBalances = assets.reduce((acc, asset) => {
            acc[asset.symbol] = asset.balance;
            return acc;
        }, {} as Balances);
        setBalances(newBalances);
        loadTransactions(address);
        setIsConnected(true);
    } catch (e) {
        console.error("Failed to get wallet assets:", e);
        setBalances({});
        setIsConnected(false);
    } finally {
        setIsConnecting(false);
    }
  }, [loadTransactions]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setWalletAddress('');
    setBalances({});
    setTransactions([]);
  }, []);
  
  const updateBalance = useCallback((symbol: string, amount: number) => {
    setBalances(prev => ({
        ...prev,
        [symbol]: (prev[symbol] || 0) + amount
    }));
  }, []);

  const sendTokens = useCallback(async (toAddress: string, tokenSymbol: string, amount: number) => {
    if (!isConnected || !walletAddress) throw new Error("Wallet not connected");

    const pendingTxId = addTransaction({
      type: 'Send',
      details: `Sending ${amount} ${tokenSymbol} to ${toAddress.slice(0, 10)}...`,
      token: tokenSymbol,
      amount,
    }, 'Pending');

    try {
        const result = await sendTransaction(walletAddress, toAddress, tokenSymbol, amount);
        
        setTransactions(prevTxs => {
            const newTxs = prevTxs.map(tx => {
                if (tx.id === pendingTxId) {
                    updateBalance(tokenSymbol, -amount);
                    return { ...tx, status: 'Completed' as const, details: `Sent ${amount} ${tokenSymbol} to ${toAddress.slice(0, 10)}... Tx: ${result.txHash.slice(0,10)}...` };
                }
                return tx;
            });
            persistTransactions(newTxs, walletAddress);
            return newTxs;
        });
        return result;

    } catch(e) {
        console.error('Send token transaction failed:', e);
        setTransactions(prevTxs => {
            const newTxs = prevTxs.map(tx => 
                tx.id === pendingTxId ? { ...tx, status: 'Failed' as const, details: `Failed to send ${amount} ${tokenSymbol}` } : tx
            );
            persistTransactions(newTxs, walletAddress);
            return newTxs;
        });
        // Re-throw to be caught by the UI component
        throw e;
    }

  }, [isConnected, walletAddress, addTransaction, updateBalance, persistTransactions]);

  useEffect(() => {
    if (!isConnected || !walletAddress) {
        return;
    }

    const checkForUpdates = async () => {
        try {
            const newAssets = await getWalletAssets(walletAddress);
            const currentBalances = balancesRef.current;
            const newBalances: Balances = {};

            for (const asset of newAssets) {
                newBalances[asset.symbol] = asset.balance;
                const oldBalance = currentBalances[asset.symbol] || 0;
                
                if (asset.balance > oldBalance) {
                    const amountReceived = asset.balance - oldBalance;
                    
                    const isLikelySelfSend = transactionsRef.current.some(tx => 
                        tx.type === 'Send' &&
                        tx.status === 'Pending' &&
                        tx.token === asset.symbol &&
                        Math.abs(tx.amount! - amountReceived) < 0.0001
                    );
                    
                    if (!isLikelySelfSend) {
                        addTransaction({
                            type: 'Receive',
                            details: `Received ${amountReceived.toLocaleString(undefined, {maximumFractionDigits: 6})} ${asset.symbol}`,
                            token: asset.symbol,
                            amount: amountReceived,
                        });
                        toast({
                            title: 'Transaction Received!',
                            description: `Your balance has been updated with ${amountReceived.toLocaleString(undefined, {maximumFractionDigits: 6})} ${asset.symbol}.`
                        });
                    }
                }
            }
            setBalances(newBalances);
        } catch (error) {
            console.error("Failed to check for wallet updates:", error);
        }
    };

    const intervalId = setInterval(checkForUpdates, 15000);

    return () => clearInterval(intervalId);
  }, [isConnected, walletAddress, addTransaction, toast]);


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
        activeStrategy,
        proposals,
        availablePools,
        userPositions,
      },
      walletActions: {
          connectWallet,
          disconnectWallet,
          updateBalance,
          setBalances,
          sendTokens,
          addTransaction,
          setVaultWeth,
          setActiveStrategy,
          setProposals,
          setAvailablePools,
          setUserPositions,
      }
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
