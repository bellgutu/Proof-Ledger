

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, usePublicClient, useWalletClient } from 'wagmi';
import { 
    ERC20_CONTRACTS, 
    DEX_CONTRACT_ADDRESS, 
    VAULT_CONTRACT_ADDRESS, 
    PERPETUALS_CONTRACT_ADDRESS, 
    GOVERNOR_CONTRACT_ADDRESS, DEX_ABI, VAULT_ABI, 
    PERPETUALS_ABI, 
    FACTORY_CONTRACT_ADDRESS, 
    FACTORY_ABI, POOL_ABI, 
    checkAllContracts,
    getVaultCollateral,
    getActivePosition as getActivePositionFromService,
    getViemPublicClient,
    GOVERNOR_ABI
} from '@/services/blockchain-service';
import type { VaultCollateral, Position } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';
import { parseAbi, formatUnits, type Address, parseEther } from 'viem';
import { parseTokenAmount, USDT_DECIMALS } from '@/lib/format';
import { isValidAddress } from '@/lib/utils';
import { useWeb3Modal } from '@web3modal/wagmi/react';


// --- TYPE DEFINITIONS ---

type AssetSymbol = 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'WETH' | 'LINK' | 'USDC' | 'BTC' | 'XAUT' | 'PEPE' | 'DOGE';

export type TransactionType = 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote' | 'Send' | 'Receive' | 'Approve' | 'Open Position' | 'Close Position' | 'Claim Rewards' | 'Deposit Collateral' | 'Withdraw Collateral' | 'Create Pool';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface PastPosition {
  id: string; // txHash of the closing transaction
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  timestamp: number;
}

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
  balances: { [symbol:string]: number };
  decimals: { [symbol:string]: number };
  allowances: { [symbol: string]: number };
  walletBalance: string;
  marketData: MarketData;
  isMarketDataLoaded: boolean;
  transactions: Transaction[];
  pastPositions: PastPosition[];
  vaultWeth: number;
  vaultCollateral: VaultCollateral;
  activePosition: Position | null;
  activeStrategy: VaultStrategy | null;
  proposals: Proposal[];
  availablePools: Pool[];
  userPositions: UserPosition[];
  txStatusDialog: TxStatusDialogInfo;
}

interface WalletActions {
  sendTokens: (toAddress: string, tokenSymbol: string, amount: number) => Promise<void>;
  depositCollateral: (amount: string) => Promise<void>;
  withdrawCollateral: (amount: string) => Promise<void>;
  openPosition: (params: { side: number; size: string; collateral: string; entryPrice: number; }) => Promise<void>;
  closePosition: (position: Position, pnl: number, exitPrice: number) => Promise<void>;
  updateVaultCollateral: () => Promise<void>;
  getActivePosition: (address: `0x${string}`) => Promise<void>;
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
  addLiquidity: (tokenA: string, tokenB: string, amountA: number, amountB: number, stable: boolean) => Promise<void>;
  removeLiquidity: (position: UserPosition, percentage: number) => Promise<void>;
  claimRewards: (position: UserPosition) => Promise<void>;
  updateBalance: (symbol: string, amount: number) => void;
  depositToVault: (amount: number) => Promise<void>;
  withdrawFromVault: (amount: number) => Promise<void>;
  voteOnProposal: (proposalId: string, support: number) => Promise<void>;
}

interface WalletContextType {
  walletState: WalletState;
  walletActions: WalletActions;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

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
    { id: '0x908C16b8ff2526a583284Fa41f866f4cEfB31928', name: 'USDC/USDT', type: 'Stable', token1: 'USDC', token2: 'USDT', tvl: 250_000_000, volume24h: 50_000_000, apr: 2.1 },
    { id: '0x910430e728dAD1105954b8b51Ec03F5BbdE1a57F', name: 'WETH/USDT', type: 'V2', token1: 'WETH', token2: 'USDT', tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5, feeTier: 0.3 },
    { id: '0xCf3bE0b5dc86cb58A565Fd9720B5A09CaEA078fD', name: 'WETH/LINK', type: 'V2', token1: 'WETH', token2: 'LINK', tvl: 75_000_000, volume24h: 15_000_000, apr: 18.3, feeTier: 0.3 },
];

