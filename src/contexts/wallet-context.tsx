
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { getWalletAssets, getCollateralAllowance } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';
import { createWalletClient, custom, createPublicClient, http, parseUnits, defineChain, TransactionExecutionError } from 'viem';
import { localhost } from 'viem/chains';

// --- TYPE DEFINITIONS ---

type AssetSymbol = 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'WETH' | 'LINK' | 'USDC' | 'BTC' | 'XAUT' | 'PEPE' | 'DOGE';

export type TransactionType = 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote' | 'Send' | 'Receive' | 'Approve' | 'Open Position' | 'Close Position';
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

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: number;
}

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
  [symbol:string]: number;
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
  setBalances: React.Dispatch<React.SetStateAction<Balances>>;
  sendTokens: (toAddress: string, tokenSymbol: string, amount: number) => Promise<void>;
  approveCollateral: (amount: string) => Promise<void>;
  openPosition: (params: { side: number; size: string; collateral: string; }) => Promise<void>;
  closePosition: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to'> & { id?: string; to?: string; txHash?: string }) => string;
  updateTransactionStatus: (id: string, status: TransactionStatus, details?: string | React.ReactNode, txHash?: string) => void;
  setVaultWeth: React.Dispatch<React.SetStateAction<number>>;
  setActiveStrategy: React.Dispatch<React.SetStateAction<VaultStrategy | null>>;
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  setAvailablePools: React.Dispatch<React.SetStateAction<Pool[]>>;
  setUserPositions: React.Dispatch<React.SetStateAction<UserPosition[]>>;
  setTxStatusDialog: React.Dispatch<React.SetStateAction<TxStatusDialogInfo>>;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// --- CONFIG & CONSTANTS ---

const anvilChain = defineChain({
  ...localhost,
  id: 31337,
})

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
  pollingInterval: undefined,
});

