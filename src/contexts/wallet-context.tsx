
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { getWalletAssets } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';
import { createPublicClient, createWalletClient, http, custom, parseUnits, formatUnits, parseAbi, defineChain } from 'viem';
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
  setBalances: React.Dispatch<React.SetStateAction<Balances>>;
  sendTokens: (toAddress: string, tokenSymbol: string, amount: number) => Promise<void>;
  approveCollateral: (amount: string) => Promise<void>;
  openPosition: (params: { side: number; size: string; collateral: string; }) => Promise<void>;
  closePosition: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to'> & { to?: string; txHash?: string }) => string;
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

// --- CONSTANTS AND ABIS ---

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545';
const PERPETUALS_CONTRACT_ADDRESS = '0xf62eec897fa5ef36a957702aa4a45b58fe8fe312';
const USDT_CONTRACT_ADDRESS = '0xf48883f2ae4c4bf4654f45997fe47d73daa4da07';

const erc20Abi = parseAbi([
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)"
]);

const perpetualsAbi = parseAbi([
  "function openPosition(uint8 side, uint256 size, uint256 collateral)",
  "function closePosition()"
]);

const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}`, decimals: number } } = {
    'USDT': { address: USDT_CONTRACT_ADDRESS as `0x${string}`, decimals: 18 },
    'USDC': { address: '0x093d305366218d6d09ba10448922f10814b031dd', decimals: 18 },
    'WETH': { address: '0x492844c46cef2d751433739fc3409b7a4a5ba9a7', decimals: 18 },
    'LINK': { address: '0xf0f5e9b00b92f3999021fd8b88ac75c351d93fc7', decimals: 18 },
    'BNB': { address: '0xdc0a0b1cd093d321bd1044b5e0acb71b525abb6b', decimals: 18 },
    'SOL': { address: '0x810090f35dfa6b18b5eb59d298e2a2443a2811e2', decimals: 18 },
};

const anvilChain = defineChain({
  ...localhost,
  id: 31337,
})


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

  const [publicClient, setPublicClient] = useState(() => createPublicClient({ chain: anvilChain, transport: http(LOCAL_CHAIN_RPC_URL) }));
  const [walletClient, setWalletClient] = useState<any | null>(null);
  
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

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to'> & { to?: string; txHash?: string }) => {
    if(!walletAddress) return '';
    const newTxId = transaction.txHash || `local_${Date.now()}_${Math.random()}`;
    const newTx: Transaction = {
        id: newTxId, status: 'Pending', from: walletAddress,
        to: transaction.to || '0x0000000000000000000000000000000000000000', 
        timestamp: Date.now(), txHash: transaction.txHash || '',
        ...transaction
    };
    
    const nonOnChainTypes: TransactionType[] = ['AI Rebalance', 'Add Liquidity', 'Remove Liquidity', 'Vote'];
    if (nonOnChainTypes.includes(newTx.type) && !newTx.txHash) {
        newTx.status = 'Completed';
    }

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
    try {
        if (typeof window.ethereum === 'undefined') {
          throw new Error('MetaMask or a compatible wallet is not installed.');
        }

        const client = createWalletClient({
            chain: anvilChain,
            transport: custom(window.ethereum)
        });

        const [address] = await client.requestAddresses();
        setWalletClient(client);
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
    setWalletClient(null);
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

  const executeTransaction = async (
    txType: TransactionType,
    txDetails: string,
    txAction: () => Promise<`0x${string}`>,
    dialogDetails: Partial<Transaction>
  ) => {
    if (!walletClient || !walletAddress) throw new Error("Wallet not connected");
    isUpdatingStateRef.current = true;
    setTxStatusDialog({ isOpen: true, state: 'processing', transaction: dialogDetails });

    try {
        const txHash = await txAction();
        addTransaction({ type: txType, to: dialogDetails.to, details: txDetails, token: dialogDetails.token, amount: dialogDetails.amount, txHash });
        setTxStatusDialog(prev => ({ ...prev, state: 'success', transaction: { ...prev.transaction, txHash } }));
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (txType === 'Send') {
            updateBalance(dialogDetails.token!, -dialogDetails.amount!);
        }
        const freshAssets = await getWalletAssets(walletAddress);
        setBalances(freshAssets.reduce((acc, asset) => { acc[asset.symbol] = asset.balance; return acc; }, {} as Balances));

    } catch (e: any) {
        console.error(`${txType} failed:`, e);
        const errorMessage = e.shortMessage || e.message || 'An unknown error occurred.';
        setTxStatusDialog(prev => ({ ...prev, state: 'error', error: errorMessage }));
        throw e;
    } finally {
        setTimeout(() => { isUpdatingStateRef.current = false; }, 5000);
    }
  };

  const sendTokens = useCallback(async (toAddress: string, tokenSymbol: string, amount: number) => {
    const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
    const amountInSmallestUnit = parseUnits(amount.toString(), contractInfo ? contractInfo.decimals : 18);

    await executeTransaction(
        'Send',
        `Sending ${amount} ${tokenSymbol} to ${toAddress.slice(0,10)}...`,
        () => {
            if (tokenSymbol === 'ETH') {
                return walletClient.sendTransaction({ account: walletAddress as `0x${string}`, to: toAddress as `0x${string}`, value: amountInSmallestUnit });
            } else {
                if (!contractInfo || !contractInfo.address) throw new Error(`Contract for ${tokenSymbol} not found.`);
                return walletClient.writeContract({
                    account: walletAddress as `0x${string}`, address: contractInfo.address,
                    abi: erc20Abi, functionName: 'transfer', args: [toAddress as `0x${string}`, amountInSmallestUnit]
                });
            }
        },
        { amount, token: tokenSymbol, to: toAddress }
    );
  }, [walletClient, walletAddress, executeTransaction]);

  const approveCollateral = useCallback(async (amount: string) => {
    const amountInWei = parseUnits(amount, 18);
    await executeTransaction(
        'Approve',
        `Approving ${amount} USDT for trading`,
        () => walletClient.writeContract({
            account: walletAddress as `0x${string}`, address: USDT_CONTRACT_ADDRESS,
            abi: erc20Abi, functionName: 'approve', args: [PERPETUALS_CONTRACT_ADDRESS, amountInWei]
        }),
        { amount: parseFloat(amount), token: 'USDT', to: PERPETUALS_CONTRACT_ADDRESS }
    );
  }, [walletClient, walletAddress, executeTransaction]);

  const openPosition = useCallback(async (params: { side: number; size: string; collateral: string; }) => {
    const sizeInWei = parseUnits(params.size, 18);
    const collateralInWei = parseUnits(params.collateral, 18);
    await executeTransaction(
        'Open Position',
        `Opening ${params.side === 0 ? 'long' : 'short'} position of ${params.size} ETH`,
        () => walletClient.writeContract({
            account: walletAddress as `0x${string}`, address: PERPETUALS_CONTRACT_ADDRESS,
            abi: perpetualsAbi, functionName: 'openPosition', args: [params.side, sizeInWei, collateralInWei]
        }),
        { amount: parseFloat(params.collateral), token: 'USDT', to: PERPETUALS_CONTRACT_ADDRESS }
    );
  }, [walletClient, walletAddress, executeTransaction]);

  const closePosition = useCallback(async () => {
    await executeTransaction(
        'Close Position',
        'Closing active position',
        () => walletClient.writeContract({
            account: walletAddress as `0x${string}`, address: PERPETUALS_CONTRACT_ADDRESS,
            abi: perpetualsAbi, functionName: 'closePosition', args: []
        }),
        { to: PERPETUALS_CONTRACT_ADDRESS }
    );
  }, [walletClient, walletAddress, executeTransaction]);

  // Effect for polling for external wallet updates and transaction statuses
  useEffect(() => {
    if (!isConnected || !walletAddress || !publicClient) return;

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
        
        const pendingTxs = transactions.filter(tx => tx.status === 'Pending' && tx.txHash && tx.txHash.startsWith('0x'));

        for (const tx of pendingTxs) {
            try {
                const receipt = await publicClient.getTransactionReceipt({ hash: tx.txHash as `0x${string}` });
                if (receipt && !isCancelled) {
                    const status = receipt.status === 'success' ? 'Completed' : 'Failed';
                    updateTransactionStatus(tx.id, status, status === 'Failed' ? 'Transaction reverted' : undefined);
                }
            } catch (e) {
                // Ignore errors for not-yet-indexed txs
            }
        }

        if (!isCancelled) setTimeout(poll, 5000);
    };

    poll();

    return () => { isCancelled = true; };
  }, [isConnected, walletAddress, transactions, updateTransactionStatus, publicClient]);


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

    