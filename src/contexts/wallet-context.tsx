
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction, useRef } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { getWalletAssets, sendTransaction, type ChainAsset } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';

type AssetSymbol = 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'BTC' | 'WETH' | 'LINK';

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
    USDT: { name: 'Tether', symbol: 'USDT', price: 1, change: 0 },
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
  const isSendingRef = useRef(false);

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
        const coinIds = 'bitcoin,ethereum,solana,binancecoin,ripple,tether,chainlink';
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
              'tether': 'USDT',
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
        
        // --- THIS IS THE FIX ---
        // Create the new balances object directly from the fetched assets
        const newBalances = assets.reduce((acc, asset) => {
            acc[asset.symbol] = asset.balance;
            return acc;
        }, {} as Balances); // <-- Initial value is an empty object

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

    isSendingRef.current = true;
    const pendingTxId = addTransaction({
      type: 'Send',
      details: `Sending ${amount} ${tokenSymbol} to ${toAddress.slice(0, 10)}...`,
      token: tokenSymbol,
      amount,
    }, 'Pending');

    try {
        const result = await sendTransaction(walletAddress, toAddress, tokenSymbol, amount);
        
        // Optimistically update balance immediately
        updateBalance(tokenSymbol, -amount);

        setTransactions(prevTxs => {
            const newTxs = prevTxs.map(tx => {
                if (tx.id === pendingTxId) {
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
    } finally {
        // Reset the flag after a delay to allow the blockchain state to settle
        setTimeout(() => { isSendingRef.current = false; }, 5000);
    }

  }, [isConnected, walletAddress, addTransaction, updateBalance, persistTransactions]);


  // Effect for polling for external wallet updates
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    let toastQueue: { title: string; description: string }[] = [];

    const pollForUpdates = async () => {
        // If a send was just initiated by this app, skip this poll cycle
        if (isSendingRef.current) return;

        try {
            const remoteAssets = await getWalletAssets(walletAddress);
            
            setBalances(currentLocalBalances => {
                const newBalances: Balances = { ...currentLocalBalances };
                let balancesChanged = false;

                remoteAssets.forEach(remoteAsset => {
                    const localBalance = currentLocalBalances[remoteAsset.symbol] || 0;
                    
                    // Detect an incoming transaction
                    if (remoteAsset.balance > localBalance + 0.000001) { // use tolerance
                        const amountReceived = remoteAsset.balance - localBalance;
                        addTransaction({
                            type: 'Receive',
                            details: `Received ${amountReceived.toLocaleString(undefined, {maximumFractionDigits: 6})} ${remoteAsset.symbol}`,
                            token: remoteAsset.symbol,
                            amount: amountReceived,
                        });
                        toastQueue.push({
                           title: 'Transaction Received!',
                           description: `Your balance has been updated with ${amountReceived.toLocaleString(undefined, {maximumFractionDigits: 6})} ${remoteAsset.symbol}.`
                        });
                        newBalances[remoteAsset.symbol] = remoteAsset.balance;
                        balancesChanged = true;
                    } else {
                        // Just sync the balance if it hasn't changed significantly
                        if (newBalances[remoteAsset.symbol] === undefined) {
                            newBalances[remoteAsset.symbol] = remoteAsset.balance;
                        }
                    }
                });

                // This handles tokens that might have been fully spent from an external wallet
                for (const localSymbol in currentLocalBalances) {
                    if (!remoteAssets.some(ra => ra.symbol === localSymbol)) {
                        if(['WETH', 'USDT', 'BTC', 'LINK', 'BNB', 'SOL'].includes(localSymbol)) continue;
                        newBalances[localSymbol] = 0;
                        balancesChanged = true;
                    }
                }
                
                return balancesChanged ? newBalances : currentLocalBalances;
            });

        } catch (error) {
            console.error("Failed to poll for wallet updates:", error);
        }
    };

    const intervalId = setInterval(async () => {
      await pollForUpdates();
      // Fire all collected notifications after the state update
      toastQueue.forEach(n => toast(n));
      toastQueue = [];
    }, 15000);

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