const PERPETUALS_CONTRACT_ADDRESS = '0xf62eec897fa5ef36a957702aa4a45b58fe8fe312';
const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}`, decimals: number } } = {
    'USDT': { address: '0xf48883f2ae4c4bf4654f45997fe47d73daa4da07', decimals: 18 },
    'USDC': { address: '0x093d305366218d6d09ba10448922f10814b031dd', decimals: 18 },
    'WETH': { address: '0x492844c46cef2d751433739fc3409b7a4a5ba9a7', decimals: 18 },
    'LINK': { address: '0xf0f5e9b00b92f3999021fd8b88ac75c351d93fc7', decimals: 18 },
};

const erc20Abi = [
    { constant: false, inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], type: "function" },
    { constant: false, inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], type: "function" }
] as const;

const perpetualsAbi = [
    { inputs: [{ name: "side", type: "uint8" }, { name: "size", type: "uint256" }, { name: "collateral", type: "uint256" }], name: "openPosition", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [], name: "closePosition", outputs: [], stateMutability: "nonpayable", type: "function" }
] as const;


// --- INITIAL STATE ---

const initialMarketData: MarketData = {
    ETH: { name: 'Ethereum', symbol: 'ETH', price: 0, change: 0 },
    BTC: { name: 'Bitcoin', symbol: 'BTC', price: 0, change: 0 },
    SOL: { name: 'Solana', symbol: 'SOL', price: 0, change: 0 },
    BNB: { name: 'BNB', symbol: 'BNB', price: 0, change: 0 },
    USDT: { name: 'Tether', symbol: 'USDT', price: 1, change: 0 },
    USDC: { name: 'USD Coin', symbol: 'USDC', price: 1, change: 0 },
    WETH: { name: 'Wrapped Ether', symbol: 'WETH', price: 0, change: 0},
    LINK: { name: 'Chainlink', symbol: 'LINK', price: 0, change: 0},
    XRP: { name: 'XRP', symbol: 'XRP', price: 0, change: 0},
    XAUT: { name: 'Tether Gold', symbol: 'XAUT', price: 0, change: 0},
    PEPE: { name: 'Pepe', symbol: 'PEPE', price: 0, change: 0},
    DOGE: { name: 'Dogecoin', symbol: 'DOGE', price: 0, change: 0},
};

const initialAvailablePools: Pool[] = [
    { id: '1', name: 'ETH/USDT', type: 'V2', token1: 'ETH', token2: 'USDT', tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5, feeTier: 0.3 },
    { id: '2', name: 'WETH/USDC', type: 'V2', token1: 'WETH', token2: 'USDC', tvl: 120_000_000, volume24h: 25_000_000, apr: 11.8, feeTier: 0.3 },
    { id: '3', name: 'USDT/USDC', type: 'Stable', token1: 'USDT', token2: 'USDC', tvl: 250_000_000, volume24h: 50_000_000, apr: 2.1 },
    { id: '4', name: 'ETH/LINK', type: 'V3', token1: 'ETH', token2: 'LINK', tvl: 80_000_000, volume24h: 15_000_000, apr: 18.2, feeTier: 1.0, priceRange: { min: 150, max: 250 } },
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
  const isUpdatingStateRef = useRef(false);

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
              'ethereum': 'ETH', 'bitcoin': 'BTC', 'solana': 'SOL',
              'binancecoin': 'BNB', 'tether': 'USDT', 'usd-coin': 'USDC',
              'chainlink': 'LINK', 'ripple': 'XRP', 'tether-gold': 'XAUT',
              'pepe': 'PEPE', 'dogecoin': 'DOGE',
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

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to'> & { id?: string; to?: string; txHash?: string }) => {
    if(!walletAddress) return '';
    const newTxId = transaction.id || transaction.txHash || `local_${Date.now()}_${Math.random()}`;
    const newTx: Transaction = {
        id: newTxId, status: 'Pending', from: walletAddress,
        to: transaction.to || '0x0000000000000000000000000000000000000000', 
        timestamp: Date.now(), txHash: transaction.txHash || '',
        ...transaction
    };
    
    setTransactions(prevTxs => {
      // Avoid adding duplicates
      if (prevTxs.some(tx => tx.id === newTxId)) return prevTxs;
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

  const getWalletClient = () => {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("MetaMask is not installed.");
    }
    return createWalletClient({
        chain: anvilChain,
        transport: custom(window.ethereum),
    });
  };

  const executeTransaction = async (
    txType: TransactionType,
    dialogDetails: Partial<Transaction>,
    txFunction: (walletClient: any, account: `0x${string}`) => Promise<`0x${string}`>
  ) => {
      isUpdatingStateRef.current = true;
      setTxStatusDialog({ isOpen: true, state: 'processing', transaction: dialogDetails });
      
      const tempTxId = `temp_${Date.now()}`;
      addTransaction({id: tempTxId, type: txType, ...dialogDetails});
      
      try {
          const walletClient = getWalletClient();
          const [account] = await walletClient.getAddresses();
          
          const txHash = await txFunction(walletClient, account);
          
          // Update the temporary transaction with the real hash
          setTransactions(prev => prev.map(tx => tx.id === tempTxId ? { ...tx, id: txHash, txHash: txHash } : tx));
          
          setTxStatusDialog(prev => ({ ...prev, state: 'success', transaction: { ...prev.transaction, txHash } }));
          
          publicClient.waitForTransactionReceipt({ hash: txHash }).then(receipt => {
              if (receipt.status === 'success') {
                  updateTransactionStatus(txHash, 'Completed');
              } else {
                  updateTransactionStatus(txHash, 'Failed');
              }
          });

      } catch (e: any) {
          console.error(`${txType} failed:`, e);
          const errorMessage = e instanceof TransactionExecutionError ? e.shortMessage : (e.message || 'An unknown transaction error occurred.');
          
          setTxStatusDialog(prev => ({ ...prev, state: 'error', error: errorMessage }));
          updateTransactionStatus(tempTxId, 'Failed', errorMessage);
          throw e; // Re-throw for the UI component to catch
      } finally {
          setTimeout(() => { isUpdatingStateRef.current = false; }, 5000);
      }
  };

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);

        const remoteAssets = await getWalletAssets(address);
        const newBalances = remoteAssets.reduce((acc, asset) => {
          acc[asset.symbol] = asset.balance;
          return acc;
        }, {} as Balances);
        
        setBalances(newBalances);
        loadTransactions(address);
        setIsConnected(true);

    } catch (e: any) {
        console.error("Failed to connect wallet:", e);
        toast({ variant: "destructive", title: "Connection Failed", description: e.message || "An unknown error occurred." });
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
    isUpdatingStateRef.current = true;
    setBalances(prev => {
        const currentBalance = prev[symbol] || 0;
        const newBalance = currentBalance + amount;
        return { ...prev, [symbol]: newBalance };
    });
    setTimeout(() => { isUpdatingStateRef.current = false }, 3000);
  }, []);
  
  const sendTokens = useCallback(async (toAddress: string, tokenSymbol: string, amount: number) => {
    if (!walletAddress) throw new Error("Wallet not connected");
    
    await executeTransaction(
        'Send',
        { amount, token: tokenSymbol, to: toAddress },
        async (walletClient, account) => {
            if (tokenSymbol === 'ETH') {
                return walletClient.sendTransaction({
                    account,
                    to: toAddress as `0x${string}`,
                    value: parseUnits(amount.toString(), 18)
                });
            } else {
                const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
                if (!contractInfo) throw new Error(`Unsupported token: ${tokenSymbol}`);
                return walletClient.writeContract({
                    address: contractInfo.address,
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [toAddress as `0x${string}`, parseUnits(amount.toString(), contractInfo.decimals)],
                    account
                });
            }
        }
    );
  }, [walletAddress]);

  const approveCollateral = useCallback(async (amount: string) => {
      await executeTransaction(
          'Approve',
          { amount: parseFloat(amount), token: 'USDT', to: 'Perpetuals Contract' },
          (walletClient, account) => walletClient.writeContract({
              address: ERC20_CONTRACTS.USDT.address,
              abi: erc20Abi,
              functionName: 'approve',
              args: [PERPETUALS_CONTRACT_ADDRESS, parseUnits(amount, 18)],
              account
          })
      );
  }, []);

  const openPosition = useCallback(async (params: { side: number; size: string; collateral: string; }) => {
      const { side, size, collateral } = params;
      await executeTransaction(
          'Open Position',
          { amount: parseFloat(collateral), token: 'USDT', to: 'Perpetuals Contract' },
          (walletClient, account) => walletClient.writeContract({
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: perpetualsAbi,
              functionName: 'openPosition',
              args: [side, parseUnits(size, 18), parseUnits(collateral, 18)],
              account
          })
      );
  }, []);

  const closePosition = useCallback(async () => {
      await executeTransaction(
          'Close Position',
          { to: 'Perpetuals Contract' },
          (walletClient, account) => walletClient.writeContract({
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: perpetualsAbi,
              functionName: 'closePosition',
              account
          })
      );
  }, []);

  // Effect for polling for external wallet updates
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    let isCancelled = false;
    
    const poll = async () => {
        if (isCancelled) return;
        
        if (!isUpdatingStateRef.current) {
            try {
                const remoteAssets = await getWalletAssets(walletAddress);
                if (!isCancelled) {
                    const newBalances = remoteAssets.reduce((acc, asset) => {
                        acc[asset.symbol] = asset.balance;
                        return acc;
                    }, {} as Balances);
                    setBalances(newBalances);
                }
            } catch (error) {
                console.warn("Poll for wallet updates failed. Retrying.", error);
            }
        }
        
        if (!isCancelled) setTimeout(poll, 5000);
    };

    poll();

    return () => { isCancelled = true; };
  }, [isConnected, walletAddress]);


  const value: WalletContextType = {
      walletState: { 
        isConnected, isConnecting, walletAddress, balances, walletBalance, marketData, isMarketDataLoaded,
        transactions, vaultWeth, activeStrategy, proposals, availablePools, userPositions, txStatusDialog,
      },
      walletActions: {
          connectWallet, disconnectWallet, updateBalance, setBalances, sendTokens, addTransaction,
          updateTransactionStatus, setVaultWeth, setActiveStrategy, setProposals, setAvailablePools,
          setUserPositions, setTxStatusDialog, approveCollateral, openPosition, closePosition
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
