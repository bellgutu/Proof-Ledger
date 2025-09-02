
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { 
    ERC20_CONTRACTS, 
    DEX_CONTRACT_ADDRESS, 
    VAULT_CONTRACT_ADDRESS, 
    PERPETUALS_CONTRACT_ADDRESS, 
    GOVERNOR_ABI, DEX_ABI, VAULT_ABI, 
    PERPETUALS_ABI, 
    FACTORY_CONTRACT_ADDRESS, 
    FACTORY_ABI, POOL_ABI, 
    checkAllContracts,
    getVaultCollateral,
    getWalletAssets
} from '@/services/blockchain-service';
import type { VaultCollateral, Position } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';
import { createWalletClient, custom, createPublicClient, http, defineChain, TransactionExecutionError, getContract, parseAbi, formatUnits, type Address, WalletClient } from 'viem';
import { localhost } from 'viem/chains';
import { parseTokenAmount, USDT_DECIMALS } from '@/lib/format';
import { isValidAddress } from '@/lib/utils';


// --- TYPE DEFINITIONS ---

type AssetSymbol = 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'WETH' | 'LINK' | 'USDC' | 'BTC' | 'XAUT' | 'PEPE' | 'DOGE';

export type TransactionType = 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote' | 'Send' | 'Receive' | 'Approve' | 'Open Position' | 'Close Position' | 'Claim Rewards' | 'Deposit Collateral' | 'Withdraw Collateral' | 'Create Pool';
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
  decimals: number;
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

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string;
  walletClient: WalletClient | null;
  balances: { [symbol:string]: number };
  decimals: { [symbol:string]: number };
  allowances: { [symbol: string]: number };
  walletBalance: string;
  marketData: MarketData;
  isMarketDataLoaded: boolean;
  transactions: Transaction[];
  vaultWeth: number;
  vaultCollateral: VaultCollateral;
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
  setBalances: React.Dispatch<React.SetStateAction<{ [symbol:string]: number }>>;
  sendTokens: (toAddress: string, tokenSymbol: string, amount: number) => Promise<void>;
  depositCollateral: (amount: string) => Promise<void>;
  withdrawCollateral: (amount: string) => Promise<void>;
  openPosition: (params: { side: number; size: string; collateral: string; entryPrice: number; }) => Promise<void>;
  closePosition: (position: Position, pnl: number) => Promise<void>;
  updateVaultCollateral: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to'> & { id?: string; to?: string; txHash?: string }) => string;
  updateTransactionStatus: (id: string, status: TransactionStatus, details?: string | React.ReactNode, txHash?: string) => void;
  setVaultWeth: React.Dispatch<React.SetStateAction<number>>;
  setVaultCollateral: React.Dispatch<React.SetStateAction<VaultCollateral>>;
  setActiveStrategy: React.Dispatch<React.SetStateAction<VaultStrategy | null>>;
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  setAvailablePools: React.Dispatch<React.SetStateAction<Pool[]>>;
  setUserPositions: React.Dispatch<React.SetStateAction<UserPosition[]>>;
  setTxStatusDialog: React.Dispatch<React.SetStateAction<TxStatusDialogInfo>>;
  approveToken: (tokenSymbol: string, amount: number, spender?: `0x${string}`) => Promise<void>;
  checkAllowance: (tokenSymbol: string, spender?: `0x${string}`) => Promise<void>;
  checkPoolExists: (tokenA: string, tokenB: string, stable?: boolean) => Promise<boolean>;
  swapTokens: (fromToken: string, toToken: string, amountIn: number) => Promise<void>;
  createPool: (tokenA: string, tokenB: string, stable?: boolean) => Promise<void>;
  depositToVault: (amount: number) => Promise<void>;
  withdrawFromVault: (amount: number) => Promise<void>;
  voteOnProposal: (proposalId: string, support: number) => Promise<void>;
  addLiquidity: (tokenA: string, tokenB: string, amountA: number, amountB: number, stable: boolean) => Promise<void>;
  removeLiquidity: (position: UserPosition, percentage: number) => Promise<void>;
  claimRewards: (position: UserPosition) => Promise<void>;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const anvilChain = defineChain({
  ...localhost,
  id: 31337,
})

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
  multicall: {
    batch: false,
  },
});


