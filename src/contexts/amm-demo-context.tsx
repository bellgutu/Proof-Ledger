
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useWriteContract, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, getContract, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';
import * as DEPLOYED_CONTRACTS from '@/lib/contract-addresses.json';

// --- CONTRACT & TOKEN ADDRESSES ---
const MAIN_CONTRACT_ADDRESS = DEPLOYED_CONTRACTS.MainContract as Address;
const AMM_CONTRACT_ADDRESS = DEPLOYED_CONTRACTS.AdaptiveMarketMaker as Address;
const AI_ORACLE_ADDRESS = DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address;

export const MOCK_TOKENS = {
    'USDT': { address: '0xC9569792794d40C612C6E4cd97b767EeE4708f24' as Address, name: 'Mock USDT', decimals: 18 },
    'USDC': { address: '0xc4733C1fbdB1Ccd9d2Da26743F21fd3Fe12ECD37' as Address, name: 'Mock USDC', decimals: 18 },
    'WETH': { address: '0x3318056463e5bb26FB66e071999a058bdb35F34f' as Address, name: 'Mock WETH', decimals: 18 },
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
    "function getPool(address tokenA, address tokenB) external view returns (address pool)",
    "function createPool(address tokenA, address tokenB) external returns (address pool)",
    "function addLiquidity(uint256 poolId, uint256 amountA, uint256 amountB) external",
    "function removeLiquidity(uint256 poolId, uint256 liquidity) external",
    "function swap(uint256 poolId, address tokenIn, uint256 amountIn) external returns (uint256 amountOut)",
    "function setFee(address pool, uint256 fee) external",
    "function getPoolCount() external view returns (uint256)",
    "function pools(uint256 index) external view returns (address pool)",
    "function getReserves(uint256 poolId) external view returns (uint256 reserveA, uint256 reserveB)",
    "function getCurrentFee(uint256 poolId) external view returns (uint256)",
    "event PoolCreated(uint256 indexed poolId, address tokenA, address tokenB)"
]);

const AMM_POOL_ABI = parseAbi([
    "function tokenA() external view returns (address)",
    "function tokenB() external view returns (address)",
    "function getReserves() external view returns (uint256 reserveA, uint256 reserveB)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
]);

const AI_ORACLE_ABI = parseAbi([
    "function registerAsProvider() external payable",
    "function submitPrediction(uint256 pairId, uint256 optimalFee, uint256 priceVolatility, uint256 volumeForecast, uint256 confidence, bytes32 modelHash, bytes signature) external",
    "function getCurrentPrediction(uint256 pairId) view returns ((uint256 timestamp, uint256 optimalFee, uint256 priceVolatility, uint256 volumeForecast, uint256 confidence, bytes32 modelHash) memory)",
    "function addAssetPair(address tokenA, address tokenB, uint256 updateInterval) external"
]);

// --- TYPE DEFINITIONS ---
export type MockTokenSymbol = keyof typeof MOCK_TOKENS;
export type DemoTransactionType = 'Faucet' | 'Approve' | 'Add Liquidity' | 'Create Pool' | 'Submit Prediction' | 'Swap' | 'Remove Liquidity' | 'Send' | 'Register Provider';
export type DemoTransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface DemoTransaction {
    id: string;
    type: DemoTransactionType;
    status: DemoTransactionStatus;
    timestamp: number;
    details: React.ReactNode;
    gasUsed?: string;
    effectiveGasPrice?: string;
}

export interface DemoPool {
    address: Address;
    id: number;
    name: string;
    tokenA: { address: Address, symbol: MockTokenSymbol, decimals: number};
    tokenB: { address: Address, symbol: MockTokenSymbol, decimals: number};
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
    tokenBalances: Record<MockTokenSymbol, string>;
    ethBalance: string;
    isConnected: boolean;
    address?: Address;
}

