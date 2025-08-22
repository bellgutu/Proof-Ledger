

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { Pool, UserPosition } from '@/components/pages/liquidity';
import { getWalletAssets, getCollateralAllowance, ERC20_CONTRACTS, DEX_CONTRACT_ADDRESS, VAULT_CONTRACT_ADDRESS, GOVERNOR_ABI, PERPETUALS_CONTRACT_ADDRESS, DEX_ABI, GOVERNOR_CONTRACT_ADDRESS as GOVERNOR_ADDR } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';
import { createWalletClient, custom, createPublicClient, http, parseUnits, defineChain, TransactionExecutionError, getContract, parseAbi, formatUnits as viemFormatUnits } from 'viem';
import { localhost } from 'viem/chains';

// --- TYPE DEFINITIONS ---

type AssetSymbol = 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | 'WETH' | 'LINK' | 'USDC' | 'BTC' | 'XAUT' | 'PEPE' | 'DOGE';

export type TransactionType = 'Swap' | 'Vault Deposit' | 'Vault Withdraw' | 'AI Rebalance' | 'Add Liquidity' | 'Remove Liquidity' | 'Vote' | 'Send' | 'Receive' | 'Approve' | 'Open Position' | 'Close Position' | 'Claim Rewards';
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
  swapTokens: (fromToken: string, toToken: string, amountIn: number) => Promise<void>;
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