const erc20Abi = parseAbi([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)"
]);

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
    { id: '0x56639dB16Ac50A89228026e42a316B30179A5376', name: 'USDC/USDT', type: 'Stable', token1: 'USDC', token2: 'USDT', tvl: 250_000_000, volume24h: 50_000_000, apr: 2.1 },
    { id: '0x0665FbB86a3acECa91Df68388EC4BBE11556DDce', name: 'WETH/USDT', type: 'V2', token1: 'WETH', token2: 'USDT', tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5, feeTier: 0.3 },
];

const initialProposals: Proposal[] = [
    { id: '1', title: 'Increase LP Rewards for WETH/USDC', description: 'Boost the rewards for the WETH/USDC pool by 5% to attract more liquidity.', votesFor: 1250000, votesAgainst: 340000 },
    { id: '2', title: 'Onboard a new collateral asset: LINK', description: 'Allow Chainlink (LINK) to be used as collateral within the protocol.', votesFor: 850000, votesAgainst: 600000 },
];


export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [balances, setBalances] = useState<{ [symbol:string]: number }>({});
  const [decimals, setDecimals] = useState<{ [symbol:string]: number }>({});
  const [allowances, setAllowances] = useState<{ [symbol: string]: number }>({});
  
  const [marketData, setMarketData] = useState<MarketData>(initialMarketData);
  const [isMarketDataLoaded, setIsMarketDataLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0.00');

  // DeFi State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vaultWeth, setVaultWeth] = useState(0);
  const [vaultCollateral, setVaultCollateral] = useState<VaultCollateral>({ total: 0, locked: 0, available: 0 });
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

  const updateVaultCollateral = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    
    try {
      const collateral = await getVaultCollateral(walletAddress as `0x${string}`);
      setVaultCollateral(collateral);
    } catch (error) {
      console.error("Failed to update vault collateral:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vault collateral",
      });
    }
  }, [isConnected, walletAddress, toast]);


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

  const refreshAllBalances = useCallback(async (address: `0x${string}`) => {
    const remoteAssets = await getWalletAssets(address);
    const newBalances = remoteAssets.reduce((acc, asset) => {
        acc[asset.symbol] = asset.balance;
        return acc;
    }, {} as { [symbol: string]: number });
    const newDecimals = remoteAssets.reduce((acc, asset) => {
        acc[asset.symbol] = asset.decimals;
        return acc;
    }, {} as { [symbol: string]: number });

    const collateral = await getVaultCollateral(address);

    setBalances(newBalances);
    setDecimals(newDecimals);
    setVaultCollateral(collateral);
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
        toast({ variant: "destructive", title: "Wallet not found", description: "Please install a browser wallet like MetaMask." });
        return;
    }
    setIsConnecting(true);
    try {
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const client = createWalletClient({
            account: address,
            chain: anvilChain,
            transport: custom(window.ethereum),
        });

        setWalletClient(client);
        setWalletAddress(address);
        await refreshAllBalances(address);
        loadTransactions(address);
        setIsConnected(true);

    } catch (e: any) {
        console.error("Failed to connect wallet:", e);
        toast({ variant: "destructive", title: "Connection Failed", description: e.message || "User rejected the request." });
        setIsConnected(false);
    } finally {
        setIsConnecting(false);
    }
  }, [loadTransactions, toast, refreshAllBalances]);

  const disconnectWallet = useCallback(async () => {
    setIsConnected(false);
    setWalletAddress('');
    setWalletClient(null);
    setBalances({});
    setDecimals({});
    setAllowances({});
    setTransactions([]);
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to'> & { id?: string; to?: string; txHash?: string }) => {
    const newTx: Transaction = {
        id: transaction.id || `temp_${Date.now()}`,
        txHash: transaction.txHash || 'N/A',
        type: transaction.type,
        status: 'Pending',
        timestamp: Date.now(),
        from: walletAddress,
        to: transaction.to || 'Unknown Contract',
        details: transaction.details,
        token: transaction.token,
        amount: transaction.amount,
    };
    setTransactions(prev => {
        const newTxs = [newTx, ...prev];
        persistTransactions(newTxs, walletAddress);
        return newTxs;
    });
    return newTx.id;
  }, [walletAddress, persistTransactions]);


  const updateTransactionStatus = useCallback((id: string, status: TransactionStatus, details?: string | React.ReactNode, txHash?: string) => {
      setTransactions(prev => {
          const newTxs = prev.map(tx => {
              if (tx.id === id) {
                  return { 
                      ...tx, 
                      status, 
                      ...(details && { details }),
                      ...(txHash && { txHash, id: txHash })
                  };
              }
              return tx;
          });
          persistTransactions(newTxs, walletAddress);
          return newTxs;
      });
  }, [walletAddress, persistTransactions]);


  const executeTransaction = async (
    txType: TransactionType,
    dialogDetails: Partial<Transaction>,
    txFunction: () => Promise<`0x${string}`>,
    onSuccess?: (txHash: `0x${string}`) => void | Promise<void>
  ) => {
      if (!walletClient) {
          toast({ variant: "destructive", title: "Wallet Not Connected" });
          return;
      }
      isUpdatingStateRef.current = true;
      setTxStatusDialog({ isOpen: true, state: 'processing', transaction: dialogDetails });
      
      const tempTxId = addTransaction({ type: txType, ...dialogDetails });
      
      try {
          const txHash = await txFunction();
          
          setTransactions(prev => prev.map(tx => tx.id === tempTxId ? { ...tx, id: txHash, txHash: txHash } : tx));
          
          setTxStatusDialog(prev => ({ ...prev, state: 'success', transaction: { ...prev.transaction, txHash } }));
          
          publicClient.waitForTransactionReceipt({ hash: txHash }).then(async (receipt) => {
              if (receipt.status === 'success') {
                  console.log(`✅ ${txType} transaction ${txHash} completed successfully`);
                  updateTransactionStatus(txHash, 'Completed');
                  if(onSuccess) await onSuccess(txHash);
              } else {
                  console.error(`❌ ${txType} transaction ${txHash} failed`);
                  let revertReason = 'Transaction was reverted by the contract.';
                  try {
                      if (receipt.status === 'reverted') {
                          if (txType === 'Add Liquidity') revertReason = 'Liquidity addition failed. This could be due to an uninitialized pool or insufficient token amounts.';
                          else if (txType === 'Swap') revertReason = 'Swap failed. This could be due to insufficient liquidity or slippage limits.';
                          else if (txType === 'Approve') revertReason = 'Token approval failed. Please try again.';
                      }
                  } catch (e) { console.error('Failed to decode revert reason:', e); }
                  updateTransactionStatus(txHash, 'Failed', revertReason);
              }
          }).finally(async () => {
             if(walletAddress) {
                console.log("Refreshing balances after transaction...");
                await refreshAllBalances(walletAddress as `0x${string}`);
             }
          });
          
      } catch (e: any) {
          console.error(`❌ ${txType} failed:`, e);
          let errorMessage = e instanceof TransactionExecutionError ? e.shortMessage : (e.message || 'An unknown transaction error occurred.');
          
            if (errorMessage.includes('ERC20: mint to the zero address')) errorMessage = 'The pool contract is trying to mint LP tokens to an invalid address. This usually means the pool is not properly initialized.';
            else if (errorMessage.includes('ERC20: insufficient allowance')) errorMessage = 'Insufficient token allowance. Please approve the tokens first.';
            else if (errorMessage.includes('PoolNotFound')) errorMessage = 'Liquidity pool does not exist. Please create it first.';
            else if (errorMessage.includes('InvalidPath')) errorMessage = 'Invalid token path. Only direct swaps are supported.';
            else if (errorMessage.includes('Expired')) errorMessage = 'Transaction expired. Please try again.';
            else if (errorMessage.includes('Pool is not properly initialized')) errorMessage = 'The selected pool is not properly initialized. Please try a different pool or create a new one.';
            else if (errorMessage.includes('function selector was not recognized')) errorMessage = 'The contract function was not found. The ABI might be incorrect or the contract address is wrong.';
          
          setTxStatusDialog(prev => ({ ...prev, state: 'error', error: errorMessage }));
          updateTransactionStatus(tempTxId, 'Failed', errorMessage);
          throw e;
      } finally {
          setTimeout(() => { isUpdatingStateRef.current = false; }, 5000);
      }
  };
  
  const updateBalance = useCallback((symbol: string, amount: number) => {
    isUpdatingStateRef.current = true;
    setBalances(prev => {
        const currentBalance = prev[symbol] || 0;
        const newBalance = currentBalance + amount;
        return { ...prev, [symbol]: newBalance };
    });
    setTimeout(() => { isUpdatingStateRef.current = false }, 3000);
  }, []);

  
  const checkAllowance = useCallback(async (tokenSymbol: string, spender: `0x${string}` = DEX_CONTRACT_ADDRESS) => {
    if (!walletAddress || !isValidAddress(walletAddress) || tokenSymbol === 'ETH') {
        setAllowances(prev => ({ ...prev, [tokenSymbol]: Infinity }));
        return;
    };
    
    const tokenInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
    if (!tokenInfo?.address) return;

    const tokenDecimals = decimals[tokenSymbol];
    if (tokenDecimals === undefined) return;

    try {
        const allowance = await publicClient.readContract({
            address: tokenInfo.address!,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [walletAddress as `0x${string}`, spender]
        });
        const allowanceFormatted = parseFloat(formatUnits(allowance, tokenDecimals));
        console.log(`Allowance for ${tokenSymbol} to ${spender}: ${allowanceFormatted}`);
        setAllowances(prev => ({ ...prev, [tokenSymbol]: allowanceFormatted }));
    } catch(e) {
        console.error(`Failed to check allowance for ${tokenSymbol}`, e);
    }
  }, [walletAddress, decimals]);

    const approveToken = useCallback(async (tokenSymbol: string, amount: number, spender: `0x${string}` = DEX_CONTRACT_ADDRESS) => {
        const tokenInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
        if (!tokenInfo || !tokenInfo.address) {
            throw new Error(`Token ${tokenSymbol} is not configured.`);
        }
        const tokenDecimals = decimals[tokenSymbol];
        if (tokenDecimals === undefined) {
            throw new Error(`Decimals for ${tokenSymbol} not found.`);
        }
        
        const dialogDetails = { amount, token: tokenSymbol, to: spender };
        
        const txFunction = async () => {
            if(!walletClient) throw new Error("Wallet not connected");
            const { request } = await publicClient.simulateContract({
                account: walletClient.account,
                address: tokenInfo.address!,
                abi: erc20Abi,
                functionName: "approve",
                args: [spender, parseTokenAmount(amount.toString(), tokenDecimals)],
            });
            return await walletClient.writeContract(request);
        };
        
        await executeTransaction('Approve', dialogDetails, txFunction, async (txHash) => {
            console.log(`Approval transaction ${txHash} sent. Waiting for confirmation to update allowance.`);
            await publicClient.waitForTransactionReceipt({ hash: txHash });
            console.log(`Approval transaction ${txHash} confirmed. Re-checking allowance.`);
            await checkAllowance(tokenSymbol, spender);
        });
        
    }, [executeTransaction, decimals, checkAllowance, walletClient]);
  
  const sendTokens = useCallback(async (toAddress: string, tokenSymbol: string, amount: number) => {
    if (!walletAddress || !walletClient) throw new Error("Wallet not connected");
    
    const dialogDetails = { amount, token: tokenSymbol, to: toAddress };
    
    const txFunction = async () => {
      if (tokenSymbol === 'ETH') {
          const ethDecimals = decimals['ETH'] ?? 18;
          const onChainAmount = parseTokenAmount(amount.toString(), ethDecimals);
          const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            to: toAddress as `0x${string}`,
            value: onChainAmount
          });
          return walletClient.writeContract(request);
      } else {
          const tokenInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
          if (!tokenInfo) throw new Error(`Unsupported token: ${tokenSymbol}`);
          const tokenDecimals = decimals[tokenSymbol];
          if (tokenDecimals === undefined) throw new Error(`Decimals for ${tokenSymbol} not found.`);
          const onChainAmount = parseTokenAmount(amount.toString(), tokenDecimals);
          const { request } = await publicClient.simulateContract({
               account: walletClient.account,
               address: tokenInfo.address as `0x${string}`,
               abi: erc20Abi,
               functionName: 'transfer',
               args: [toAddress as `0x${string}`, onChainAmount],
          });
          return walletClient.writeContract(request);
      }
    };

    await executeTransaction('Send', dialogDetails, txFunction, async () => {
        await refreshAllBalances(walletAddress as `0x${string}`);
    });
  }, [walletAddress, walletClient, decimals, executeTransaction, refreshAllBalances]);

  const checkPoolExists = useCallback(async (tokenA: string, tokenB: string, stable: boolean = false) => {
    const tokenAInfo = ERC20_CONTRACTS[tokenA as keyof typeof ERC20_CONTRACTS];
    const tokenBInfo = ERC20_CONTRACTS[tokenB as keyof typeof ERC20_CONTRACTS];
    
    if (!tokenAInfo?.address || !tokenBInfo?.address) {
        console.error("Token info not found for", tokenA, tokenB);
        return false;
    }
    
    if (!isValidAddress(FACTORY_CONTRACT_ADDRESS)) {
        console.error("Invalid factory contract address:", FACTORY_CONTRACT_ADDRESS);
        throw new Error("Factory contract address is not properly configured.");
    }
    
    const token0 = tokenAInfo.address.toLowerCase() < tokenBInfo.address.toLowerCase() ? tokenAInfo.address : tokenBInfo.address;
    const token1 = tokenAInfo.address.toLowerCase() < tokenBInfo.address.toLowerCase() ? tokenBInfo.address : tokenAInfo.address;
    
    try {
        const code = await publicClient.getCode({ address: FACTORY_CONTRACT_ADDRESS });
        if (code === '0x') { throw new Error('Factory contract not deployed'); }
        
        const factoryContract = getContract({ address: FACTORY_CONTRACT_ADDRESS, abi: FACTORY_ABI, client: publicClient });
        const poolAddress = await factoryContract.read.getPool([token0, token1, stable]);
        return poolAddress !== '0x0000000000000000000000000000000000000000';
    } catch (error) {
        console.error("Error checking pool existence (direct call failed):", error);
        return false;
    }
  }, []);

  const swapTokens = useCallback(async (fromToken: string, toToken: string, amountIn: number) => {
    if (!walletAddress || !walletClient) throw new Error("Wallet not connected");

    const fromTokenInfo = ERC20_CONTRACTS[fromToken as keyof typeof ERC20_CONTRACTS];
    if (!fromTokenInfo?.address) throw new Error(`Token ${fromToken} is not configured.`);
    const fromTokenDecimals = decimals[fromToken];
    if (fromTokenDecimals === undefined) throw new Error(`Decimals for ${fromToken} not found.`);
    
    const toTokenInfo = ERC20_CONTRACTS[toToken as keyof typeof ERC20_CONTRACTS];
    if (!toTokenInfo?.address) throw new Error("Invalid token path for swap.");

    const dialogDetails = { amount: amountIn, token: fromToken, details: `Swap ${amountIn} ${fromToken} for ${toToken}` };
    
    const txFunction = async () => {
        const onChainAmount = parseTokenAmount(amountIn.toString(), fromTokenDecimals);
        const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [onChainAmount, 0n, [fromTokenInfo.address!, toTokenInfo.address!], walletAddress as Address, BigInt(Math.floor(Date.now() / 1000) + 60 * 20)]
        });
        return await walletClient.writeContract(request);
    };

    await executeTransaction('Swap', dialogDetails, txFunction, async (txHash) => {
        await checkAllowance(fromToken, DEX_CONTRACT_ADDRESS);
    });
  }, [walletAddress, walletClient, executeTransaction, decimals, checkAllowance]);

  const createPool = useCallback(async (tokenA: string, tokenB: string, stable: boolean = false) => {
    if (!walletAddress || !walletClient) throw new Error("Wallet not connected");

    const tokenAInfo = ERC20_CONTRACTS[tokenA as keyof typeof ERC20_CONTRACTS];
    const tokenBInfo = ERC20_CONTRACTS[tokenB as keyof typeof ERC20_CONTRACTS];
    if (!tokenAInfo?.address || !tokenBInfo?.address) throw new Error("Invalid tokens for pool creation.");
    
    const token0 = tokenAInfo.address.toLowerCase() < tokenBInfo.address.toLowerCase() ? tokenAInfo.address : tokenBInfo.address;
    const token1 = tokenAInfo.address.toLowerCase() < tokenBInfo.address.toLowerCase() ? tokenBInfo.address : tokenAInfo.address;

    const dialogDetails = { details: `Create pool for ${tokenA}/${tokenB}` };
    await executeTransaction('Create Pool', dialogDetails, async () => {
        const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            address: FACTORY_CONTRACT_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'createPool',
            args: [token0, token1, stable]
        });
        return walletClient.writeContract(request);
    });
  }, [walletAddress, walletClient, executeTransaction]);
  
    const addLiquidity = useCallback(async (tokenA: string, tokenB: string, amountA: number, amountB: number, stable: boolean) => {
        if (!walletAddress || !walletClient) throw new Error("Wallet not connected");

        const tokenAInfo = ERC20_CONTRACTS[tokenA as keyof typeof ERC20_CONTRACTS];
        const tokenBInfo = ERC20_CONTRACTS[tokenB as keyof typeof ERC20_CONTRACTS];
        
        if (!tokenAInfo?.address || !tokenBInfo?.address) { throw new Error("Invalid tokens for liquidity."); }
        if (!isValidAddress(DEX_CONTRACT_ADDRESS)) { throw new Error("DEX Router contract address is not properly configured.");}
        
        const dialogDetails = { details: `Add ${amountA.toFixed(4)} ${tokenA} & ${amountB.toFixed(4)} ${tokenB} to pool` };
        
        const txFunction = async () => {
            const decimalsA = decimals[tokenA];
            const decimalsB = decimals[tokenB];
            if (decimalsA === undefined || decimalsB === undefined) throw new Error("Token decimals not found");
            const amountADesired = parseTokenAmount(amountA.toString(), decimalsA);
            const amountBDesired = parseTokenAmount(amountB.toString(), decimalsB);

            await approveToken(tokenA, amountA, DEX_CONTRACT_ADDRESS);
            await approveToken(tokenB, amountB, DEX_CONTRACT_ADDRESS);

            const { request } = await publicClient.simulateContract({
              account: walletClient.account,
              address: DEX_CONTRACT_ADDRESS,
              abi: DEX_ABI,
              functionName: 'addLiquidity',
              args: [ tokenAInfo.address!, tokenBInfo.address!, amountADesired, amountBDesired, 0n, 0n, walletClient.account.address, BigInt(Math.floor(Date.now() / 1000) + 60 * 20)]
            });
            return await walletClient.writeContract(request);
        };
        
        await executeTransaction('Add Liquidity', dialogDetails, txFunction);
    }, [walletAddress, walletClient, executeTransaction, decimals, approveToken]);

  const removeLiquidity = useCallback(async (position: UserPosition, percentage: number) => {
      if (!walletAddress || !walletClient) throw new Error("Wallet not connected");
      const dialogDetails = { details: `Remove ${percentage}% of liquidity from ${position.name} pool`};
      
      const txFunction = async () => {
        const tokenAInfo = ERC20_CONTRACTS[position.token1 as keyof typeof ERC20_CONTRACTS];
        const tokenBInfo = ERC20_CONTRACTS[position.token2 as keyof typeof ERC20_CONTRACTS];
        if (!tokenAInfo?.address || !tokenBInfo?.address) throw new Error("Invalid tokens for liquidity");
        
        const lpDecimals = 18;
        const liquidityToRemove = parseTokenAmount((position.lpTokens * (percentage / 100)).toString(), lpDecimals);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

        const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: "removeLiquidity",
            args: [ tokenAInfo.address, tokenBInfo.address, position.type === 'Stable', liquidityToRemove, 0n, 0n, walletClient.account.address, deadline ]
        });
        return walletClient.writeContract(request);
      };
      await executeTransaction('Remove Liquidity', dialogDetails, txFunction);
  }, [walletAddress, walletClient, executeTransaction]);

  const claimRewards = useCallback(async (position: UserPosition) => {
      if (!walletAddress) return;
      updateBalance('USDT', position.unclaimedRewards);
      setUserPositions(prev => prev.map(p => {
        if (p.id === position.id) { return { ...p, unclaimedRewards: 0 }; }
        return p;
      }));
      addTransaction({
        type: 'Claim Rewards',
        details: `Claimed $${position.unclaimedRewards.toFixed(2)} rewards from ${position.name} pool.`
      });
      toast({ title: 'Rewards Claimed!', description: `$${position.unclaimedRewards.toFixed(2)} has been added to your wallet.`});
  }, [addTransaction, updateBalance, toast, walletAddress]);
  
  const depositCollateral = useCallback(async (amount: string) => {
    const usdtDecimals = decimals['USDT'];
    if(usdtDecimals === undefined) throw new Error("USDT decimals not found");

    const dialogDetails = { amount: parseFloat(amount), token: 'USDT', to: 'Perpetuals Contract' };
    const txFunction = async () => {
        if (!walletClient) throw new Error("Wallet not connected");
        const amountOnChain = parseTokenAmount(amount, usdtDecimals);
        const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "deposit",
            args: [amountOnChain, walletClient.account.address],
        });
        return await walletClient.writeContract(request);
    };
    await executeTransaction('Deposit Collateral', dialogDetails, txFunction, async () => {
        await updateVaultCollateral();
    });
  }, [executeTransaction, decimals, walletClient, updateVaultCollateral]);
  
  const withdrawCollateral = useCallback(async (amount: string) => {
      const usdtDecimals = decimals['USDT'];
      if (usdtDecimals === undefined) throw new Error("USDT decimals not found");

      const dialogDetails = { amount: parseFloat(amount), token: 'USDT', to: 'Perpetuals Contract' };
      const txFunction = async () => {
          if(!walletClient) throw new Error("Wallet not connected");
          const amountOnChain = parseTokenAmount(amount, usdtDecimals);
          
          const { request } = await publicClient.simulateContract({
              account: walletClient.account,
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: PERPETUALS_ABI,
              functionName: 'withdrawCollateral',
              args: [amountOnChain]
          });
          return walletClient.writeContract(request);
      };
      await executeTransaction('Withdraw Collateral', dialogDetails, txFunction, async () => {
          await updateVaultCollateral();
      });
  }, [executeTransaction, decimals, walletClient, updateVaultCollateral]);


  const openPosition = useCallback(async (params: { side: number; size: string; collateral: string; entryPrice: number }) => {
      if (!walletAddress || !walletClient) throw new Error("Wallet not connected");
      const { side, size, collateral, entryPrice } = params;
      
      const sizeDecimals = decimals['ETH'];
      if (sizeDecimals === undefined) throw new Error("ETH decimals not found");
      
      const sizeOnChain = parseTokenAmount(size, sizeDecimals);
      const collateralOnChain = parseTokenAmount(collateral, USDT_DECIMALS);

      if (entryPrice > 0 && walletAddress) { localStorage.setItem(`entryPrice_${walletAddress}`, entryPrice.toString()); }

      const dialogDetails = { amount: parseFloat(collateral), token: 'USDT', to: 'Perpetuals Contract', details: `Open ${side === 0 ? 'LONG' : 'SHORT'} position of ${size} ETH` };
      const txFunction = async () => {
          if (!walletClient) throw new Error("Wallet not connected");
          const { request } = await publicClient.simulateContract({
              account: walletClient.account,
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: PERPETUALS_ABI,
              functionName: 'openPosition',
              args: [side as 0 | 1, sizeOnChain, collateralOnChain],
          });
          return walletClient.writeContract(request);
      }
      await executeTransaction('Open Position', dialogDetails, txFunction);
  }, [executeTransaction, decimals, walletAddress, walletClient]);

  const closePosition = useCallback(async (position: Position, pnl: number) => {
      if (walletAddress) { localStorage.removeItem(`entryPrice_${walletAddress}`); }
      const detailsNode = ( <div className="text-xs text-left"> <div>Closed {position.side.toUpperCase()} position of {position.size} ETH</div> <div>Entry: ${position.entryPrice.toFixed(2)}</div> <div className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}> Final PnL: ${pnl.toFixed(2)} </div> </div> );
      const dialogDetails = { to: 'Perpetuals Contract', details: detailsNode };
      
      const txFunction = async () => {
          if(!walletClient) throw new Error("Wallet not connected");
          const { request } = await publicClient.simulateContract({
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: PERPETUALS_ABI,
              functionName: 'closePosition',
              account: walletClient.account
          });
          return walletClient.writeContract(request);
      }
      await executeTransaction('Close Position', dialogDetails, txFunction, async () => {
          await updateVaultCollateral();
      });
  }, [executeTransaction, walletAddress, walletClient, updateVaultCollateral]);

  const depositToVault = useCallback(async (amount: number) => {
    await approveToken('WETH', amount, VAULT_CONTRACT_ADDRESS);
    const dialogDetails = { amount, token: 'WETH', to: 'AI Strategy Vault' };
    const txFunction = async () => {
        if(!walletClient) throw new Error("Wallet not connected");
        const wethDecimals = decimals['WETH'];
        if (wethDecimals === undefined) throw new Error("WETH decimals not found.");
        const amountInWei = parseTokenAmount(amount.toString(), wethDecimals);
        
        const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'deposit',
            args: [amountInWei, walletClient.account.address]
        });
        return walletClient.writeContract(request);
    };
    await executeTransaction('Vault Deposit', dialogDetails, txFunction);
  }, [executeTransaction, decimals, approveToken, walletClient]);
  
  const withdrawFromVault = useCallback(async (amount: number) => {
    const dialogDetails = { amount, token: 'WETH', details: 'Withdraw from AI Strategy Vault' };
    const txFunction = async () => {
        if(!walletClient) throw new Error("Wallet not connected");
        const wethDecimals = decimals['WETH'];
        if (wethDecimals === undefined) throw new Error("WETH decimals not found.");
        const amountInWei = parseTokenAmount(amount.toString(), wethDecimals);
        const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'withdraw',
            args: [amountInWei, walletClient.account.address, walletClient.account.address]
        });
        return walletClient.writeContract(request);
    };
    await executeTransaction('Vault Withdraw', dialogDetails, txFunction);
  }, [executeTransaction, decimals, walletClient]);

  const voteOnProposal = useCallback(async (proposalId: string, support: number) => {
    const dialogDetails = { details: `Vote on proposal #${proposalId}` };
    const txFunction = async () => {
        if(!walletClient) throw new Error("Wallet not connected");
        const { request } = await publicClient.simulateContract({
            account: walletClient.account,
            address: GOVERNOR_CONTRACT_ADDRESS,
            abi: GOVERNOR_ABI,
            functionName: 'castVote',
            args: [BigInt(proposalId), support]
        });
        return walletClient.writeContract(request);
    };
    await executeTransaction('Vote', dialogDetails, txFunction);
  }, [executeTransaction, walletClient]);
  
  
  // Effect for polling for external wallet updates
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    let isCancelled = false;
    
    const poll = async () => {
        if (isCancelled) return;
        if (!isUpdatingStateRef.current) {
            try { if (!isCancelled) { await refreshAllBalances(walletAddress as `0x${string}`); }
            } catch (error) { console.warn("Poll for wallet updates failed. Retrying.", error); }
        }
        if (!isCancelled) setTimeout(poll, 5000);
    };
    poll();
    return () => { isCancelled = true; };
  }, [isConnected, walletAddress, refreshAllBalances]);


  const value: WalletContextType = {
      walletState: { 
        isConnected, isConnecting, walletAddress, walletClient, balances, decimals, walletBalance, marketData, isMarketDataLoaded,
        transactions, vaultWeth, vaultCollateral, activeStrategy, proposals, availablePools, userPositions, txStatusDialog,
        allowances
      },
      walletActions: {
          connectWallet, disconnectWallet, updateBalance, setBalances, sendTokens, addTransaction,
          updateTransactionStatus, setVaultWeth, setVaultCollateral, setActiveStrategy, setProposals, setAvailablePools,
          setUserPositions, setTxStatusDialog, openPosition, closePosition,
          swapTokens, depositToVault, withdrawFromVault, voteOnProposal, addLiquidity, removeLiquidity,
          claimRewards, depositCollateral, withdrawCollateral, updateVaultCollateral,
          approveToken, checkAllowance, checkPoolExists, createPool
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

    