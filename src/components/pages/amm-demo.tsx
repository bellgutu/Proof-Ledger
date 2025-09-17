
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, formatEther, getContract, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { 
  Wallet, CheckCircle, XCircle, Bot, Cpu, Droplets, History, Settings, RefreshCw, PlusCircle, 
  ArrowRightLeft, TrendingUp, BarChart3, PieChart, Activity, Zap, Shield, Eye, Calculator, Loader2
} from 'lucide-react';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';

// --- CONTRACT & TOKEN ADDRESSES ---
const AMM_CONTRACT_ADDRESS = '0xC3F0c7b04995517A4484e242D766f4d48f699e85' as const;
const AI_ORACLE_ADDRESS = '0x730A471452aA3FA1AbC604f22163a7655B78d1B1' as const;
const MOCK_USDT_ADDRESS = '0xC9569792794d40C612C6E4cd97b767EeE4708f24' as const;
const MOCK_USDC_ADDRESS = '0xc4733C1fbdB1Ccd9d2Da26743F21fd3Fe12ECD37' as const;
const MOCK_WETH_ADDRESS = '0x3318056463e5bb26FB66e071999a058bdb35F34f' as const;

export const MOCK_TOKENS = {
    'USDT': { address: MOCK_USDT_ADDRESS, name: 'Mock USDT', decimals: 6 },
    'USDC': { address: MOCK_USDC_ADDRESS, name: 'Mock USDC', decimals: 6 },
    'WETH': { address: MOCK_WETH_ADDRESS, name: 'Mock WETH', decimals: 18 },
};

// --- ABIs ---
const ERC20_ABI = parseAbi([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function mint(address to, uint256 amount) external",
]);

const AMM_ABI = parseAbi([
  "function getPool(address, address) view returns (address)",
  "function createPool(address, address)",
  "function addLiquidity(address, address, uint256, uint256, address, uint256)",
  "function removeLiquidity(address, address, uint256, uint256, uint256, address, uint256)",
  "function swapExactTokensForTokens(uint256, uint256, address[], address, uint256)",
  "function setFee(address, uint256)",
  "function poolCount() view returns (uint256)",
  "function pools(uint256) view returns (address)",
  "function getReserves(address) view returns (uint256, uint256)",
  "function getFee(address) view returns (uint256)",
]);

const AMM_POOL_ABI = parseAbi([
    "function tokenA() view returns (address)",
    "function tokenB() view returns (address)",
    "function getReserves() view returns (uint112, uint112)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
]);

const AI_ORACLE_ABI = parseAbi([
    "function submitPrediction(address pool, uint256 predictedFee, uint8 confidence) external",
    "function getPrediction(address pool) view returns (uint256, uint8, uint256)",
]);

// --- TYPE DEFINITIONS ---
export type MockTokenSymbol = keyof typeof MOCK_TOKENS;
export type DemoTransactionType = 'Faucet' | 'Approve' | 'Add Liquidity' | 'Create Pool' | 'Submit Prediction' | 'Swap' | 'Remove Liquidity';
export type DemoTransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface DemoTransaction {
    id: string;
    type: DemoTransactionType;
    status: DemoTransactionStatus;
    timestamp: number;
    details: string;
    gasUsed?: string;
    effectiveGasPrice?: string;
}

export interface DemoPool {
    address: Address;
    name: string;
    tokenA: Address;
    tokenB: Address;
    reserveA: string;
    reserveB: string;
    totalLiquidity: string;
    feeRate: number;
    volume24h: string;
    fees24h: string;
    apy: number;
    userLpBalance: string;
    userShare: number;
}

export interface Prediction {
    pool: Address;
    predictedFee: number;
    confidence: number;
    timestamp: number;
    actualFee?: number;
    accuracy?: number;
}

interface AmmDemoState {
    isConnected: boolean;
    address: Address | undefined;
    ethBalance: string;
    tokenBalances: Record<MockTokenSymbol, string>;
    allowances: Record<MockTokenSymbol, bigint>;
    transactions: DemoTransaction[];
    pools: DemoPool[];
    predictions: Prediction[];
    processingStates: Record<string, boolean>;
    isProcessing: (key: string) => boolean;
    gasPrice: string;
    networkStats: {
        blockNumber: number;
        gasLimit: string;
    };
}