const erc20Abi = parseAbi([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)"
]);

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
    { id: '0xe3464d7B906F82Bcb546909B854c65784A0bf1cd', name: 'USDC/USDT', type: 'Stable', token1: 'USDC', token2: 'USDT', tvl: 250_000_000, volume24h: 50_000_000, apr: 2.1 },
    { id: '0xDbc59fE0d9a1a4FB63685F52Cf92fb8EbD9102F0', name: 'WETH/USDT', type: 'V2', token1: 'WETH', token2: 'USDT', tvl: 150_000_000, volume24h: 30_000_000, apr: 12.5, feeTier: 0.3 },
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
        pollingInterval: undefined,
    });
  };

  const executeTransaction = async (
    txType: TransactionType,
    dialogDetails: Partial<Transaction>,
    txFunction: () => Promise<`0x${string}`>
  ) => {
      isUpdatingStateRef.current = true;
      setTxStatusDialog({ isOpen: true, state: 'processing', transaction: dialogDetails });
      
      const tempTxId = `temp_${Date.now()}`;
      addTransaction({ id: tempTxId, type: txType, ...dialogDetails });
      
      try {
          const txHash = await txFunction();
          
          setTransactions(prev => prev.map(tx => tx.id === tempTxId ? { ...tx, id: txHash, txHash: txHash } : tx));
          
          setTxStatusDialog(prev => ({ ...prev, state: 'success', transaction: { ...prev.transaction, txHash } }));
          
          publicClient.waitForTransactionReceipt({ hash: txHash }).then(receipt => {
              if (receipt.status === 'success') {
                  updateTransactionStatus(txHash, 'Completed');
              } else {
                  updateTransactionStatus(txHash, 'Failed', 'Transaction was reverted by the contract.');
              }
          }).finally(async () => {
             // Refresh balances after any successful tx
             if(walletAddress) {
                const remoteAssets = await getWalletAssets(walletAddress);
                const newBalances = remoteAssets.reduce((acc, asset) => {
                    acc[asset.symbol] = asset.balance;
                    return acc;
                }, {} as Balances);
                setBalances(newBalances);
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
    
    const dialogDetails = { amount, token: tokenSymbol, to: toAddress };

    const txFunction = async () => {
        const walletClient = getWalletClient();
        const [account] = await walletClient.getAddresses();
        const tokenInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];

        if (tokenSymbol === 'ETH') {
            // Handle native ETH transfer
            return walletClient.sendTransaction({
                account,
                to: toAddress as `0x${string}`,
                value: parseUnits(amount.toString(), 18)
            });
        } else {
            // Handle ERC20 token transfer
            if (!tokenInfo || !tokenInfo.address) throw new Error(`Unsupported token: ${tokenSymbol}`);
            
            return walletClient.writeContract({
                address: tokenInfo.address,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [toAddress as `0x${string}`, parseUnits(amount.toString(), tokenInfo.decimals)],
                account
            });
        }
    };

    await executeTransaction('Send', dialogDetails, txFunction);
  }, [walletAddress, executeTransaction]);
  
  const approveTokenForRouter = useCallback(async (tokenSymbol: string, amount: number): Promise<boolean> => {
    if (!walletAddress) throw new Error("Wallet not connected");
    // Native ETH doesn't require approval.
    if (tokenSymbol === 'ETH') return true;

    const tokenToApproveSymbol = tokenSymbol;
    const tokenInfo = ERC20_CONTRACTS[tokenToApproveSymbol as keyof typeof ERC20_CONTRACTS];
    if (!tokenInfo || !tokenInfo.address) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: `Token ${tokenToApproveSymbol} is not configured.` });
        return false;
    }
    
    const dialogDetails = { amount, token: tokenToApproveSymbol, to: 'DEX Router' };
    try {
        await executeTransaction('Approve', dialogDetails, async () => {
            const walletClient = getWalletClient();
            const [account] = await walletClient.getAddresses();
            const { request } = await publicClient.simulateContract({
                account,
                address: tokenInfo.address!,
                abi: erc20Abi,
                functionName: "approve",
                args: [DEX_CONTRACT_ADDRESS, parseUnits(amount.toString(), tokenInfo.decimals)],
            });
            return await walletClient.writeContract(request);
        });
        toast({ title: 'Approval Successful', description: `Approved DEX to spend ${amount} ${tokenToApproveSymbol}`});
        return true;
    } catch(e) {
        console.error("Approval failed", e);
        return false;
    }
  }, [walletAddress, toast, executeTransaction]);


  const swapTokens = useCallback(async (fromToken: string, toToken: string, amountIn: number) => {
    if (!walletAddress) throw new Error("Wallet not connected");

    const tokenToApprove = fromToken;
    const approvalSuccess = await approveTokenForRouter(tokenToApprove, amountIn);
    
    if (!approvalSuccess) return;

    const dialogDetails = { amount: amountIn, token: fromToken, details: `Swap ${fromToken} for ${toToken}` };
    await executeTransaction('Swap', dialogDetails, async () => {
      const walletClient = getWalletClient();
      const [account] = await walletClient.getAddresses();
      
      const fromTokenInfo = ERC20_CONTRACTS[fromToken as keyof typeof ERC20_CONTRACTS];
      const toTokenInfo = ERC20_CONTRACTS[toToken as keyof typeof ERC20_CONTRACTS];
      
      if (!fromTokenInfo?.address || !toTokenInfo?.address) throw new Error("Invalid token path for swap.");

      const amountInWei = parseUnits(amountIn.toString(), fromTokenInfo.decimals);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 mins

      const { request } = await publicClient.simulateContract({
        account,
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountInWei, 0n, [fromTokenInfo.address, toTokenInfo.address], false, account, deadline],
        value: fromToken === 'ETH' ? amountInWei : 0n,
      });

      return await walletClient.writeContract(request);
    });
  }, [walletAddress, approveTokenForRouter, executeTransaction]);
  
  const addLiquidity = useCallback(async (tokenA: string, tokenB: string, amountA: number, amountB: number, stable: boolean) => {
      if (!walletAddress) throw new Error("Wallet not connected");

      const approveASuccess = await approveTokenForRouter(tokenA, amountA);
      if (!approveASuccess) return;
      
      const approveBSuccess = await approveTokenForRouter(tokenB, amountB);
      if (!approveBSuccess) return;
      
      const dialogDetails = { details: `Add ${amountA.toFixed(4)} ${tokenA} & ${amountB.toFixed(4)} ${tokenB} to pool` };
      await executeTransaction('Add Liquidity', dialogDetails, async () => {
        const walletClient = getWalletClient();
        const [account] = await walletClient.getAddresses();
        
        const tokenAInfo = ERC20_CONTRACTS[tokenA as keyof typeof ERC20_CONTRACTS];
        const tokenBInfo = ERC20_CONTRACTS[tokenB as keyof typeof ERC20_CONTRACTS];
        
        if (!tokenAInfo?.address || !tokenBInfo?.address) throw new Error("Invalid tokens for liquidity");

        const amountADesired = parseUnits(amountA.toString(), tokenAInfo.decimals);
        const amountBDesired = parseUnits(amountB.toString(), tokenBInfo.decimals);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

        const { request } = await publicClient.simulateContract({
            account,
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: "addLiquidity",
            args: [ tokenAInfo.address, tokenBInfo.address, stable, amountADesired, amountBDesired, 0n, 0n, account, deadline ]
        });

        return walletClient.writeContract(request);
      });
  }, [walletAddress, approveTokenForRouter, executeTransaction]);

  const removeLiquidity = useCallback(async (position: UserPosition, percentage: number) => {
      if (!walletAddress) throw new Error("Wallet not connected");

      const dialogDetails = { details: `Remove ${percentage}% of liquidity from ${position.name} pool`};
      await executeTransaction('Remove Liquidity', dialogDetails, async () => {
        const walletClient = getWalletClient();
        const [account] = await walletClient.getAddresses();
        
        const tokenAInfo = ERC20_CONTRACTS[position.token1 as keyof typeof ERC20_CONTRACTS];
        const tokenBInfo = ERC20_CONTRACTS[position.token2 as keyof typeof ERC20_CONTRACTS];
        
        if (!tokenAInfo?.address || !tokenBInfo?.address) throw new Error("Invalid tokens for liquidity");

        // This is a simplified calculation for demo purposes. A real app would get this from the LP token contract.
        const liquidityToRemove = parseUnits((position.lpTokens * (percentage / 100)).toString(), 18);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

        const { request } = await publicClient.simulateContract({
            account,
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: "removeLiquidity",
            args: [ tokenAInfo.address, tokenBInfo.address, position.type === 'Stable', liquidityToRemove, 0n, 0n, account, deadline ]
        });

        return walletClient.writeContract(request);
      });
  }, [walletAddress, executeTransaction]);

  const claimRewards = useCallback(async (position: UserPosition) => {
      // This is a simulated function for the demo as rewards contracts are complex.
      // In a real app, this would call a `claim` or `harvest` function on a staking or rewards contract.
      updateBalance('USDT', position.unclaimedRewards);
      setUserPositions(prev => prev.map(p => {
        if (p.id === position.id) {
          return { ...p, unclaimedRewards: 0 };
        }
        return p;
      }));
      addTransaction({
        type: 'Claim Rewards',
        details: `Claimed $${position.unclaimedRewards.toFixed(2)} rewards from ${position.name} pool.`
      });
      toast({ title: 'Rewards Claimed!', description: `$${position.unclaimedRewards.toFixed(2)} has been added to your wallet.`});
  }, [addTransaction, updateBalance, toast]);
  
  const approveCollateral = useCallback(async (amount: string) => {
      const contractInfo = ERC20_CONTRACTS['USDT'];
      if(!contractInfo.address) throw new Error("USDT contract address not configured");
      const dialogDetails = { amount: parseFloat(amount), token: 'USDT', to: 'Perpetuals Contract' };
      const txFunction = async () => {
        const walletClient = getWalletClient();
        const [account] = await walletClient.getAddresses();
        return walletClient.writeContract({
              address: contractInfo.address!,
              abi: erc20Abi,
              functionName: 'approve',
              args: [PERPETUALS_CONTRACT_ADDRESS, parseUnits(amount, contractInfo.decimals)],
              account
          });
      };
      await executeTransaction('Approve', dialogDetails, txFunction);
  }, [executeTransaction]);

  const openPosition = useCallback(async (params: { side: number; size: string; collateral: string; }) => {
      const { side, size, collateral } = params;
      const collateralContractInfo = ERC20_CONTRACTS['USDT'];
      const tradeContractInfo = ERC20_CONTRACTS['ETH']; // Assuming ETH-based perpetuals for now
      
      if (!collateralContractInfo.address || !tradeContractInfo) throw new Error("Contract info missing");

      const dialogDetails = { amount: parseFloat(collateral), token: 'USDT', to: 'Perpetuals Contract' };
      const txFunction = async () => {
          const walletClient = getWalletClient();
          const [account] = await walletClient.getAddresses();
          return walletClient.writeContract({
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: perpetualsAbi,
              functionName: 'openPosition',
              args: [side, parseUnits(size, tradeContractInfo.decimals), parseUnits(collateral, collateralContractInfo.decimals)],
              account
          });
      };
      await executeTransaction('Open Position', dialogDetails, txFunction);
  }, [executeTransaction]);

  const closePosition = useCallback(async () => {
      const dialogDetails = { to: 'Perpetuals Contract' };
      const txFunction = async () => {
          const walletClient = getWalletClient();
          const [account] = await walletClient.getAddresses();
          return walletClient.writeContract({
              address: PERPETUALS_CONTRACT_ADDRESS,
              abi: perpetualsAbi,
              functionName: 'closePosition',
              account
          });
      }
      await executeTransaction('Close Position', dialogDetails, txFunction);
  }, [executeTransaction]);

  const depositToVault = useCallback(async (amount: number) => {
    const dialogDetails = { amount, token: 'WETH', to: 'AI Strategy Vault' };
    const txFunction = async () => {
        const walletClient = getWalletClient();
        const [account] = await walletClient.getAddresses();

        const wethInfo = ERC20_CONTRACTS['WETH'];
        if (!wethInfo || !wethInfo.address) throw new Error("WETH contract not found");
        
        const amountInWei = parseUnits(amount.toString(), wethInfo.decimals);
        
        // Approve Vault
        const approveHash = await walletClient.writeContract({
            address: wethInfo.address,
            abi: erc20Abi,
            functionName: 'approve',
            args: [VAULT_CONTRACT_ADDRESS, amountInWei],
            account
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        
        // Deposit
        const { request } = await publicClient.simulateContract({
            account,
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'deposit',
            args: [amountInWei]
        });
        
        return walletClient.writeContract(request);
    };
    await executeTransaction('Vault Deposit', dialogDetails, txFunction);
  }, [executeTransaction]);
  
  const withdrawFromVault = useCallback(async (amount: number) => {
    const dialogDetails = { amount, token: 'WETH', details: 'Withdraw from AI Strategy Vault' };
    const txFunction = async () => {
        const walletClient = getWalletClient();
        const [account] = await walletClient.getAddresses();
        const wethInfo = ERC20_CONTRACTS['WETH'];
        if (!wethInfo) throw new Error("WETH contract not found");
        const amountInWei = parseUnits(amount.toString(), wethInfo.decimals);

        const { request } = await publicClient.simulateContract({
            account,
            address: VAULT_CONTRACT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'withdraw',
            args: [amountInWei]
        });
        
        return walletClient.writeContract(request);
    };
    await executeTransaction('Vault Withdraw', dialogDetails, txFunction);
  }, [executeTransaction]);

  const voteOnProposal = useCallback(async (proposalId: string, support: number) => {
    const dialogDetails = { details: `Vote on proposal #${proposalId}` };
    const txFunction = async () => {
        const walletClient = getWalletClient();
        const [account] = await walletClient.getAddresses();
        const { request } = await publicClient.simulateContract({
            account,
            address: GOVERNOR_ADDR,
            abi: GOVERNOR_ABI,
            functionName: 'castVote',
            args: [BigInt(proposalId), support]
        });

        return walletClient.writeContract(request);
    };
    await executeTransaction('Vote', dialogDetails, txFunction);
  }, [executeTransaction]);

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
          setUserPositions, setTxStatusDialog, approveCollateral, openPosition, closePosition,
          swapTokens, depositToVault, withdrawFromVault, voteOnProposal, addLiquidity, removeLiquidity,
          claimRewards
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

