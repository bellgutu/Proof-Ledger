
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
    'USDT': { address: '0x17a6036513bB60369e5246164Cb918973dF902BD' as Address, name: 'Mock USDT', decimals: 6 },
    'USDC': { address: '0x09d011D52413DC89DFe3fa64694d67451ee49Cef' as Address, name: 'Mock USDC', decimals_DONOTUSE: 6, decimals: 6 },
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
    "event PoolCreated(address indexed pool, address indexed tokenA, address indexed tokenB)"
]);

const AMM_POOL_ABI = parseAbi([
    "function tokenA() external view returns (address)",
    "function tokenB() external view returns (address)",
    "function getReserves() external view returns (uint112 reserveA, uint112 reserveB)",
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
    swap: (fromToken: MockTokenSymbol, toToken: MockTokenSymbol, amountIn: string, minAmountOut: string) => Promise<void>;
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

    const fetchPoolDetails = useCallback(async (poolAddress: Address, poolId: number): Promise<DemoPool | null> => {
        if (!publicClient) return null;
        try {
            const [tokenA_addr, tokenB_addr] = await Promise.all([
                publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'tokenA' }),
                publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'tokenB' })
            ]);

            const symbolA = findSymbolByAddress(tokenA_addr);
            const symbolB = findSymbolByAddress(tokenB_addr);

            if (!symbolA || !symbolB) return null;

            const tokenAInfo = MOCK_TOKENS[symbolA];
            const tokenBInfo = MOCK_TOKENS[symbolB];

            const [[reserveA, reserveB], totalSupply] = await Promise.all([
                publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'getReserves' }),
                publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'totalSupply' })
            ]);
            
            const feeRate = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getCurrentFee', args: [BigInt(poolId)] });

            const volume24h = (Math.random() * 10000).toFixed(2);
            const fees24h = (parseFloat(volume24h) * (Number(feeRate) / 10000)).toFixed(2);
            const apy = (Math.random() * 20 + 5);

            let userLpBalance = '0';
            let userShare = 0;
            if (address) {
                const balance = await publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'balanceOf', args: [address] });
                userLpBalance = formatUnits(balance, 18);
                if (totalSupply > 0) {
                    userShare = (Number(userLpBalance) / Number(formatUnits(totalSupply, 18))) * 100;
                }
            }

            return {
                address: poolAddress, id: poolId, name: `${symbolA}/${symbolB}`,
                tokenA: { address: tokenA_addr, symbol: symbolA, decimals: tokenAInfo.decimals },
                tokenB: { address: tokenB_addr, symbol: symbolB, decimals: tokenBInfo.decimals },
                reserveA: formatUnits(reserveA, tokenAInfo.decimals),
                reserveB: formatUnits(reserveB, tokenBInfo.decimals),
                totalLiquidity: formatUnits(totalSupply, 18),
                feeRate: Number(feeRate) / 100,
                volume24h, fees24h, apy, userLpBalance, userShare
            };
        } catch (e) {
            console.error(`Failed to fetch pool details for ${poolAddress}`, e);
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
            const poolDetailsPromises = [];
            for (let i = 0; i < poolCount; i++) {
                const poolAddress = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'pools', args: [BigInt(i)] });
                poolDetailsPromises.push(fetchPoolDetails(poolAddress, i));
            }
            const resolvedPools = await Promise.all(poolDetailsPromises);
            setPools(resolvedPools.filter((p): p is DemoPool => p !== null));
        } catch (e) {
            console.error("Failed to fetch pools:", e);
            setPools([]);
        }
    }, [publicClient, fetchPoolDetails]);
    
    const fetchPoolByTokens = useCallback(async (tokenA: Address, tokenB: Address): Promise<DemoPool | null> => {
        if (!publicClient) return null;
        try {
            const poolAddress = await publicClient.readContract({
                address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getPool',
                args: [tokenA, tokenB]
            });
            if (poolAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') return null;

            const poolCount = Number(await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getPoolCount' }));
            for (let i = 0; i < poolCount; i++) {
                const addr = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'pools', args: [BigInt(i)] });
                if (addr.toLowerCase() === poolAddress.toLowerCase()) {
                    return await fetchPoolDetails(poolAddress, i);
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
    
        await executeTransaction('Create Pool', `Creating pool for ${tokenA}/${tokenB}`, `CreatePool_${tokenA}_${tokenB}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI,
                functionName: 'createPool', args: [tokenAInfo.address, tokenBInfo.address]
            }),
            async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await fetchPools();
            }
        );
    }, [writeContractAsync, executeTransaction, fetchPools]);

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
        
        const amountAWei = parseUnits(amountA, pool.tokenA.decimals);
        const amountBWei = parseUnits(amountB, pool.tokenB.decimals);

        await approveToken(pool.tokenA.symbol, amountA, AMM_CONTRACT_ADDRESS);
        await approveToken(pool.tokenB.symbol, amountB, AMM_CONTRACT_ADDRESS);
         
        await executeTransaction('Add Liquidity', `Adding liquidity to ${pool.name}`, `AddLiquidity_${pool.address}`,
             () => writeContractAsync({
                 address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'addLiquidity',
                 args: [ BigInt(poolId), amountAWei, amountBWei ]
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
                args: [ BigInt(poolId), parseUnits(lpAmount, 18) ]
            }),
            fetchPools
        );
    }, [pools, address, executeTransaction, writeContractAsync, fetchPools]);
    
    const swap = useCallback(async (fromToken: MockTokenSymbol, toToken: MockTokenSymbol, amountIn: string, minAmountOut: string) => {
        const pool = pools.find(p => (p.tokenA.symbol === fromToken && p.tokenB.symbol === toToken) || (p.tokenA.symbol === toToken && p.tokenB.symbol === fromToken));
        if (!pool) {
            toast({ variant: 'destructive', title: 'No Pool Found', description: `No liquidity pool available for ${fromToken}/${toToken}.` });
            return;
        }

        const tokenInInfo = MOCK_TOKENS[fromToken];
        if (!address || !publicClient) return;

        const onChainAmountIn = parseUnits(amountIn, tokenInInfo.decimals);
        const allowance = await publicClient.readContract({ address: tokenInInfo.address, abi: ERC20_ABI, functionName: 'allowance', args: [address, AMM_CONTRACT_ADDRESS]});

        if (allowance < onChainAmountIn) {
            await approveToken(fromToken, '1000000000', AMM_CONTRACT_ADDRESS); // Approve a large amount
        }
        
        await executeTransaction('Swap', `Swapping ${amountIn} ${fromToken}`, `Swap_${fromToken}_${toToken}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'swap',
                args: [ BigInt(pool.id), MOCK_TOKENS[fromToken].address, onChainAmountIn ]
            }),
            async () => { await fetchAmmBalances(); await fetchPools(); }
        );
    }, [address, publicClient, pools, executeTransaction, writeContractAsync, fetchAmmBalances, fetchPools, approveToken, toast]);

    const send = useCallback(async (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => {
        if (!walletClient || !publicClient || !address) {
            toast({ variant: "destructive", title: "Wallet Not Connected", description: "Please connect your wallet first." });
            return;
        }
        if (chain?.id !== 11155111 && switchChain) {
            toast({ variant: "destructive", title: "Wrong Network", description: "Please switch to Sepolia testnet." });
            await switchChain({ chainId: 11155111 });
            return;
        }
    
        const details = `Sending ${amount} ${token} to ${recipient.slice(0, 6)}...`;
        
        try {
            const txFunction = async (): Promise<Address> => {
                if (token === 'ETH') {
                    const balance = await publicClient.getBalance({ address });
                    const value = parseEther(amount);
                    if (balance < value) throw new Error("Insufficient ETH balance.");
                    return walletClient.sendTransaction({ to: recipient, value, gas: 21000n });
                } else {
                    const tokenInfo = MOCK_TOKENS[token];
                    const onChainAmount = parseUnits(amount, tokenInfo.decimals);
                    const tokenBalance = await publicClient.readContract({
                        address: tokenInfo.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address]
                    });
                    if (tokenBalance < onChainAmount) throw new Error(`Insufficient ${token} balance.`);
                    return writeContractAsync({
                        address: tokenInfo.address, abi: ERC20_ABI, functionName: 'transfer', args: [recipient, onChainAmount]
                    });
                }
            };
    
            await executeTransaction('Send', details, `Send_${token}_${amount}`, txFunction, fetchAmmBalances);
        } catch (error: any) {
            console.error("Send error:", error);
            toast({ variant: "destructive", title: "Send Failed", description: error.message || "Failed to send transaction" });
        }
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

    