
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, SetStateAction, useRef } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { getWalletAssets, sendTransaction, type ChainAsset } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';

type AssetSymbol = 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'WETH' | 'LINK' | 'USDC';

export type TransactionType = 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote' | 'Send' | 'Receive';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Transaction {
  id: string;
  txHash: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: number;
  from: string;
  to: string;
  details: string | React.ReactNode;
  token?: string;
  amount?: number;
}

export interface TxStatusDialogInfo {
  isOpen: boolean;
  state: 'processing' | 'success' | 'error';
  transaction: Partial<Transaction>;
  error?: string;
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
  txStatusDialog: TxStatusDialogInfo;
}

interface WalletActions {
  connectWallet: () => void;
  disconnectWallet: () => void;
  updateBalance: (symbol: string, amount: number) => void;
  setBalances: React.Dispatch<SetStateAction<Balances>>;
  sendTokens: (toAddress: string, tokenSymbol: string, amount: number) => Promise<{ success: boolean; txHash: string }>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to' | 'txHash'> & { to?: string; txHash?: string }) => string;
  updateTransactionStatus: (id: string, status: TransactionStatus, details?: string | React.ReactNode, txHash?: string) => void;
  setVaultWeth: React.Dispatch<SetStateAction<number>>;
  setActiveStrategy: React.Dispatch<SetStateAction<VaultStrategy | null>>;
  setProposals: React.Dispatch<SetStateAction<Proposal[]>>;
  setAvailablePools: React.Dispatch<SetStateAction<Pool[]>>;
  setUserPositions: React.Dispatch<SetStateAction<UserPosition[]>>;
  setTxStatusDialog: React.Dispatch<SetStateAction<TxStatusDialogInfo>>;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const initialMarketData: MarketData = {
    ETH: { name: 'Ethereum', symbol: 'ETH', price: 0, change: 0 },
    SOL: { name: 'Solana', symbol: 'SOL', price: 0, change: 0 },
    BNB: { name: 'BNB', symbol: 'BNB', price: 0, change: 0 },
    USDT: { name: 'Tether', symbol: 'USDT', price: 1, change: 0 },
    USDC: { name: 'USD Coin', symbol: 'USDC', price: 1, change: 0 },
    WETH: { name: 'Wrapped Ether', symbol: 'WETH', price: 0, change: 0},
    LINK: { name: 'Chainlink', symbol: 'LINK', price: 0, change: 0},
    XRP: { name: 'XRP', symbol: 'XRP', price: 0, change: 0},
};

const initialAvailablePools: Pool[] = [
    { id: '1', name: 'ETH/USDT', type: 'V2', token1: { symbol: 'ETH', amount: 0 }, token2: { symbol: 'USDT', amount: 0 }, tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5, feeTier: 0.3 },
    { id: '2', name: 'WETH/USDC', type: 'V2', token1: { symbol: 'WETH', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 120_000_000, volume24h: 25_000_000, apr: 11.8, feeTier: 0.3 },
    { id: '3', name: 'USDT/USDC', type: 'Stable', token1: { symbol: 'USDT', amount: 0 }, token2: { symbol: 'USDC', amount: 0 }, tvl: 250_000_000, volume24h: 50_000_000, apr: 2.1 },
    { id: '4', name: 'ETH/LINK', type: 'V3', token1: { symbol: 'ETH', amount: 0 }, token2: { symbol: 'LINK', amount: 0 }, tvl: 80_000_000, volume24h: 15_000_000, apr: 18.2, feeTier: 1.0, priceRange: { min: 150, max: 250 } },
];

const initialProposals: Proposal[] = [
    { id: '1', title: 'Increase LP Rewards for WETH/USDC', description: 'Boost the rewards for the WETH/USDC pool by 5% to attract more liquidity.', votesFor: 1250000, votesAgainst: 340000 },
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
  
  // Tx Status Dialog State
  const [txStatusDialog, setTxStatusDialog] = useState<TxStatusDialogInfo>({
    isOpen: false,
    state: 'processing',
    transaction: {}
  });
  
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

  // Fetch real-time market data from our API route
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/prices');
        
        if (!response.ok) {
          throw new Error(`API price route failed with status ${response.status}`);
        }
        
        const liveData = await response.json();

        setMarketData(prevData => {
            const newData: MarketData = { ...prevData };
            
            const mapCoinGeckoToSymbol: { [key: string]: AssetSymbol } = {
              'ethereum': 'ETH',
              'solana': 'SOL',
              'binancecoin': 'BNB',
              'tether': 'USDT',
              'usd-coin': 'USDC',
              'chainlink': 'LINK',
              'ripple': 'XRP',
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
        console.error("Error fetching market data from API route:", error);
      }
    };

    fetchMarketData();
    const marketUpdateInterval = setInterval(fetchMarketData, 30000);

    return () => clearInterval(marketUpdateInterval);
  }, [isMarketDataLoaded]);
  
  const getTxHistoryStorageKey = (address: string) => `tx_history_${address}`;

  const persistTransactions = useCallback((txs: Transaction[], address: string) => {
      if (!address) return;
       try {
        const storableTxs = txs.map(tx => {
            if (typeof tx.details !== 'string') {
                return {...tx, details: `React Component: ${tx.type}`};
            }
            return tx;
        });
        localStorage.setItem(getTxHistoryStorageKey(address), JSON.stringify(storableTxs));
       } catch (e) {
        console.error("Failed to persist transaction history:", e);
       }
  }, []);
  
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

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to' | 'txHash'> & { to?: string; txHash?: string }) => {
    if(!walletAddress) return '';
    const newTxId = Date.now().toString() + Math.random().toString();
    const newTx: Transaction = { 
        id: newTxId, 
        status: 'Pending', 
        from: walletAddress,
        to: transaction.to || '0x0000000000000000000000000000000000000000', // Default to address
        timestamp: Date.now(),
        txHash: transaction.txHash || '',
        ...transaction 
    };

    setTransactions(prevTxs => {
      const newTxs = [newTx, ...prevTxs];
      persistTransactions(newTxs, walletAddress);
      return newTxs;
    });

    return newTxId;
  }, [walletAddress, persistTransactions]);
  
  const updateTransactionStatus = useCallback((id: string, status: TransactionStatus, details?: string | React.ReactNode, txHash?: string) => {
    setTransactions(prev => {
        const newTxs = prev.map(tx => {
            if (tx.id === id) {
                return { ...tx, status, ...(details && { details }), ...(txHash && { txHash }) };
            }
            return tx;
        });
        if (walletAddress) persistTransactions(newTxs, walletAddress);
        return newTxs;
    });
  }, [walletAddress, persistTransactions]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    // This is a simulated connection. We avoid direct interaction with browser wallets.
    const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Default hardhat address
    
    try {
        const assets = await getWalletAssets(address);
        
        const newBalances = assets.reduce((acc, asset) => {
          acc[asset.symbol] = asset.balance;
          return acc;
        }, {} as Balances);

        setWalletAddress(address);
        setBalances(newBalances);
        loadTransactions(address);
        setIsConnected(true);
    } catch (e: any) {
        console.error("Failed to get wallet assets during simulated connection:", e);
        toast({
            variant: "destructive",
            title: "Connection Failed",
            description: e.message || "Could not connect to the local blockchain. Please ensure it's running.",
        });
        setBalances({});
        setIsConnected(false);
    } finally {
        setIsConnecting(false);
    }
  }, [loadTransactions, toast]);

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
    
    setTxStatusDialog({
      isOpen: true,
      state: 'processing',
      transaction: { amount, token: tokenSymbol, to: toAddress }
    });

    const pendingTxId = addTransaction({
      type: 'Send',
      to: toAddress,
      details: `Sending ${amount} ${tokenSymbol} to ${toAddress.slice(0, 10)}...`,
      token: tokenSymbol,
      amount,
    });

    try {
        const result = await sendTransaction(walletAddress, toAddress, tokenSymbol, amount);
        
        updateBalance(tokenSymbol, -amount);
        updateTransactionStatus(pendingTxId, 'Completed', `Sent ${amount} ${tokenSymbol} to ${toAddress.slice(0, 10)}...`, result.txHash);
        
        setTxStatusDialog(prev => ({
          ...prev,
          state: 'success',
          transaction: { ...prev.transaction, txHash: result.txHash }
        }));
        
        return result;

    } catch(e: any) {
        console.error('Send token transaction failed:', e);
        updateTransactionStatus(pendingTxId, 'Failed', `Failed to send ${amount} ${tokenSymbol}`);
        
        setTxStatusDialog(prev => ({
          ...prev,
          state: 'error',
          error: e.message || 'An unknown error occurred.'
        }));
        
        throw e;
    } finally {
        setTimeout(() => { isSendingRef.current = false; }, 5000);
    }

  }, [isConnected, walletAddress, addTransaction, updateBalance, updateTransactionStatus]);


  // Effect for polling for external wallet updates
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    const pollForUpdates = async () => {
        if (isSendingRef.current) return;
        
        const notificationsToShow: { title: string; description: string }[] = [];

        try {
            const remoteAssets = await getWalletAssets(walletAddress);
            
            setBalances(currentLocalBalances => {
                const newBalancesFromRemote = remoteAssets.reduce((acc, asset) => {
                  acc[asset.symbol] = asset.balance;
                  return acc;
                }, {} as Balances);

                // Check for received transactions
                for (const remoteAsset of remoteAssets) {
                    const localBalance = currentLocalBalances[remoteAsset.symbol] || 0;
                    if (remoteAsset.balance > localBalance) {
                         const amountReceived = remoteAsset.balance - localBalance;
                         addTransaction({
                            type: 'Receive',
                            txHash: `external_${Date.now()}_${remoteAsset.symbol}`,
                            to: walletAddress,
                            details: `Received ${amountReceived.toLocaleString(undefined, {maximumFractionDigits: 6})} ${remoteAsset.symbol}`,
                            token: remoteAsset.symbol,
                            amount: amountReceived,
                        });
                        notificationsToShow.push({
                           title: 'Transaction Received!',
                           description: `Your balance has been updated with ${amountReceived.toLocaleString(undefined, {maximumFractionDigits: 6})} ${remoteAsset.symbol}.`
                        });
                    }
                }
                
                // We trust the remote source, so we set the balances directly.
                // We keep local-only tokens if they have a balance > 0
                for (const symbol in currentLocalBalances) {
                    if (!(symbol in newBalancesFromRemote)) {
                        if (currentLocalBalances[symbol] > 0) {
                            newBalancesFromRemote[symbol] = currentLocalBalances[symbol];
                        }
                    }
                }
                
                return newBalancesFromRemote;
            });

            notificationsToShow.forEach(n => toast(n));

        } catch (error) {
            console.error("Failed to poll for wallet updates:", error);
        }
    };

    const intervalId = setInterval(pollForUpdates, 15000);

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
        txStatusDialog,
      },
      walletActions: {
          connectWallet,
          disconnectWallet,
          updateBalance,
          setBalances,
          sendTokens,
          addTransaction,
          updateTransactionStatus,
          setVaultWeth,
          setActiveStrategy,
          setProposals,
          setAvailablePools,
          setUserPositions,
          setTxStatusDialog
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