interface AmmDemoActions {
    getFaucetTokens: (token: MockTokenSymbol) => Promise<void>;
    approveToken: (token: MockTokenSymbol, amount: string, spender?: Address) => Promise<void>;
    submitFeePrediction: (poolAddress: Address, fee: number, confidence: number) => Promise<void>;
    createPool: (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => Promise<void>;
    addLiquidity: (poolId: number, amountA: string, amountB: string) => Promise<void>;
    removeLiquidity: (poolId: number, lpAmount: string) => Promise<void>;
    swap: (poolId: number, tokenIn: MockTokenSymbol, amountIn: string) => Promise<void>;
    send: (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => Promise<void>;
    refreshData: () => Promise<void>;
    registerOracleProvider: () => Promise<void>;
}

interface AmmDemoContextType {
    state: AmmDemoState;
    actions: AmmDemoActions;
}

const AmmDemoContext = createContext<AmmDemoContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AmmDemoProvider = ({ children }: { children: ReactNode }) => {
    const { walletState } = useWallet();
    const { walletAddress, isConnected } = walletState;
    const { data: walletClient } = useWalletClient();
    const publicClient = useMemo(() => getViemPublicClient(), []);
    const { writeContractAsync } = useWriteContract();
    const { toast } = useToast();
    const { chain } = useAccount();
    const { switchChain } = useSwitchChain();

    const address = walletAddress ? walletAddress as Address : undefined;

    const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
    const [pools, setPools] = useState<DemoPool[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [processingStates, setProcessingStates] = useState<Record<string, boolean>>({});
    const [gasPrice, setGasPrice] = useState<string>('0');
    const [networkStats, setNetworkStats] = useState({ blockNumber: 0, gasLimit: '0' });
    const [tokenBalances, setTokenBalances] = useState<Record<MockTokenSymbol, string>>({ USDT: '0', USDC: '0', WETH: '0' });
    
    const { data: nativeBalance } = useBalance({ address });
    const ethBalance = useMemo(() => nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : '0', [nativeBalance]);

    const setProcessing = (key: string, value: boolean) => {
        setProcessingStates(prev => ({...prev, [key]: value}));
    };
    
    const isProcessing = (key: string) => !!processingStates[key];
    
    const addTransaction = (tx: Omit<DemoTransaction, 'status' | 'timestamp'>) => {
        const newTx: DemoTransaction = { ...tx, status: 'Pending', timestamp: Date.now() };
        setTransactions(prev => [newTx, ...prev]);
    };
    
    const updateTransactionStatus = (id: string, status: DemoTransactionStatus, details?: React.ReactNode, gasUsed?: string, effectiveGasPrice?: string) => {
        setTransactions(prev => prev.map(tx => 
            tx.id === id ? { ...tx, status, details: details || tx.details, gasUsed, effectiveGasPrice } : tx
        ));
    };

    const fetchNetworkStats = useCallback(async () => {
        if (!publicClient) return;
        try {
            const [blockNumberResult, gasPriceResult] = await Promise.all([
                publicClient.getBlockNumber(),
                publicClient.getGasPrice()
            ]);
            setGasPrice(formatUnits(gasPriceResult, 9));
            setNetworkStats({
                blockNumber: Number(blockNumberResult),
                gasLimit: '15000000'
            });
        } catch (e) {
            console.error("Failed to fetch network stats", e);
        }
    }, [publicClient]);

    const executeTransaction = async (
        type: DemoTransactionType,
        details: React.ReactNode,
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
            
            const receipt = await Promise.race([
                publicClient.waitForTransactionReceipt({ hash: txHash }),
                new Promise<any>((_, reject) => 
                    setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
                )
            ]);
            
            if (receipt.status === 'success') {
                updateTransactionStatus(txHash, 'Completed', undefined, receipt.gasUsed?.toString(), receipt.effectiveGasPrice?.toString());
                toast({ title: "Transaction Successful", description: `${type} transaction confirmed.` });
                if (onSuccess) await onSuccess(txHash);
            } else {
                updateTransactionStatus(txHash, 'Failed', 'Transaction reverted');
                toast({ variant: "destructive", title: "Transaction Failed", description: 'The transaction was reverted.' });
            }
        } catch (e: any) {
            console.error(`❌ ${type} failed:`, e);
            const errorMessage = e.message || "Unknown error";
            updateTransactionStatus(tempTxId, 'Failed', errorMessage);
            
            if (errorMessage.includes('timeout')) {
                toast({ 
                    variant: "destructive", 
                    title: "Transaction Timeout", 
                    description: "The transaction is taking too long to confirm. Please check the transaction status on Etherscan." 
                });
            } else {
                toast({ variant: "destructive", title: "Transaction Error", description: errorMessage });
            }
        } finally {
            setProcessing(processingKey, false);
        }
    };

    const fetchAmmBalances = useCallback(async () => {
        if (!address || !publicClient) return;
        const newBalances: Record<MockTokenSymbol, string> = { USDT: '0', USDC: '0', WETH: '0' };
        
        for (const symbol in MOCK_TOKENS) {
            const token = MOCK_TOKENS[symbol as MockTokenSymbol];
            try {
                const balance = await publicClient.readContract({
                    address: token.address,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [address as Address],
                });
                newBalances[symbol as MockTokenSymbol] = formatUnits(balance, token.decimals);
            } catch (e) {
                console.error(`Failed to fetch balance for ${symbol}`, e);
            }
        }
        setTokenBalances(newBalances);
    }, [address, publicClient]);

    const findSymbolByAddress = (addr: Address): MockTokenSymbol | undefined => 
        (Object.keys(MOCK_TOKENS) as MockTokenSymbol[]).find(symbol => MOCK_TOKENS[symbol].address.toLowerCase() === addr.toLowerCase());
    
        const fetchPoolDetails = useCallback(async (poolId: number, poolAddress: Address): Promise<DemoPool | null> => {
            if (!publicClient) return null;
            
            try {
                const pool = await publicClient.readContract({
                    address: AMM_CONTRACT_ADDRESS,
                    abi: AMM_ABI,
                    functionName: 'pools',
                    args: [BigInt(poolId)]
                });
        
                const tokenA_addr = pool.tokenA;
                const tokenB_addr = pool.tokenB;

                const symbolA = findSymbolByAddress(tokenA_addr);
                const symbolB = findSymbolByAddress(tokenB_addr);
                
                if (!symbolA || !symbolB) {
                    console.warn(`Unknown tokens in pool: tokenA=${tokenA_addr}, tokenB=${tokenB_addr}`);
                    return null;
                }
                
                const tokenAInfo = MOCK_TOKENS[symbolA];
                const tokenBInfo = MOCK_TOKENS[symbolB];
                
                const [reserves, feeRate, lpTotalSupply] = await Promise.all([
                    publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getReserves', args: [BigInt(poolId)] }),
                    publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getCurrentFee', args: [BigInt(poolId)] }),
                    publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'totalSupply' })
                ]);
                
                const [reserveA, reserveB] = reserves;
    
                const volume24h = (Math.random() * 10000).toFixed(2);
                const fees24h = (parseFloat(volume24h) * (Number(feeRate) / 10000)).toFixed(2); // fee is in bps
                const apy = (Math.random() * 20 + 5);
                
                let userLpBalance = '0';
                let userShare = 0;
                if (address) {
                    try {
                        const balance = await publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'balanceOf', args: [address] });
                        userLpBalance = formatUnits(balance, 18);
                        if (lpTotalSupply > 0) {
                            userShare = (Number(userLpBalance) / Number(formatUnits(lpTotalSupply, 18))) * 100;
                        }
                    } catch (e) {
                        console.error("Failed to fetch user LP balance for pool " + poolAddress, e);
                    }
                }
                
                return {
                    address: poolAddress, id: poolId, name: `${symbolA}/${symbolB}`,
                    tokenA: { address: tokenA_addr, symbol: symbolA, decimals: tokenAInfo.decimals },
                    tokenB: { address: tokenB_addr, symbol: symbolB, decimals: tokenBInfo.decimals },
                    reserveA: formatUnits(reserveA, tokenAInfo.decimals),
                    reserveB: formatUnits(reserveB, tokenBInfo.decimals),
                    totalLiquidity: formatUnits(lpTotalSupply, 18),
                    feeRate: Number(feeRate) / 100, // fee is in bps
                    volume24h, fees24h, apy, userLpBalance, userShare
                };
            } catch (e) {
                console.error(`Failed to fetch pool details for pool ID ${poolId} at ${poolAddress}`, e);
                return null;
            }
        }, [publicClient, address]);
    
    const fetchPools = useCallback(async () => {
        if (!publicClient) return;
        try {
            const poolCount = Number(await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getPoolCount' }));
            
            if (poolCount === 0) {
                setPools([]);
                return;
            }
            
            const poolDetailsPromises: Promise<DemoPool | null>[] = [];
            for (let i = 0; i < poolCount; i++) {
                const poolAddress = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'pools', args: [BigInt(i)] });
                poolDetailsPromises.push(fetchPoolDetails(i, poolAddress));
            }
            const poolDetails = await Promise.all(poolDetailsPromises);
            const validPools = poolDetails.filter((p): p is DemoPool => p !== null);
            setPools(validPools);
        } catch (e) {
            console.error("Failed to fetch pools:", e);
            setPools([]);
        }
    }, [publicClient, fetchPoolDetails]);
    
    const fetchPoolByTokens = useCallback(async (tokenA: Address, tokenB: Address): Promise<DemoPool | null> => {
        if (!publicClient) return null;
        try {
            const poolAddress = await publicClient.readContract({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'getPool',
                args: [tokenA, tokenB]
            });
            if (poolAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') return null;

            // To get the pool ID, we have to iterate
            const poolCount = Number(await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getPoolCount' }));
            for (let i = 0; i < poolCount; i++) {
                const addr = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'pools', args: [BigInt(i)] });
                if (addr.toLowerCase() === poolAddress.toLowerCase()) {
                    return await fetchPoolDetails(i, poolAddress);
                }
            }
            return null;
        } catch (e) {
            console.error("Failed to fetch pool by tokens", e);
            return null;
        }
    }, [publicClient, fetchPoolDetails]);

    useEffect(() => {
        if(!isConnected) return;
        fetchPools();
        fetchAmmBalances();
        fetchNetworkStats();
        const interval = setInterval(() => {
            fetchAmmBalances();
            fetchNetworkStats();
        }, 15000);
        return () => clearInterval(interval);
    }, [isConnected, fetchAmmBalances, fetchPools, fetchNetworkStats]);
    
    const createPool = useCallback(async (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => {
        const tokenAInfo = MOCK_TOKENS[tokenA];
        const tokenBInfo = MOCK_TOKENS[tokenB];
    
        const existingPool = await fetchPoolByTokens(tokenAInfo.address, tokenBInfo.address);
        if (existingPool) {
            toast({ variant: "destructive", title: "Pool Already Exists" });
            return;
        }
    
        await executeTransaction('Create Pool', `Creating pool for ${tokenA}/${tokenB}`, `CreatePool_${tokenA}_${tokenB}`,
            () => writeContractAsync({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'createPool', args: [tokenAInfo.address, tokenBInfo.address] }),
            async (txHash) => {
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for state to update
                const newPool = await fetchPoolByTokens(tokenAInfo.address, tokenBInfo.address);
                if (newPool) {
                    setPools(prev => [...prev, newPool]);
                } else {
                    await fetchPools(); // Fallback to fetching all pools
                }
            }
        );
    }, [writeContractAsync, executeTransaction, fetchPoolByTokens, fetchPools, toast]);

    const getFaucetTokens = useCallback(async (token: MockTokenSymbol) => {
        const tokenInfo = MOCK_TOKENS[token];
        const amount = parseUnits('1000', tokenInfo.decimals);
        await executeTransaction('Faucet', `Minting 1,000 ${token}`, `Faucet_${token}`,
            () => writeContractAsync({ address: tokenInfo.address, abi: ERC20_ABI, functionName: 'mint', args: [address as Address, amount] }),
            fetchAmmBalances
        );
    }, [address, writeContractAsync, fetchAmmBalances, executeTransaction]);
    
    const approveToken = useCallback(async (token: MockTokenSymbol, amount: string, spender: Address = AMM_CONTRACT_ADDRESS) => {
        const tokenInfo = MOCK_TOKENS[token];
        const onChainAmount = parseUnits(amount, tokenInfo.decimals);
        await executeTransaction('Approve', `Approving ${amount} ${token}`, `Approve_${token}_${spender}`,
            () => writeContractAsync({ address: tokenInfo.address, abi: ERC20_ABI, functionName: 'approve', args: [spender, onChainAmount] }),
        );
    }, [writeContractAsync, executeTransaction]);
    
    const submitFeePrediction = useCallback(async (poolAddress: Address, fee: number, confidence: number) => {
       toast({variant: 'destructive', title: 'Not Implemented', description: 'This feature is not yet connected to the new contracts.'});
    }, [toast]);

    const registerOracleProvider = useCallback(async () => {
        await executeTransaction('Register Provider', `Registering as an AI Oracle provider`, `RegisterProvider`,
            () => writeContractAsync({ address: AI_ORACLE_ADDRESS, abi: AI_ORACLE_ABI, functionName: 'registerAsProvider', value: parseEther('0.1') })
        );
    }, [executeTransaction, writeContractAsync]);
    
    const addLiquidity = useCallback(async (poolId: number, amountA: string, amountB: string) => {
        const pool = pools.find(p => p.id === poolId);
         if (!pool || !address) return;
         
        await approveToken(pool.tokenA.symbol, amountA, AMM_CONTRACT_ADDRESS);
        await approveToken(pool.tokenB.symbol, amountB, AMM_CONTRACT_ADDRESS);
         
        await executeTransaction('Add Liquidity', `Adding liquidity to ${pool.name}`, `AddLiquidity_${pool.address}`,
             () => writeContractAsync({
                 address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'addLiquidity',
                 args: [
                     BigInt(poolId),
                     parseUnits(amountA, pool.tokenA.decimals), parseUnits(amountB, pool.tokenB.decimals),
                 ]
             }),
             fetchPools
         );
     }, [pools, address, approveToken, executeTransaction, writeContractAsync, fetchPools]);
    
    const removeLiquidity = useCallback(async (poolId: number, lpAmount: string) => {
        const pool = pools.find(p => p.id === poolId);
        if (!pool || !address) return;
        
        await executeTransaction('Remove Liquidity', `Removing liquidity from ${pool.name}`, `RemoveLiquidity_${pool.address}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'removeLiquidity',
                args: [
                    BigInt(poolId),
                    parseUnits(lpAmount, 18),
                ]
            }),
            fetchPools
        );
    }, [pools, address, executeTransaction, writeContractAsync, fetchPools]);
    
    const swap = useCallback(async (poolId: number, tokenIn: MockTokenSymbol, amountIn: string) => {
        const tokenInInfo = MOCK_TOKENS[tokenIn];
        if (!address || !publicClient) return;

        const onChainAmountIn = parseUnits(amountIn, tokenInInfo.decimals);
        const allowance = await publicClient.readContract({ address: tokenInInfo.address, abi: ERC20_ABI, functionName: 'allowance', args: [address, AMM_CONTRACT_ADDRESS]});

        if (allowance < onChainAmountIn) {
            await approveToken(tokenIn, '1000000', AMM_CONTRACT_ADDRESS); // Approve a large amount
        }
        
        await executeTransaction('Swap', `Swapping ${amountIn} ${tokenIn}`, `Swap_${tokenIn}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'swap',
                args: [ BigInt(poolId), tokenInInfo.address, onChainAmountIn ]
            }),
            async () => { await fetchAmmBalances(); await fetchPools(); }
        );
    }, [address, publicClient, executeTransaction, writeContractAsync, fetchAmmBalances, fetchPools, approveToken]);

    const send = useCallback(async (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => {
        if (!walletClient || !publicClient || !address) {
            toast({ variant: "destructive", title: "Wallet Not Connected" }); return;
        }
        if (chain?.id !== 11155111 && switchChain) {
            await switchChain({ chainId: 11155111 }); return;
        }
        await executeTransaction('Send', `Sending ${amount} ${token}`, `Send_${token}_${amount}`,
            async () => {
                if (token === 'ETH') {
                    return walletClient.sendTransaction({ to: recipient, value: parseEther(amount), gas: 21000n });
                } else {
                    const tokenInfo = MOCK_TOKENS[token];
                    return writeContractAsync({ address: tokenInfo.address, abi: ERC20_ABI, functionName: 'transfer', args: [recipient, parseUnits(amount, tokenInfo.decimals)] });
                }
            },
            fetchAmmBalances
        );
    }, [walletClient, publicClient, address, chain, switchChain, writeContractAsync, executeTransaction, fetchAmmBalances, toast]);
    
    const refreshData = useCallback(async () => {
        setProcessing('refresh', true);
        await Promise.all([ fetchAmmBalances(), fetchPools(), fetchNetworkStats() ]);
        setProcessing('refresh', false);
    }, [fetchAmmBalances, fetchPools, fetchNetworkStats]);
    
    const state: AmmDemoState = { 
        transactions, pools, predictions, processingStates, isProcessing, gasPrice, networkStats,
        tokenBalances, ethBalance, isConnected, address
    };
    
    const actions: AmmDemoActions = { 
        getFaucetTokens, approveToken, submitFeePrediction, createPool, addLiquidity,
        removeLiquidity, swap, send, refreshData, registerOracleProvider
    };
    
    return <AmmDemoContext.Provider value={{ state, actions }}>{children}</AmmDemoContext.Provider>;
};

export const useAmmDemo = (): AmmDemoContextType => {
    const context = useContext(AmmDemoContext);
    if (context === undefined) { throw new Error('useAmmDemo must be used within an AmmDemoProvider'); }
    return context;
};