const initialProposals: Proposal[] = [
    { id: '1', title: 'Increase LP Rewards for WETH/USDC', description: 'Boost the rewards for the WETH/USDC pool by 5% to attract more liquidity.', votesFor: 1250000, votesAgainst: 340000 },
    { id: '2', title: 'Onboard a new collateral asset: LINK', description: 'Allow Chainlink (LINK) to be used as collateral within the protocol.', votesFor: 850000, votesAgainst: 600000 },
];


export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { data: nativeBalance } = useBalance({ address });
  const publicClient = useMemo(() => getViemPublicClient(), []);
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const [balances, setBalances] = useState<{ [symbol:string]: number }>({});
  const [decimals, setDecimals] = useState<{ [symbol:string]: number }>({});
  const [allowances, setAllowances] = useState<{ [symbol: string]: number }>({});
  
  const [marketData, setMarketData] = useState<MarketData>(initialMarketData);
  const [isMarketDataLoaded, setIsMarketDataLoaded] = useState(false);

  // DeFi State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pastPositions, setPastPositions] = useState<PastPosition[]>([]);
  const [vaultWeth, setVaultWeth] = useState(0);
  const [vaultCollateral, setVaultCollateral] = useState<VaultCollateral>({ total: 0, locked: 0, available: 0 });
  const [activeStrategy, setActiveStrategy] = useState<VaultStrategy | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [activePosition, setActivePosition] = useState<Position | null>(null);

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
  const nativeBalanceRef = useRef(nativeBalance);

  useEffect(() => {
    nativeBalanceRef.current = nativeBalance;
  }, [nativeBalance]);


  const updateVaultCollateral = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      const collateral = await getVaultCollateral(address);
      setVaultCollateral(collateral);
    } catch (error) {
      console.error("Failed to update vault collateral:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vault collateral",
      });
    }
  }, [isConnected, address, toast]);

  // Fetch all balances when wallet connects
  useEffect(() => {
    const fetchAllBalances = async () => {
        if (isUpdatingStateRef.current) return;
        isUpdatingStateRef.current = true;

        const newBalances: { [symbol: string]: number } = {};
        const newDecimals: { [symbol: string]: number } = {};

        if (nativeBalanceRef.current) {
            newBalances['ETH'] = parseFloat(nativeBalanceRef.current.formatted);
            newDecimals['ETH'] = nativeBalanceRef.current.decimals;
        }

        for (const symbol of Object.keys(ERC20_CONTRACTS)) {
            const contract = ERC20_CONTRACTS[symbol as keyof typeof ERC20_CONTRACTS];
            if (contract.address && isValidAddress(contract.address)) {
                try {
                    const [balanceOf, decimals] = await Promise.all([
                        publicClient.readContract({ address: contract.address, abi: erc20Abi, functionName: 'balanceOf', args: [address!] }),
                        publicClient.readContract({ address: contract.address, abi: erc20Abi, functionName: 'decimals' })
                    ]);
                    newBalances[symbol] = parseFloat(formatUnits(balanceOf, decimals));
                    newDecimals[symbol] = decimals;
                } catch (e) {
                    console.error(`Failed to fetch balance/decimals for ${symbol}`, e);
                }
            }
        }
        
        setBalances(newBalances);
        setDecimals(newDecimals);
        isUpdatingStateRef.current = false;
    };

    if (isConnected && address) {
        fetchAllBalances();
    } else {
        setBalances({});
        setDecimals({});
    }
  }, [isConnected, address, publicClient]);

  // Calculate total wallet balance whenever underlying assets or prices change
  const walletBalance = useMemo(() => {
    if (isConnected && isMarketDataLoaded && Object.keys(balances).length > 0) {
        const total = Object.entries(balances).reduce((acc, [symbol, balance]) => {
          const price = marketData[symbol]?.price || 0;
          return acc + (balance * price);
        }, 0);
        return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '0.00';
  }, [balances, marketData, isConnected, isMarketDataLoaded]);


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
  const getPositionHistoryStorageKey = (address: string) => `position_history_${address}`;
  const getPoolsStorageKey = (address: string) => `user_pools_${address}`;

  const persistTransactions = useCallback((txs: Transaction[], addr: string) => {
      if (!addr) return;
       try {
        const storableTxs = txs.map(tx => {
            if (typeof tx.details !== 'string') {
                return {...tx, details: `React Component: ${tx.type}`};
            }
            return tx;
        });
        localStorage.setItem(getTxHistoryStorageKey(addr), JSON.stringify(storableTxs));
       } catch (e) {
        console.error("Failed to persist transaction history:", e);
       }
  }, []);
  
  const loadTransactions = useCallback((addr: string) => {
    try {
        const storedHistory = localStorage.getItem(getTxHistoryStorageKey(addr));
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

  const loadPastPositions = useCallback((addr: string) => {
    try {
        const storedHistory = localStorage.getItem(getPositionHistoryStorageKey(addr));
        if (storedHistory) {
            setPastPositions(JSON.parse(storedHistory));
        } else {
            setPastPositions([]);
        }
    } catch (e) {
        console.error("Failed to load position history:", e);
        setPastPositions([]);
    }
  }, []);
  
  const addPastPosition = useCallback((position: PastPosition, addr: string) => {
      setPastPositions(prev => {
          const newPositions = [position, ...prev];
          localStorage.setItem(getPositionHistoryStorageKey(addr), JSON.stringify(newPositions));
          return newPositions;
      });
  }, []);

  const loadUserCreatedPools = useCallback((addr: string) => {
      try {
          const storedPools = localStorage.getItem(getPoolsStorageKey(addr));
          if (storedPools) {
              const userPools: Pool[] = JSON.parse(storedPools);
              // Avoid duplicates
              setAvailablePools(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPools = userPools.filter(p => !existingIds.has(p.id));
                return [...prev, ...newPools];
              });
          }
      } catch (e) {
          console.error("Failed to load user created pools:", e);
      }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
        loadTransactions(address);
        loadPastPositions(address);
        loadUserCreatedPools(address);
    }
  }, [isConnected, address, loadTransactions, loadPastPositions, loadUserCreatedPools]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'status' | 'timestamp' | 'from' | 'to'> & { id?: string; to?: string; txHash?: string }) => {
    const newTx: Transaction = {
        id: transaction.id || `temp_${Date.now()}`,
        txHash: transaction.txHash || 'N/A',
        type: transaction.type,
        status: 'Pending',
        timestamp: Date.now(),
        from: address || '0x',
        to: transaction.to || 'Unknown Contract',
        details: transaction.details,
        token: transaction.token,
        amount: transaction.amount,
    };
    setTransactions(prev => {
        const newTxs = [newTx, ...prev];
        if (address) persistTransactions(newTxs, address);
        return newTxs;
    });
    return newTx.id;
  }, [address, persistTransactions]);


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
          if (address) persistTransactions(newTxs, address);
          return newTxs;
      });
  }, [address, persistTransactions]);

  const executeTransaction = async (
    txType: TransactionType,
    dialogDetails: Partial<Transaction>,
    txFunction: () => Promise<`0x${string}`>,
    onSuccess?: (txHash: `0x${string}`) => void | Promise<void>
  ) => {
      if (!walletClient || !publicClient || !address) {
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
          });
          
      } catch (e: any) {
          console.error(`❌ ${txType} failed:`, e);
          let errorMessage = (e.shortMessage || e.message || 'An unknown transaction error occurred.');
          
            if (errorMessage.includes('ERC20: mint to the zero address')) errorMessage = 'The pool contract is trying to mint LP tokens to an invalid address. This usually means the pool is not properly initialized.';
            else if (errorMessage.includes('ERC20: insufficient allowance')) errorMessage = 'Insufficient token allowance. Please approve the tokens first.';
            else if (errorMessage.includes('PoolNotFound')) errorMessage = 'Liquidity pool does not exist. Please create it first.';
            else if (errorMessage.includes('InvalidPath')) errorMessage = 'Invalid token path. Only direct swaps are supported.';
            else if (errorMessage.includes('Expired')) errorMessage = 'Transaction expired. Please try again.';
            else if (errorMessage.includes('Pool is not properly initialized')) errorMessage = 'The selected pool is not properly initialized. Please try a different pool or create a new one.';
            else if (errorMessage.includes('function selector was not recognized')) errorMessage = 'The contract function was not found. The ABI might be incorrect or the contract address is wrong.';
            else if (errorMessage.includes('Ownable: caller is not the owner')) errorMessage = 'This function can only be called by the contract owner.';
          
          setTxStatusDialog(prev => ({ ...prev, state: 'error', error: errorMessage }));
          updateTransactionStatus(tempTxId, 'Failed', errorMessage);
          throw e;
      } finally {
          setTimeout(() => { isUpdatingStateRef.current = false; }, 5000);
      }
  };
  
  const updateBalance = useCallback((symbol: string, amount: number) => {
    if (isUpdatingStateRef.current) return;
    isUpdatingStateRef.current = true;
    setBalances(prev => {
        const currentBalance = prev[symbol] || 0;
        const newBalance = currentBalance + amount;
        return { ...prev, [symbol]: newBalance };
    });
    setTimeout(() => { isUpdatingStateRef.current = false }, 3000);
  }, []);

  
  const checkAllowance = useCallback(async (tokenSymbol: string, spender: `0x${string}` = DEX_CONTRACT_ADDRESS) => {
    if (!publicClient || !address || !isValidAddress(address) || tokenSymbol === 'ETH') {
        setAllowances(prev => ({ ...prev, [tokenSymbol]: Infinity }));
        return;
    };
    
    const tokenInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
    if (!tokenInfo?.address) return;

    const tokenDecimals = decimals[tokenSymbol];
    if (tokenDecimals === undefined) return;

    try {
        const allowanceAmount = await publicClient.readContract({
            address: tokenInfo.address,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, spender]
        });
        const allowanceFormatted = parseFloat(formatUnits(allowanceAmount, tokenDecimals));
        setAllowances(prev => ({ ...prev, [tokenSymbol]: allowanceFormatted }));
    } catch(e) {
        console.error(`Failed to check allowance for ${tokenSymbol}`, e);
    }
  }, [publicClient, address, decimals]);

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
        
        const txFunction = async () => writeContractAsync({
            address: tokenInfo.address!,
            abi: erc20Abi,
            functionName: "approve",
            args: [spender, parseTokenAmount(amount.toString(), tokenDecimals)],
        });
        
        await executeTransaction('Approve', dialogDetails, txFunction, async () => {
            await checkAllowance(tokenSymbol, spender);
        });
        
    }, [executeTransaction, decimals, checkAllowance, writeContractAsync]);
  
    const sendTokens = useCallback(async (toAddress: string, tokenSymbol: string, amount: number) => {
        if (!address || !walletClient || !publicClient) throw new Error("Wallet not connected");

        if (tokenSymbol !== 'ETH') {
            const balance = balances[tokenSymbol] || 0;
            if (amount > balance) {
                throw new Error("Insufficient balance for ERC20 token send.");
            }
        }
        
        const dialogDetails = { amount, token: tokenSymbol, to: toAddress };
        
        const txFunction = async () => {
          if (tokenSymbol === 'ETH') {
              return await walletClient.sendTransaction({
                to: toAddress as Address,
                value: parseEther(amount.toString())
              });
          } else {
              const tokenInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
              if (!tokenInfo?.address) throw new Error(`Unsupported token: ${tokenSymbol}`);
              const tokenDecimals = decimals[tokenSymbol];
              if (tokenDecimals === undefined) throw new Error(`Decimals for ${tokenSymbol} not found.`);
              const onChainAmount = parseTokenAmount(amount.toString(), tokenDecimals);
              return await writeContractAsync({
                   address: tokenInfo.address as `0x${string}`,
                   abi: erc20Abi,
                   functionName: 'transfer',
                   args: [toAddress as `0x${string}`, onChainAmount],
              });
          }
        };
    
        await executeTransaction('Send', dialogDetails, txFunction);
      }, [address, walletClient, publicClient, decimals, balances, executeTransaction, writeContractAsync]);
    

  const checkPoolExists = useCallback(async (tokenA: string, tokenB: string, stable: boolean = false) => {
    if (!publicClient) return false;
    try {
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
            const poolAddress = await publicClient.readContract({ 
                address: FACTORY_CONTRACT_ADDRESS, 
                abi: FACTORY_ABI, 
                functionName: 'getPool', 
                args: [token0, token1, stable]
            });
            return poolAddress !== '0x0000000000000000000000000000000000000000';
        } catch (error) {
            console.error("Error checking pool existence:", error);
            return false;
        }
    } catch (error) {
        console.error("Critical error in checkPoolExists:", error);
        return false;
    }
  }, [publicClient]);

  const swapTokens = useCallback(async (fromToken: string, toToken: string, amountIn: number) => {
    const fromTokenInfo = ERC20_CONTRACTS[fromToken as keyof typeof ERC20_CONTRACTS];
    if (!fromTokenInfo?.address) throw new Error(`Token ${fromToken} is not configured.`);
    const fromTokenDecimals = decimals[fromToken];
    if (fromTokenDecimals === undefined) throw new Error(`Decimals for ${fromToken} not found.`);
    
    const toTokenInfo = ERC20_CONTRACTS[toToken as keyof typeof ERC20_CONTRACTS];
    if (!toTokenInfo?.address) throw new Error("Invalid token path for swap.");

    const dialogDetails = { amount: amountIn, token: fromToken, details: `Swap ${amountIn} ${fromToken} for ${toToken}` };
    
    const txFunction = async () => {
        const onChainAmount = parseTokenAmount(amountIn.toString(), fromTokenDecimals);
        return await writeContractAsync({
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [onChainAmount, 0n, [fromTokenInfo.address!, toTokenInfo.address!], address as Address, BigInt(Math.floor(Date.now() / 1000) + 60 * 20)]
        });
    };

    await executeTransaction('Swap', dialogDetails, txFunction, async (txHash) => {
        await checkAllowance(fromToken, DEX_CONTRACT_ADDRESS);
    });
  }, [executeTransaction, decimals, checkAllowance, writeContractAsync, address]);

  const createPool = useCallback(async (tokenA: string, tokenB: string, stable: boolean = false) => {
    const tokenAInfo = ERC20_CONTRACTS[tokenA as keyof typeof ERC20_CONTRACTS];
    const tokenBInfo = ERC20_CONTRACTS[tokenB as keyof typeof ERC20_CONTRACTS];
    if (!tokenAInfo?.address || !tokenBInfo?.address) throw new Error("Invalid tokens for pool creation.");
    
    const token0 = tokenAInfo.address.toLowerCase() < tokenBInfo.address.toLowerCase() ? tokenAInfo.address : tokenBInfo.address;
    const token1 = tokenAInfo.address.toLowerCase() < tokenBInfo.address.toLowerCase() ? tokenBInfo.address : tokenAInfo.address;

    const dialogDetails = { details: `Create pool for ${tokenA}/${tokenB}` };
    await executeTransaction('Create Pool', dialogDetails, async () => {
        return writeContractAsync({
            address: FACTORY_CONTRACT_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'createPool',
            args: [token0, token1, stable]
        });
    });
  }, [executeTransaction, writeContractAsync]);
  
  const addLiquidity = useCallback(async (tokenA: string, tokenB: string, amountA: number, amountB: number, stable: boolean) => {
    const tokenAInfo = ERC20_CONTRACTS[tokenA as keyof typeof ERC20_CONTRACTS];
    const tokenBInfo = ERC20_CONTRACTS[tokenB as keyof typeof ERC20_CONTRACTS];
    if (!tokenAInfo?.address || !tokenBInfo?.address) { throw new Error("Invalid tokens for liquidity."); }
    
    const decimalsA = decimals[tokenA];
    const decimalsB = decimals[tokenB];
    if (decimalsA === undefined || decimalsB === undefined) throw new Error("Token decimals not found");
    
    await approveToken(tokenA, amountA, DEX_CONTRACT_ADDRESS);
    await approveToken(tokenB, amountB, DEX_CONTRACT_ADDRESS);
    
    const dialogDetails = { details: `Add ${amountA.toFixed(4)} ${tokenA} & ${amountB.toFixed(4)} ${tokenB} to pool` };
    
    const txFunction = async () => {
        const amountADesired = parseTokenAmount(amountA.toString(), decimalsA);
        const amountBDesired = parseTokenAmount(amountB.toString(), decimalsB);
        
        return writeContractAsync({
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: "addLiquidity",
            args: [
                tokenAInfo.address!,
                tokenBInfo.address!,
                stable,
                amountADesired,
                amountBDesired,
                0n, // amountAMin
                0n, // amountBMin
                address as Address,
                BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // deadline
            ],
        });
    };

    await executeTransaction('Add Liquidity', dialogDetails, txFunction, async () => {
        await checkAllowance(tokenA, DEX_CONTRACT_ADDRESS);
        await checkAllowance(tokenB, DEX_CONTRACT_ADDRESS);
    });
      
  }, [decimals, approveToken, executeTransaction, checkAllowance, writeContractAsync, address]);

  const removeLiquidity = useCallback(async (position: UserPosition, percentage: number) => {
      const dialogDetails = { details: `Remove ${percentage}% of liquidity from ${position.name} pool`};
      
      const txFunction = async () => {
        const tokenAInfo = ERC20_CONTRACTS[position.token1 as keyof typeof ERC20_CONTRACTS];
        const tokenBInfo = ERC20_CONTRACTS[position.token2 as keyof typeof ERC20_CONTRACTS];
        if (!tokenAInfo?.address || !tokenBInfo?.address) throw new Error("Invalid tokens for liquidity");
        
        const lpDecimals = 18;
        const liquidityToRemove = parseTokenAmount((position.lpTokens * (percentage / 100)).toString(), lpDecimals);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

        return writeContractAsync({
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: "removeLiquidity",
            args: [ tokenAInfo.address, tokenBInfo.address, position.type === 'Stable', liquidityToRemove, 0n, 0n, address as Address, deadline ]
        });
      };
      await executeTransaction('Remove Liquidity', dialogDetails, txFunction);
  }, [executeTransaction, writeContractAsync, address]);

  const claimRewards = useCallback(async (position: UserPosition) => {
      if (!address) return;
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
  }, [addTransaction, address, updateBalance, toast]);
  
  const depositCollateral = useCallback(async (amount: string) => {
    if (!address || !publicClient) {
        throw new Error("Wallet not connected");
    }
    const usdtDecimals = decimals['USDT'];
    if (usdtDecimals === undefined) throw new Error("USDT decimals not found");

    const vaultCollateralToken = await publicClient.readContract({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'collateralToken',
    });

    if (vaultCollateralToken.toLowerCase() !== ERC20_CONTRACTS.USDT.address!.toLowerCase()) {
        throw new Error(`Vault collateral token mismatch. Expected: ${ERC20_CONTRACTS.USDT.address}, Got: ${vaultCollateralToken}`);
    }

    const currentAllowance = await publicClient.readContract({
        address: ERC20_CONTRACTS.USDT.address!,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, VAULT_CONTRACT_ADDRESS],
    });

    const depositAmountOnChain = parseTokenAmount(amount, usdtDecimals);

    if (currentAllowance < depositAmountOnChain) {
        console.log('Approving USDT for vault contract...');
        const approvalTxHash = await writeContractAsync({
            address: ERC20_CONTRACTS.USDT.address!,
            abi: erc20Abi,
            functionName: 'approve',
            args: [VAULT_CONTRACT_ADDRESS, depositAmountOnChain],
        });
        
        const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalTxHash });
        if (approvalReceipt.status !== 'success') {
            throw new Error('Token approval failed');
        }
        console.log('USDT approved successfully');
    }

    const dialogDetails = { amount: parseFloat(amount), token: 'USDT', to: 'Perpetuals Vault' };
    const txFunction = async () => {
        return writeContractAsync({
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "deposit",
            args: [depositAmountOnChain],
        });
    };
    await executeTransaction('Deposit Collateral', dialogDetails, txFunction, async () => {
        await updateVaultCollateral();
    });
}, [executeTransaction, decimals, updateVaultCollateral, writeContractAsync, address, publicClient]);

  
  const withdrawCollateral = useCallback(async (amount: string) => {
      const usdtDecimals = decimals['USDT'];
      if (usdtDecimals === undefined) throw new Error("USDT decimals not found");

      const dialogDetails = { amount: parseFloat(amount), token: 'USDT', to: 'Perpetuals Vault' };
      const txFunction = async () => {
          const amountOnChain = parseTokenAmount(amount, usdtDecimals);
          
          return writeContractAsync({
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: PERPETUALS_ABI,
              functionName: 'withdrawCollateral',
              args: [amountOnChain]
          });
      };
      await executeTransaction('Withdraw Collateral', dialogDetails, txFunction, async () => {
          await updateVaultCollateral();
      });
  }, [executeTransaction, decimals, updateVaultCollateral, writeContractAsync]);

  const getActivePosition = useCallback(async (addr: `0x${string}`) => {
    try {
        const position = await getActivePositionFromService(addr);
        if (position) {
            const pinnedEntryPrice = localStorage.getItem(`entryPrice_${addr}`);
            if (pinnedEntryPrice) {
                position.entryPrice = parseFloat(pinnedEntryPrice);
            }
            setActivePosition(position);
        } else {
            setActivePosition(null);
        }
    } catch (e) {
        console.error("Failed to get and set active position:", e);
        setActivePosition(null);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch active position",
        });
    }
  }, [toast]);

  const openPosition = useCallback(async (params: { side: number; size: string; collateral: string; entryPrice: number; }) => {
      const { side, size, collateral, entryPrice } = params;
      
      const sizeDecimals = decimals['ETH'];
      if (sizeDecimals === undefined) throw new Error("ETH decimals not found");
      
      const sizeOnChain = parseTokenAmount(size, sizeDecimals);
      const collateralOnChain = parseTokenAmount(collateral, USDT_DECIMALS);

      const dialogDetails = { amount: parseFloat(collateral), token: 'USDT', to: 'Perpetuals Contract', details: `Open ${side === 0 ? 'LONG' : 'SHORT'} position of ${size} ETH` };
      const txFunction = async () => writeContractAsync({
          address: PERPETUALS_CONTRACT_ADDRESS,
          abi: PERPETUALS_ABI,
          functionName: 'openPosition',
          args: [side as 0 | 1, sizeOnChain, collateralOnChain],
      });
      await executeTransaction('Open Position', dialogDetails, txFunction, async () => {
        if (entryPrice > 0 && address) {
          localStorage.setItem(`entryPrice_${address}`, entryPrice.toString());
        }
        if (address) await getActivePosition(address);
      });
  }, [executeTransaction, decimals, address, writeContractAsync, getActivePosition]);
  
  const closePosition = useCallback(async (position: Position, pnl: number, exitPrice: number) => {
      const detailsNode = ( <div className="text-xs text-left"> <div>Closed {position.side.toUpperCase()} position of {position.size} ETH</div> <div>Entry: ${position.entryPrice.toFixed(2)}</div> <div className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}> Final PnL: ${pnl.toFixed(2)} </div> </div> );
      const dialogDetails = { to: 'Perpetuals Contract', details: detailsNode };
      
      const txFunction = async () => writeContractAsync({
          address: PERPETUALS_CONTRACT_ADDRESS,
          abi: PERPETUALS_ABI,
          functionName: 'closePosition'
      });
      await executeTransaction('Close Position', dialogDetails, txFunction, async (txHash) => {
          if (address) {
            const pastPosition: PastPosition = {
              id: txHash,
              side: position.side,
              size: position.size,
              entryPrice: position.entryPrice,
              exitPrice: exitPrice,
              pnl: pnl,
              timestamp: Date.now(),
            };
            addPastPosition(pastPosition, address);
            localStorage.removeItem(`entryPrice_${address}`);
          }
          await updateVaultCollateral();
          setActivePosition(null);
      });
  }, [executeTransaction, address, writeContractAsync, updateVaultCollateral, addPastPosition]);

  const depositToVault = useCallback(async (amount: number) => {
    await approveToken('WETH', amount, VAULT_CONTRACT_ADDRESS);
    const dialogDetails = { amount, token: 'WETH', to: 'AI Strategy Vault' };
    const txFunction = async () => {
        const wethDecimals = decimals['WETH'];
        if (wethDecimals === undefined) throw new Error("WETH decimals not found.");
        const amountInWei = parseTokenAmount(amount.toString(), wethDecimals);
        
        return writeContractAsync({
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'deposit',
            args: [amountInWei]
        });
    };
    await executeTransaction('Vault Deposit', dialogDetails, txFunction);
  }, [executeTransaction, decimals, approveToken, writeContractAsync]);
  
  const withdrawFromVault = useCallback(async (amount: number) => {
    const dialogDetails = { amount, token: 'WETH', details: 'Withdraw from AI Strategy Vault' };
    const txFunction = async () => {
        const wethDecimals = decimals['WETH'];
        if (wethDecimals === undefined) throw new Error("WETH decimals not found.");
        const amountInWei = parseTokenAmount(amount.toString(), wethDecimals);
        return writeContractAsync({
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'withdraw',
            args: [amountInWei, address as Address, address as Address]
        });
    };
    await executeTransaction('Vault Withdraw', dialogDetails, txFunction);
  }, [executeTransaction, decimals, writeContractAsync, address]);
  
  const voteOnProposal = useCallback(async (proposalId: string, support: number) => {
    const dialogDetails = { details: `Vote on proposal #${proposalId}` };
    const txFunction = async () => writeContractAsync({
        address: GOVERNOR_CONTRACT_ADDRESS,
        abi: GOVERNOR_ABI,
        functionName: 'castVote',
        args: [BigInt(proposalId), support as 0 | 1]
    });
    await executeTransaction('Vote', dialogDetails, txFunction);
  }, [executeTransaction, writeContractAsync]);

  useEffect(() => {
    // Persist user-created pools to local storage
    if (address) {
      const userCreatedPools = availablePools.filter(p => !initialAvailablePools.some(ip => ip.id === p.id));
      localStorage.setItem(getPoolsStorageKey(address), JSON.stringify(userCreatedPools));
    }
  }, [availablePools, address]);


  const value: WalletContextType = {
      walletState: { 
        isConnected, isConnecting, walletAddress: address || '', balances, decimals, walletBalance, marketData, isMarketDataLoaded,
        transactions, pastPositions, vaultWeth, vaultCollateral, activeStrategy, proposals, availablePools, userPositions, txStatusDialog,
        allowances, activePosition
      },
      walletActions: {
          sendTokens, addTransaction,
          updateTransactionStatus, setVaultWeth, setVaultCollateral, setActiveStrategy, setProposals, setAvailablePools,
          setUserPositions, setTxStatusDialog, openPosition, closePosition,
          swapTokens, depositToVault, withdrawFromVault, voteOnProposal, addLiquidity, removeLiquidity,
          claimRewards, depositCollateral, withdrawCollateral, updateVaultCollateral,
          approveToken, checkAllowance, checkPoolExists, createPool, getActivePosition, updateBalance
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