interface AmmDemoActions {
    connectWallet: () => void;
    getFaucetTokens: (token: MockTokenSymbol) => Promise<void>;
    approveToken: (token: MockTokenSymbol, amount: string) => Promise<void>;
    submitFeePrediction: (poolAddress: Address, fee: number, confidence: number) => Promise<void>;
    createPool: (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => Promise<void>;
    addLiquidity: (poolAddress: Address, amountA: string, amountB: string) => Promise<void>;
    removeLiquidity: (poolAddress: Address, lpAmount: string) => Promise<void>;
    swap: (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string, minAmountOut: string) => Promise<void>;
    fetchPoolDetails: (poolAddress: Address) => Promise<void>;
    fetchPredictionHistory: (poolAddress: Address) => Promise<void>;
    refreshData: () => Promise<void>;
}

interface AmmDemoContextType {
    state: AmmDemoState;
    actions: AmmDemoActions;
}

const AmmDemoContext = createContext<AmmDemoContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AmmDemoProvider = ({ children }: { children: ReactNode }) => {
    const { address, isConnected, chain } = useAccount();
    const { open } = useWeb3Modal();
    const { data: ethBalanceData } = useBalance({ address });
    const publicClient = getViemPublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();
    const { toast } = useToast();
    
    const [tokenBalances, setTokenBalances] = useState<Record<MockTokenSymbol, string>>({ USDT: '0', USDC: '0', WETH: '0' });
    const [allowances, setAllowances] = useState<Record<MockTokenSymbol, bigint>>({ USDT: 0n, USDC: 0n, WETH: 0n });
    const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
    const [pools, setPools] = useState<DemoPool[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [processingStates, setProcessingStates] = useState<Record<string, boolean>>({});
    const [gasPrice, setGasPrice] = useState<string>('0');
    const [networkStats, setNetworkStats] = useState({ blockNumber: 0, gasLimit: '0' });
    
    const ethBalance = ethBalanceData ? parseFloat(ethBalanceData.formatted).toFixed(4) : '0';
    
    const setProcessing = (key: string, value: boolean) => {
        setProcessingStates(prev => ({...prev, [key]: value}));
    };
    
    const isProcessing = (key: string) => !!processingStates[key];
    
    const addTransaction = (tx: Omit<DemoTransaction, 'status' | 'timestamp'>) => {
        const newTx: DemoTransaction = { ...tx, status: 'Pending', timestamp: Date.now() };
        setTransactions(prev => [newTx, ...prev]);
    };
    
    const updateTransactionStatus = (id: string, status: DemoTransactionStatus, details?: string, gasUsed?: string, effectiveGasPrice?: string) => {
        setTransactions(prev => prev.map(tx => 
            tx.id === id ? { ...tx, status, details: details || tx.details, gasUsed, effectiveGasPrice } : tx
        ));
    };

    // Fetch network stats
    const fetchNetworkStats = useCallback(async () => {
        if (!publicClient) return;
        try {
            const [blockNumber, gasPriceResult] = await Promise.all([
                publicClient.getBlockNumber(),
                publicClient.getGasPrice()
            ]);
            setGasPrice(formatUnits(gasPriceResult, 9)); // Gwei
            setNetworkStats({
                blockNumber: Number(blockNumber),
                gasLimit: '15000000' // Sepolia gas limit
            });
        } catch (e) {
            console.error("Failed to fetch network stats", e);
        }
    }, [publicClient]);

    const executeTransaction = async (
        type: DemoTransactionType,
        details: string,
        processingKey: string,
        txFunction: () => Promise<Address>,
        onSuccess?: (txHash: Address) => void | Promise<void>
    ) => {
        if (!walletClient || !publicClient || !address) {
            toast({ variant: "destructive", title: "Wallet Not Connected" });
            return;
        }
        
        setProcessing(processingKey, true);
        let tempTxId = `temp_${Date.now()}`;
        addTransaction({ id: tempTxId, type, details });
        
        try {
            const txHash = await txFunction();
            
            setTransactions(prev => prev.map(tx => tx.id === tempTxId ? {...tx, id: txHash} : tx));
            tempTxId = txHash;
            toast({ title: "Transaction Submitted", description: `Waiting for confirmation for ${type}...` });
            
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            
            if (receipt.status === 'success') {
                updateTransactionStatus(
                    txHash, 
                    'Completed', 
                    undefined,
                    receipt.gasUsed?.toString(),
                    receipt.effectiveGasPrice?.toString()
                );
                toast({ title: "Transaction Successful", description: `${type} transaction confirmed.` });
                if (onSuccess) await onSuccess(txHash);
            } else {
                updateTransactionStatus(txHash, 'Failed', 'Transaction reverted');
                toast({ variant: "destructive", title: "Transaction Failed", description: 'The transaction was reverted.' });
            }
        } catch (e: any) {
            console.error(`❌ ${type} failed:`, e);
            updateTransactionStatus(tempTxId, 'Failed', e.shortMessage || e.message);
            toast({ variant: "destructive", title: "Transaction Error", description: e.shortMessage || e.message });
        } finally {
            setProcessing(processingKey, false);
        }
    };

    const fetchBalances = useCallback(async () => {
        if (!address || !publicClient) return;
        const newBalances = { ...tokenBalances };
        
        for (const symbol in MOCK_TOKENS) {
            const token = MOCK_TOKENS[symbol as MockTokenSymbol];
            try {
                const balance = await publicClient.readContract({
                    address: token.address,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [address],
                });
                newBalances[symbol as MockTokenSymbol] = formatUnits(balance, token.decimals);
            } catch (e) {
                console.error(`Failed to fetch balance for ${symbol}`, e);
            }
        }
        setTokenBalances(newBalances);
    }, [address, publicClient, tokenBalances]);

    const fetchPools = useCallback(async () => {
        if (!publicClient) return;
        try {
            const poolCount = await publicClient.readContract({ 
                address: AMM_CONTRACT_ADDRESS, 
                abi: AMM_ABI, 
                functionName: 'poolCount' 
            });
            
            const poolAddresses: Address[] = [];
            for (let i = 0; i < Number(poolCount); i++) {
                const address = await publicClient.readContract({ 
                    address: AMM_CONTRACT_ADDRESS, 
                    abi: AMM_ABI, 
                    functionName: 'pools', 
                    args: [BigInt(i)] 
                });
                poolAddresses.push(address);
            }
            
            const poolDetails = await Promise.all(poolAddresses.map(async (addr) => {
                try {
                    const [tokenA, tokenB] = await Promise.all([
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'tokenA'}),
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'tokenB'}),
                    ]);
                    
                    const findSymbol = (addr: Address) => 
                        Object.keys(MOCK_TOKENS).find(key => 
                            MOCK_TOKENS[key as MockTokenSymbol].address.toLowerCase() === addr.toLowerCase()
                        );
                    
                    const symbolA = findSymbol(tokenA);
                    const symbolB = findSymbol(tokenB);
                    
                    if(!symbolA || !symbolB) return null;
                    
                    // Get reserves and other pool data
                    const [reserveA, reserveB] = await publicClient.readContract({
                        address: addr,
                        abi: AMM_POOL_ABI,
                        functionName: 'getReserves'
                    });
                    
                    const totalSupply = await publicClient.readContract({
                        address: addr,
                        abi: AMM_POOL_ABI,
                        functionName: 'totalSupply'
                    });
                    
                    const feeRate = await publicClient.readContract({
                        address: AMM_CONTRACT_ADDRESS,
                        abi: AMM_ABI,
                        functionName: 'getFee',
                        args: [addr]
                    });
                    
                    // Mock data for demo
                    const volume24h = (Math.random() * 10000).toFixed(2);
                    const fees24h = (parseFloat(volume24h) * Number(feeRate) / 100).toFixed(2);
                    const apy = (Math.random() * 20 + 5).toFixed(2);
                    
                    // Get user LP balance if connected
                    let userLpBalance = '0';
                    let userShare = 0;
                    if (address) {
                        try {
                            const balance = await publicClient.readContract({
                                address: addr,
                                abi: AMM_POOL_ABI,
                                functionName: 'balanceOf',
                                args: [address]
                            });
                            userLpBalance = formatUnits(balance, 18);
                            userShare = Number(formatUnits(balance, 18)) / Number(formatUnits(totalSupply, 18)) * 100;
                        } catch (e) {
                            console.error("Failed to fetch user LP balance", e);
                        }
                    }
                    
                    return {
                        address: addr,
                        name: `${symbolA}/${symbolB}`,
                        tokenA,
                        tokenB,
                        reserveA: formatUnits(reserveA, MOCK_TOKENS[symbolA as MockTokenSymbol].decimals),
                        reserveB: formatUnits(reserveB, MOCK_TOKENS[symbolB as MockTokenSymbol].decimals),
                        totalLiquidity: formatUnits(totalSupply, 18),
                        feeRate: Number(feeRate) / 100,
                        volume24h,
                        fees24h,
                        apy: Number(apy),
                        userLpBalance,
                        userShare
                    };
                } catch (e) {
                    console.error("Failed to fetch pool details", e);
                    return null;
                }
            }));
            
            setPools(poolDetails.filter(p => p !== null) as DemoPool[]);
        } catch (e) {
            console.error("Failed to fetch pools", e);
        }
    }, [publicClient, address]);
    
    const fetchPredictionHistory = useCallback(async (poolAddress: Address) => {
        if (!publicClient) return;
        try {
            // Mock prediction history for demo
            const mockPredictions: Prediction[] = [
                { pool: poolAddress, predictedFee: 0.3, confidence: 85, timestamp: Date.now() - 86400000, actualFee: 0.3, accuracy: 95 },
                { pool: poolAddress, predictedFee: 0.25, confidence: 75, timestamp: Date.now() - 172800000, actualFee: 0.28, accuracy: 89 },
                { pool: poolAddress, predictedFee: 0.35, confidence: 90, timestamp: Date.now() - 259200000, actualFee: 0.32, accuracy: 91 }
            ];
            setPredictions(mockPredictions);
        } catch (e) {
            console.error("Failed to fetch prediction history", e);
        }
    }, [publicClient]);
    
    useEffect(() => {
        if(!isConnected) return;
        fetchBalances();
        fetchPools();
        fetchNetworkStats();
        
        const interval = setInterval(() => {
            fetchBalances();
            fetchPools();
            fetchNetworkStats();
        }, 15000);
        
        return () => clearInterval(interval);
    }, [isConnected, fetchBalances, fetchPools, fetchNetworkStats]);
    
    const connectWallet = () => open();
    
    const getFaucetTokens = useCallback(async (token: MockTokenSymbol) => {
        const tokenInfo = MOCK_TOKENS[token];
        const amount = parseUnits('1000', tokenInfo.decimals);
        await executeTransaction(
            'Faucet',
            `Minting 1,000 ${token}`,
            `Faucet_${token}`,
            () => writeContractAsync({
                address: tokenInfo.address,
                abi: ERC20_ABI,
                functionName: 'mint',
                args: [address!, amount],
            }),
            fetchBalances
        );
    }, [address, writeContractAsync, fetchBalances, executeTransaction]);
    
    const approveToken = useCallback(async (token: MockTokenSymbol, amount: string) => {
        const tokenInfo = MOCK_TOKENS[token];
        const onChainAmount = parseUnits(amount, tokenInfo.decimals);
        await executeTransaction(
            'Approve',
            `Approving ${amount} ${token} for AMM`,
            `Approve_${token}`,
            () => writeContractAsync({
                address: tokenInfo.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [AMM_CONTRACT_ADDRESS, onChainAmount],
            }),
        );
    }, [writeContractAsync, executeTransaction]);
    
    const submitFeePrediction = useCallback(async (poolAddress: Address, fee: number, confidence: number) => {
        const feeBps = Math.round(fee * 100); 
        await executeTransaction(
            'Submit Prediction',
            `Submitting fee prediction for pool ${poolAddress}`,
            `Prediction_${poolAddress}`,
            () => writeContractAsync({
                address: AI_ORACLE_ADDRESS,
                abi: AI_ORACLE_ABI,
                functionName: 'submitPrediction',
                args: [poolAddress, BigInt(feeBps), confidence],
            }),
            () => fetchPredictionHistory(poolAddress)
        );
    }, [writeContractAsync, executeTransaction, fetchPredictionHistory]);
    
    const createPool = useCallback(async (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => {
        const tokenAInfo = MOCK_TOKENS[tokenA];
        const tokenBInfo = MOCK_TOKENS[tokenB];
        if (!tokenAInfo || !tokenBInfo) return;
        await executeTransaction(
            'Create Pool',
            `Creating pool for ${tokenA}/${tokenB}`,
            `CreatePool_${tokenA}/${tokenB}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'createPool',
                args: [tokenAInfo.address, tokenBInfo.address],
            }),
            fetchPools
        );
    }, [writeContractAsync, executeTransaction, fetchPools]);
    
    const addLiquidity = useCallback(async (poolAddress: Address, amountA: string, amountB: string) => {
        const pool = pools.find(p => p.address === poolAddress);
        if (!pool) return;
        
        const tokenA = Object.values(MOCK_TOKENS).find(t => t.address === pool.tokenA)!;
        const tokenB = Object.values(MOCK_TOKENS).find(t => t.address === pool.tokenB)!;
        
        await approveToken(tokenA.name.split(' ')[1] as MockTokenSymbol, amountA);
        await approveToken(tokenB.name.split(' ')[1] as MockTokenSymbol, amountB);
        
        await executeTransaction(
            'Add Liquidity',
            `Adding ${amountA} ${tokenA.name.split(' ')[1]} and ${amountB} ${tokenB.name.split(' ')[1]}`,
            `AddLiquidity_${poolAddress}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'addLiquidity',
                args: [
                    tokenA.address, 
                    tokenB.address, 
                    parseUnits(amountA, tokenA.decimals), 
                    parseUnits(amountB, tokenB.decimals), 
                    address!, 
                    BigInt(Math.floor(Date.now() / 1000) + 60*20)
                ],
            }),
            async () => {
                await fetchBalances();
                await fetchPools();
            }
        );
    }, [pools, approveToken, executeTransaction, writeContractAsync, fetchBalances, fetchPools, address]);
    
    const removeLiquidity = useCallback(async (poolAddress: Address, lpAmount: string) => {
        const pool = pools.find(p => p.address === poolAddress);
        if (!pool) return;
        
        await executeTransaction(
            'Remove Liquidity',
            `Removing ${lpAmount} LP tokens from ${pool.name}`,
            `RemoveLiquidity_${poolAddress}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'removeLiquidity',
                args: [
                    pool.tokenA,
                    pool.tokenB,
                    parseUnits(lpAmount, 18),
                    0n, // minAmountA
                    0n, // minAmountB
                    address!,
                    BigInt(Math.floor(Date.now() / 1000) + 60*20)
                ],
            }),
            async () => {
                await fetchBalances();
                await fetchPools();
            }
        );
    }, [pools, executeTransaction, writeContractAsync, fetchBalances, fetchPools, address]);
    
    const swap = useCallback(async (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string, minAmountOut: string) => {
         const tokenInInfo = MOCK_TOKENS[tokenIn];
         const tokenOutInfo = MOCK_TOKENS[tokenOut];
         if (!tokenInInfo || !tokenOutInfo) return;
        
         const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);
         const minAmountOutWei = parseUnits(minAmountOut, tokenOutInfo.decimals);
        
        await approveToken(tokenIn, amountIn);
         await executeTransaction(
             'Swap',
             `Swapping ${amountIn} ${tokenIn} for at least ${minAmountOut} ${tokenOut}`,
             `Swap_${tokenIn}_${tokenOut}`,
             () => writeContractAsync({
                 address: AMM_CONTRACT_ADDRESS,
                 abi: AMM_ABI,
                 functionName: 'swapExactTokensForTokens',
                 args: [
                     amountInWei, 
                     minAmountOutWei, 
                     [tokenInInfo.address, tokenOutInfo.address], 
                     address!, 
                     BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
                 ],
             }),
             fetchBalances
         );
    }, [executeTransaction, approveToken, writeContractAsync, address, fetchBalances]);
    
    const fetchPoolDetails = useCallback(async (poolAddress: Address) => {
        await fetchPools();
        await fetchPredictionHistory(poolAddress);
    }, [fetchPools, fetchPredictionHistory]);
    
    const refreshData = useCallback(async () => {
        await Promise.all([
            fetchBalances(),
            fetchPools(),
            fetchNetworkStats()
        ]);
    }, [fetchBalances, fetchPools, fetchNetworkStats]);
    
    const state: AmmDemoState = { 
        isConnected, 
        address, 
        ethBalance, 
        tokenBalances, 
        allowances, 
        transactions, 
        pools, 
        predictions,
        processingStates, 
        isProcessing,
        gasPrice,
        networkStats
    };
    
    const actions: AmmDemoActions = { 
        connectWallet, 
        getFaucetTokens, 
        approveToken, 
        submitFeePrediction, 
        createPool, 
        addLiquidity,
        removeLiquidity,
        swap,
        fetchPoolDetails,
        fetchPredictionHistory,
        refreshData
    };
    
    return (
        <AmmDemoContext.Provider value={{ state, actions }}>
            {children}
        </AmmDemoContext.Provider>
    );
};

export const useAmmDemo = (): AmmDemoContextType => {
    const context = useContext(AmmDemoContext);
    if (context === undefined) {
        throw new Error('useAmmDemo must be used within an AmmDemoProvider');
    }
    return context;
};

// --- UI COMPONENTS ---

function WalletPanel() {
    const { state, actions } = useAmmDemo();
    const { isConnected, address, ethBalance, tokenBalances, gasPrice, networkStats, isProcessing } = state;
    const { chain } = useAccount();
    const { switchChain } = useSwitchChain();
    const { open } = useWeb3Modal();
    const isSepolia = chain?.id === 11155111;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Wallet />Wallet & Network</CardTitle>
                <CardDescription>Connect to Sepolia testnet and manage your mock tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isConnected ? (
                    <Button onClick={() => open()} className="w-full">Connect Wallet</Button>
                ) : (
                    <div className="p-3 bg-background rounded-lg border space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} />Connected</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Address</span>
                            <span className="font-mono text-xs">{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Network</span>
                            {isSepolia ? (
                                <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} />{chain?.name || 'Sepolia'}</span>
                            ) : (
                                <Button size="sm" variant="destructive" onClick={() => switchChain?.({ chainId: 11155111 })}>
                                    <XCircle size={16} className="mr-2"/>
                                    Switch to Sepolia
                                </Button>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">ETH Balance</span>
                            <span className="font-mono">{ethBalance} ETH</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Gas Price</span>
                            <span className="font-mono">{gasPrice} Gwei</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Block Number</span>
                            <span className="font-mono">#{networkStats.blockNumber}</span>
                        </div>
                    </div>
                )}
                 {isConnected && isSepolia && (
                    <div className="space-y-3 pt-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Token Balances</h4>
                            <Button size="sm" variant="outline" onClick={actions.refreshData} disabled={isProcessing('refresh')}>
                                {isProcessing('refresh') ? <Loader2 size={14} className="mr-1 animate-spin"/> : <RefreshCw size={14} className="mr-1" />} Refresh
                            </Button>
                        </div>
                        <div className="space-y-2">
                           {(['USDT', 'USDC', 'WETH'] as const).map(symbol => (
                               <div key={symbol} className="flex justify-between items-center p-2 bg-background rounded-md border">
                                   <div className="flex items-center gap-3">
                                       <Image src={getTokenLogo(symbol)} alt={symbol} width={24} height={24} />
                                       <span className="font-bold">{symbol}</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                        <span className="font-mono">{parseFloat(tokenBalances[symbol]).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                        <Button size="sm" variant="outline" onClick={() => actions.getFaucetTokens(symbol)} disabled={isProcessing(`Faucet_${symbol}`)}>
                                            {isProcessing(`Faucet_${symbol}`) ? <Loader2 size={14} className="animate-spin"/> : "Faucet"}
                                        </Button>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TransactionHistoryPanel() {
    const { state } = useAmmDemo();
    const { transactions } = state;
    
    const getStatusBadge = (status: DemoTransaction['status']) => {
        switch (status) {
        case 'Completed': return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Completed</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
        case 'Failed': return <Badge variant="destructive">Failed</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><History /> Transaction History</CardTitle>
                <CardDescription>A log of your actions within this demo.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Gas Used</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <p className="font-medium">{tx.type}</p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-muted-foreground truncate">{tx.details}</p>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                    <TableCell>
                                        {tx.gasUsed ? `${parseInt(tx.gasUsed).toLocaleString()}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-xs">
                                        {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No transactions yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function AiOraclePanel() {
    const { state, actions } = useAmmDemo();
    const [selectedPool, setSelectedPool] = useState<string>('');
    const [fee, setFee] = useState<number>(0.3);
    const [confidence, setConfidence] = useState<number>(85);

    const handleSubmit = () => {
        if (!selectedPool) return;
        actions.submitFeePrediction(selectedPool as `0x${string}`, fee, confidence);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Bot /> AI Oracle Interface</CardTitle>
                    <CardDescription>Submit AI predictions to influence pool parameters like fees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Pool</Label>
                        <Select onValueChange={setSelectedPool} value={selectedPool}>
                            <SelectTrigger><SelectValue placeholder="Select a pool" /></SelectTrigger>
                            <SelectContent>
                                {state.pools.map(p => <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Predicted Fee: {fee.toFixed(2)}%</Label>
                        <Slider value={[fee]} onValueChange={([val]) => setFee(val)} max={1} step={0.01} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>0.5%</span>
                            <span>1%</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Confidence: {confidence}%</Label>
                        <Slider value={[confidence]} onValueChange={([val]) => setConfidence(val)} max={100} step={1} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <Button onClick={handleSubmit} disabled={!selectedPool || !state.isConnected || state.isProcessing(`Prediction_${selectedPool}`)} className="w-full">
                        {state.isProcessing(`Prediction_${selectedPool}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                        Submit Prediction
                    </Button>
                </CardContent>
            </Card>
            
            {state.predictions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><BarChart3 /> Prediction History</CardTitle>
                        <CardDescription>Historical AI predictions and their outcomes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Predicted Fee</TableHead>
                                    <TableHead>Confidence</TableHead>
                                    <TableHead>Actual Fee</TableHead>
                                    <TableHead>Accuracy</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {state.predictions.map((pred, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{pred.predictedFee.toFixed(2)}%</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full" 
                                                        style={{ width: `${pred.confidence}%` }}
                                                    ></div>
                                                </div>
                                                <span>{pred.confidence}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{pred.actualFee?.toFixed(2) || 'N/A'}%</TableCell>
                                        <TableCell>
                                            {pred.accuracy !== undefined ? (
                                                <Badge variant={pred.accuracy > 90 ? "default" : "secondary"}>
                                                    {pred.accuracy.toFixed(1)}%
                                                </Badge>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>{formatDistanceToNow(pred.timestamp, { addSuffix: true })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function PoolManagementPanel() {
     const { state, actions } = useAmmDemo();
     const [tokenA, setTokenA] = useState<MockTokenSymbol|''>('');
     const [tokenB, setTokenB] = useState<MockTokenSymbol|''>('');

     const handleCreatePool = () => {
        if (!tokenA || !tokenB || tokenA === tokenB) return;
        actions.createPool(tokenA, tokenB);
     }
     
     const tokenOptions = useMemo(() => Object.keys(state.tokenBalances), [state.tokenBalances]);

     return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><PlusCircle /> Create New Pool</CardTitle>
                    <CardDescription>Bootstrap a new AI-AMM pool.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Select onValueChange={(v) => setTokenA(v as MockTokenSymbol)} value={tokenA}>
                            <SelectTrigger><SelectValue placeholder="Token A"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={(v) => setTokenB(v as MockTokenSymbol)} value={tokenB}>
                            <SelectTrigger><SelectValue placeholder="Token B"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreatePool} disabled={!tokenA || !tokenB || !state.isConnected || state.isProcessing(`CreatePool_${tokenA}/${tokenB}`)} className="w-full">
                        {state.isProcessing(`CreatePool_${tokenA}/${tokenB}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                        Create Pool
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Droplets /> Existing Pools</CardTitle>
                    <CardDescription>View and manage liquidity pools.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-60">
                        {state.pools.length > 0 ? state.pools.map(pool => (
                            <div key={pool.address} className="p-3 border rounded-md mb-2 hover:bg-muted/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{pool.name}</p>
                                        <p className="text-xs text-muted-foreground">{`${pool.address.slice(0,6)}...${pool.address.slice(-4)}`}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline">{pool.feeRate.toFixed(2)}% fee</Badge>
                                            <Badge variant="outline">{pool.apy.toFixed(1)}% APY</Badge>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => actions.fetchPoolDetails(pool.address)} disabled={state.isProcessing(`fetchPool_${pool.address}`)}>
                                        {state.isProcessing(`fetchPool_${pool.address}`) ? <Loader2 size={14} className="animate-spin"/> : <Eye size={14} />}
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No pools found. Create your first pool!
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

function SwapPanel() {
    const { state, actions } = useAmmDemo();
    const [fromToken, setFromToken] = useState<MockTokenSymbol>('USDT');
    const [toToken, setToToken] = useState<MockTokenSymbol>('USDC');
    const [amount, setAmount] = useState('');
    const [minAmountOut, setMinAmountOut] = useState('');
    const [estimatedOut, setEstimatedOut] = useState('0');
    const [priceImpact, setPriceImpact] = useState(0);
    
    const tokenOptions = useMemo(() => Object.keys(state.tokenBalances) as MockTokenSymbol[], [state.tokenBalances]);
    
    useEffect(() => {
        if (!amount || !fromToken || !toToken) {
            setEstimatedOut('0');
            setPriceImpact(0);
            return;
        }
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
            setEstimatedOut('0');
            setPriceImpact(0);
            return;
        }
        
        const fromTokenInfo = MOCK_TOKENS[fromToken];
        const toTokenInfo = MOCK_TOKENS[toToken];
        const mockRate = fromTokenInfo.name.includes('WETH') ? 1800 : 1;
        const toTokenRate = toTokenInfo.name.includes('WETH') ? 1800 : 1;
        const rate = mockRate / toTokenRate;
        const estimated = amountNum * rate * 0.997; 
        const impact = Math.min(5, amountNum / 10000 * 0.5);
        
        setEstimatedOut(estimated.toFixed(6));
        setPriceImpact(impact);
    }, [amount, fromToken, toToken]);
    
    const handleSwap = () => {
        if (!fromToken || !toToken || !amount || !minAmountOut) return;
        actions.swap(fromToken, toToken, amount, minAmountOut);
    };
    
    const handleSetMax = () => {
        setAmount(state.tokenBalances[fromToken]);
    };
    
    const handleSetMinOut = () => {
        const minOut = parseFloat(estimatedOut) * 0.95;
        setMinAmountOut(minOut.toFixed(6));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><ArrowRightLeft /> Token Swap</CardTitle>
                <CardDescription>Swap tokens through the AI-AMM with optimized fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>From</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="0.0" 
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Balance: {parseFloat(state.tokenBalances[fromToken]).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                <button 
                                    type="button" 
                                    className="text-primary hover:underline"
                                    onClick={handleSetMax}
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                        <Select value={fromToken} onValueChange={(v) => setFromToken(v as MockTokenSymbol)}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {tokenOptions.map(token => (
                                    <SelectItem key={token} value={token}>
                                        <div className="flex items-center gap-2">
                                            <Image src={getTokenLogo(token)} alt={token} width={16} height={16} />
                                            {token}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="flex justify-center">
                    <Button size="sm" variant="ghost" onClick={() => {
                        const temp = fromToken;
                        setFromToken(toToken);
setToToken(temp);
                        setAmount('');
                        setMinAmountOut('');
                    }}>
                        <ArrowRightLeft size={16} />
                    </Button>
                </div>
                
                 <div className="space-y-2">
                    <Label>To (Estimated)</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input 
                                type="number" 
                                value={estimatedOut} 
                                readOnly 
                                placeholder="0.0" 
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                Balance: {parseFloat(state.tokenBalances[toToken]).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                        </div>
                        <Select value={toToken} onValueChange={(v) => setToToken(v as MockTokenSymbol)}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {tokenOptions.map(token => (
                                    <SelectItem key={token} value={token}>
                                        <div className="flex items-center gap-2">
                                            <Image src={getTokenLogo(token)} alt={token} width={16} height={16} />
                                            {token}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>Minimum Output</Label>
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            value={minAmountOut} 
                            onChange={e => setMinAmountOut(e.target.value)} 
                            placeholder="0.0" 
                        />
                        <Button size="sm" variant="outline" onClick={handleSetMinOut}>
                            <Calculator size={14} />
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Minimum amount you'll receive. Adjust for slippage tolerance.
                    </div>
                </div>
                
                {amount && (
                    <div className="p-3 bg-muted rounded-md space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Exchange Rate</span>
                            <span>1 {fromToken} = {(parseFloat(amount) / parseFloat(estimatedOut)).toFixed(6)} {toToken}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Price Impact</span>
                            <span className={priceImpact > 1 ? "text-orange-500" : ""}>
                                {priceImpact.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Network Fee</span>
                            <span>~{state.gasPrice} Gwei</span>
                        </div>
                    </div>
                )}
                
                <Button 
                    onClick={handleSwap} 
                    disabled={!fromToken || !toToken || !amount || !minAmountOut || !state.isConnected || state.isProcessing(`Swap_${fromToken}_${toToken}`)} 
                    className="w-full"
                >
                    {state.isProcessing(`Swap_${fromToken}_${toToken}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                    Swap
                </Button>
            </CardContent>
        </Card>
    );
}

function LiquidityPanel() {
    const { state, actions } = useAmmDemo();
    const [selectedPool, setSelectedPool] = useState<string>('');
    const [amountA, setAmountA] = useState('');
    const [amountB, setAmountB] = useState('');
    const [lpAmount, setLpAmount] = useState('');
    
    const pool = state.pools.find(p => p.address === selectedPool);
    
    useEffect(() => {
        if (!pool || !amountA) {
            setAmountB('');
            return;
        }
        
        const amountANum = parseFloat(amountA);
        if (isNaN(amountANum)) {
            setAmountB('');
            return;
        }
        
        const reserveA = parseFloat(pool.reserveA);
        const reserveB = parseFloat(pool.reserveB);
        if (reserveA === 0 || reserveB === 0) return;
        const amountBNum = (amountANum * reserveB) / reserveA;
        setAmountB(amountBNum.toFixed(6));
    }, [pool, amountA]);
    
    const handleAddLiquidity = () => {
        if (!pool || !amountA || !amountB) return;
        actions.addLiquidity(pool.address, amountA, amountB);
    };
    
    const handleRemoveLiquidity = () => {
        if (!pool || !lpAmount) return;
        actions.removeLiquidity(pool.address, lpAmount);
    };
    
    const handleSetMaxA = () => {
        if (!pool) return;
        const tokenA = Object.keys(MOCK_TOKENS).find(key => 
            MOCK_TOKENS[key as MockTokenSymbol].address === pool.tokenA
        ) as MockTokenSymbol;
        setAmountA(state.tokenBalances[tokenA]);
    };
    
    const handleSetMaxLP = () => {
        if (!pool) return;
        setLpAmount(pool.userLpBalance);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Droplets /> Add Liquidity</CardTitle>
                    <CardDescription>Provide liquidity to earn fees and LP tokens.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Pool</Label>
                        <Select onValueChange={setSelectedPool} value={selectedPool}>
                            <SelectTrigger><SelectValue placeholder="Select a pool" /></SelectTrigger>
                            <SelectContent>
                                {state.pools.map(p => <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {pool && (
                        <>
                            <div className="p-3 bg-muted rounded-md">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Reserve {pool.name.split('/')[0]}</span>
                                        <div className="font-medium">{parseFloat(pool.reserveA).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Reserve {pool.name.split('/')[1]}</span>
                                        <div className="font-medium">{parseFloat(pool.reserveB).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Your Share</span>
                                        <div className="font-medium">{pool.userShare.toFixed(2)}%</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">APY</span>
                                        <div className="font-medium">{pool.apy.toFixed(2)}%</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Amount {pool.name.split('/')[0]}</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="number" 
                                        value={amountA} 
                                        onChange={e => setAmountA(e.target.value)} 
                                        placeholder="0.0" 
                                    />
                                    <Button size="sm" variant="outline" onClick={handleSetMaxA}>
                                        MAX
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Balance: {parseFloat(state.tokenBalances[Object.keys(MOCK_TOKENS).find(key => 
                                        MOCK_TOKENS[key as MockTokenSymbol].address === pool.tokenA
                                    ) as MockTokenSymbol]).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Amount {pool.name.split('/')[1]}</Label>
                                <Input 
                                    type="number" 
                                    value={amountB} 
                                    readOnly 
                                    placeholder="0.0" 
                                />
                                <div className="text-xs text-muted-foreground">
                                    Calculated based on pool ratio
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleAddLiquidity} 
                                disabled={!amountA || !amountB || !state.isConnected || state.isProcessing(`AddLiquidity_${pool.address}`)} 
                                className="w-full"
                            >
                                {state.isProcessing(`AddLiquidity_${pool.address}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                                Add Liquidity
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
            
            {pool && pool.userLpBalance !== '0' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><PieChart /> Remove Liquidity</CardTitle>
                        <CardDescription>Remove liquidity and receive your tokens back.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>LP Token Amount</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    value={lpAmount} 
                                    onChange={e => setLpAmount(e.target.value)} 
                                    placeholder="0.0" 
                                />
                                <Button size="sm" variant="outline" onClick={handleSetMaxLP}>
                                    MAX
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Balance: {parseFloat(pool.userLpBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                        </div>
                        
                        {lpAmount && (
                            <div className="p-3 bg-muted rounded-md">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span>You'll receive:</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{pool.name.split('/')[0]}:</span>
                                        <span>{(parseFloat(lpAmount) / parseFloat(pool.totalLiquidity) * parseFloat(pool.reserveA)).toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{pool.name.split('/')[1]}:</span>
                                        <span>{(parseFloat(lpAmount) / parseFloat(pool.totalLiquidity) * parseFloat(pool.reserveB)).toFixed(6)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <Button 
                            onClick={handleRemoveLiquidity} 
                            disabled={!lpAmount || !state.isConnected || state.isProcessing(`RemoveLiquidity_${pool.address}`)} 
                            className="w-full"
                        >
                            {state.isProcessing(`RemoveLiquidity_${pool.address}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                            Remove Liquidity
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function AnalyticsPanel() {
    const { state } = useAmmDemo();
    
    const totalTVL = state.pools.reduce((sum, pool) => {
        const tokenAInfo = Object.values(MOCK_TOKENS).find(t => t.address === pool.tokenA)!;
        const tokenBInfo = Object.values(MOCK_TOKENS).find(t => t.address === pool.tokenB)!;
        const tokenAPrice = tokenAInfo.name.includes('WETH') ? 1800 : 1;
        const tokenBPrice = tokenBInfo.name.includes('WETH') ? 1800 : 1;
        const tokenAValue = parseFloat(pool.reserveA) * tokenAPrice;
        const tokenBValue = parseFloat(pool.reserveB) * tokenBPrice;
        return sum + tokenAValue + tokenBValue;
    }, 0);
    
    const totalVolume = state.pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h), 0);
    
    const totalFees = state.pools.reduce((sum, pool) => sum + parseFloat(pool.fees24h), 0);
    
    const avgAPY = state.pools.length > 0 
        ? state.pools.reduce((sum, pool) => sum + pool.apy, 0) / state.pools.length 
        : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total TVL</p>
                                <p className="text-xl font-bold">${totalTVL.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Activity className="text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">24h Volume</p>
                                <p className="text-xl font-bold">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Zap className="text-yellow-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">24h Fees</p>
                                <p className="text-xl font-bold">${totalFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Shield className="text-purple-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. APY</p>
                                <p className="text-xl font-bold">{avgAPY.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><BarChart3 /> Pool Performance</CardTitle>
                    <CardDescription>Detailed metrics for each liquidity pool.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pool</TableHead>
                                <TableHead className="text-right">TVL</TableHead>
                                <TableHead className="text-right">Volume 24h</TableHead>
                                <TableHead className="text-right">Fees 24h</TableHead>
                                <TableHead className="text-right">Fee Rate</TableHead>
                                <TableHead className="text-right">APY</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {state.pools.map(pool => {
                                const tokenAInfo = Object.values(MOCK_TOKENS).find(t => t.address === pool.tokenA)!;
                                const tokenBInfo = Object.values(MOCK_TOKENS).find(t => t.address === pool.tokenB)!;
                                const tokenAPrice = tokenAInfo.name.includes('WETH') ? 1800 : 1;
                                const tokenBPrice = tokenBInfo.name.includes('WETH') ? 1800 : 1;
                                const tvl = parseFloat(pool.reserveA) * tokenAPrice + parseFloat(pool.reserveB) * tokenBPrice;
                                
                                return (
                                    <TableRow key={pool.address}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    <Image 
                                                        src={getTokenLogo(Object.keys(MOCK_TOKENS).find(key => 
                                                            MOCK_TOKENS[key as MockTokenSymbol].address === pool.tokenA
                                                        ) as MockTokenSymbol)} 
                                                        alt="" 
                                                        width={20} 
                                                        height={20} 
                                                        className="rounded-full border-2 border-background"
                                                    />
                                                    <Image 
                                                        src={getTokenLogo(Object.keys(MOCK_TOKENS).find(key => 
                                                            MOCK_TOKENS[key as MockTokenSymbol].address === pool.tokenB
                                                        ) as MockTokenSymbol)} 
                                                        alt="" 
                                                        width={20} 
                                                        height={20} 
                                                        className="rounded-full border-2 border-background"
                                                    />
                                                </div>
                                                {pool.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </TableCell>
                                        <TableCell className="text-right">${parseFloat(pool.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                        <TableCell className="text-right">${parseFloat(pool.fees24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                        <TableCell className="text-right">{pool.feeRate.toFixed(2)}%</TableCell>
                                        <TableCell className="text-right">{pool.apy.toFixed(1)}%</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function InnovativeAMMDemo() {
    return (
        <div className="container mx-auto p-0 space-y-8">
             <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Innovative AMM Demo</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    A technical showcase of the AI-driven Automated Market Maker system, using isolated mock contracts on the Sepolia testnet.
                </p>
            </div>
            
            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="oracle" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span>AI Oracle</span>
                    </TabsTrigger>
                    <TabsTrigger value="pools" className="flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        <span>Pools</span>
                    </TabsTrigger>
                    <TabsTrigger value="swap" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>Swap</span>
                    </TabsTrigger>
                    <TabsTrigger value="liquidity" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        <span>Liquidity</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <WalletPanel />
                        </div>
                        <div>
                            <TransactionHistoryPanel />
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="oracle" className="mt-6">
                    <AiOraclePanel />
                </TabsContent>
                
                <TabsContent value="pools" className="mt-6">
                    <PoolManagementPanel />
                </TabsContent>
                
                 <TabsContent value="swap" className="mt-6">
                    <SwapPanel />
                </TabsContent>
                
                <TabsContent value="liquidity" className="mt-6">
                    <LiquidityPanel />
                </TabsContent>
                
                <TabsContent value="analytics" className="mt-6">
                    <AnalyticsPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}

const AmmDemoPage = () => {
    return (
        <AmmDemoProvider>
            <InnovativeAMMDemo />
        </AmmDemoProvider>
    );
};

export default AmmDemoPage;

    