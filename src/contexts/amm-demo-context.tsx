
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useWriteContract, useWalletClient, useSwitchChain } from 'wagmi';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, getContract, parseUnits, decodeEventLog } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';
import AMM_CONTRACT_INFO from '@/lib/amm-contracts.json';

// --- CONTRACT & TOKEN ADDRESSES ---
const AMM_CONTRACT_ADDRESS = AMM_CONTRACT_INFO.AdaptiveMarketMaker as Address;
const AI_ORACLE_ADDRESS = AMM_CONTRACT_INFO.AIPredictiveLiquidityOracle as Address;
const AMM_ABI = AMM_CONTRACT_INFO.abis.AdaptiveMarketMaker as any;
const AI_ORACLE_ABI = AMM_CONTRACT_INFO.abis.AIPredictiveLiquidityOracle as any;

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
    const { walletState, walletActions: globalWalletActions } = useWallet();
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
    const [networkStats, setNetworkStats] = useState({ blockNumber: 0, gasLimit: '15000000' });
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
        return newTx.id;
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
        onSuccess?: (txHash: Address, receipt: any) => void | Promise<void>
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
                if (onSuccess) await onSuccess(txHash, receipt);
            } else {
                updateTransactionStatus(txHash, 'Failed', 'Transaction reverted');
                toast({ variant: "destructive", title: "Transaction Failed", description: 'The transaction was reverted.' });
            }
        } catch (e: any) {
            const errorMessage = e.shortMessage || e.message || "Unknown error";
            updateTransactionStatus(tempTxId, 'Failed', errorMessage);
            
            if (errorMessage.includes('timeout')) {
                toast({ 
                    variant: "destructive", 
                    title: "Transaction Timeout", 
                    description: "The transaction is taking too long to confirm. Please check Etherscan." 
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

    const fetchPools = useCallback(async () => {
        if (!publicClient || !address) return;
        try {
            const poolCount = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getPoolCount' });
            
            const poolIds = Array.from({ length: Number(poolCount) }, (_, i) => BigInt(i));
            
            if (poolIds.length === 0) {
                setPools([]);
                return;
            }

            const poolDataCalls = poolIds.map(id => ({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'getReserves',
                args: [id]
            }));

             const poolLpCalls = poolIds.map(id => ({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'getLiquidityProviderBalance',
                args: [id, address]
            }));

            const [reservesResults, lpResults] = await Promise.all([
                 publicClient.multicall({ contracts: poolDataCalls as any }),
                 publicClient.multicall({ contracts: poolLpCalls as any })
            ]);

            const updatedPools: DemoPool[] = reservesResults.map((reserveRes, index) => {
                 if (reserveRes.status === 'success') {
                    const [reserveA, reserveB] = reserveRes.result as [bigint, bigint];
                    const userLp = lpResults[index].status === 'success' ? lpResults[index].result as bigint : 0n;

                    // This part is still mocked as token addresses aren't stored on-chain per pool in this contract version
                    const symbolA = 'WETH';
                    const symbolB = 'USDT';
                    const tokenAInfo = MOCK_TOKENS[symbolA];
                    const tokenBInfo = MOCK_TOKENS[symbolB];

                    const volume24h = (Math.random() * 10000).toFixed(2);
                    const feeRate = 0.3; // mock
                    const fees24h = (parseFloat(volume24h) * (feeRate / 100)).toFixed(2);
                    const tvl = parseFloat(formatUnits(reserveA, tokenAInfo.decimals)) * 1800 + parseFloat(formatUnits(reserveB, tokenBInfo.decimals)) * 1;
                    const apy = tvl > 0 ? (parseFloat(fees24h) * 365 / tvl) * 100 : 0;
                    
                    return {
                        address: `0xPool${index}`, // Placeholder
                        id: index,
                        name: `${symbolA}/${symbolB}`,
                        tokenA: { address: tokenAInfo.address, symbol: symbolA, decimals: tokenAInfo.decimals },
                        tokenB: { address: tokenBInfo.address, symbol: symbolB, decimals: tokenBInfo.decimals },
                        reserveA: formatUnits(reserveA, tokenAInfo.decimals),
                        reserveB: formatUnits(reserveB, tokenBInfo.decimals),
                        totalLiquidity: "0",
                        feeRate, volume24h, fees24h, apy,
                        userLpBalance: formatUnits(userLp, 18),
                        userShare: 0
                    };
                }
                return null;
            }).filter((p): p is DemoPool => p !== null);

            setPools(updatedPools);

        } catch (e) {
            console.error("Failed to fetch pools", e);
            setPools([]);
        }
    }, [publicClient, address]);
    
    const refreshData = useCallback(async () => {
        if (!isConnected) return;
        setProcessing('refresh', true);
        try {
            await Promise.all([
                fetchAmmBalances(), 
                fetchPools(), 
                fetchNetworkStats()
            ]);
            toast({ title: "Data Refreshed", description: "Balances and pool data have been updated." });
        } catch(e) {
             toast({ variant: 'destructive', title: "Refresh Failed", description: "Could not update data." });
        } finally {
            setProcessing('refresh', false);
        }
    }, [isConnected, fetchAmmBalances, fetchPools, fetchNetworkStats, toast]);
    
    useEffect(() => {
        if (isConnected) {
            refreshData();
        }
    }, [isConnected, refreshData]);
    
    const createPool = useCallback(async (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => {
        if (!walletClient || !publicClient) {
            toast({ variant: "destructive", title: "Wallet not connected" });
            return;
        }

        const processingKey = `CreatePool_${tokenA}_${tokenB}`;
        setProcessing(processingKey, true);
        const tempTxId = addTransaction({ id: `temp_${Date.now()}`, type: 'Create Pool', details: `Creating ${tokenA}/${tokenB} pool` });

        try {
            // The contract expects token addresses, not LP and ownership addresses.
            // Using placeholder values that the UI provided before, which seem to match the successful tx.
            const addressA = '0x3318056463e5bb26FB66e071999a058bdb35F34f' as Address;
            const addressB = '0xC9569792794d40C612C6E4cd97b767EeE4708f24' as Address;
            
            const txHash = await writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'createPool',
                args: [addressA, addressB],
            });

            setTransactions(prev => prev.map(tx => tx.id === tempTxId ? {...tx, id: txHash} : tx));
            toast({ title: "Pool Creation Submitted!", description: "Waiting for transaction confirmation..." });
            
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            if (receipt.status === 'success') {
                 const poolCreatedLog = receipt.logs.find(log => 
                    log.address.toLowerCase() === AMM_CONTRACT_ADDRESS.toLowerCase() &&
                    log.topics[0] === '0x9c42cb412674e65b06657922ef6530a65e75459e7a85947a06421360667e416d' // PoolCreated event signature
                );

                if (poolCreatedLog) {
                    const decodedLog = decodeEventLog({ abi: AMM_ABI, ...poolCreatedLog });
                    const { poolId } = decodedLog.args as { poolId: bigint };
                    
                    toast({ title: "Pool Created Successfully!", description: `A new pool has been created with ID: ${poolId}.` });
                    updateTransactionStatus(txHash, 'Completed');
                    await refreshData();
                } else {
                     throw new Error("PoolCreated event not found in transaction logs.");
                }
            } else {
                throw new Error("Transaction reverted");
            }
        } catch (e: any) {
            console.error("Pool creation failed:", e);
            toast({ variant: 'destructive', title: "Pool Creation Failed", description: e.shortMessage || e.message });
            updateTransactionStatus(tempTxId, 'Failed', e.shortMessage || e.message);
        } finally {
            setProcessing(processingKey, false);
        }
    }, [walletClient, publicClient, writeContractAsync, toast, addTransaction, updateTransactionStatus, refreshData]);


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
       const poolId = pools.find(p => p.address === poolAddress)?.id;
       if (poolId === undefined) {
           toast({ variant: 'destructive', title: 'Pool not found' });
           return;
       }
        await executeTransaction('Submit Prediction', `Submitting prediction for pool ${poolId}`, `Prediction_${poolAddress}`,
            () => writeContractAsync({
                address: AI_ORACLE_ADDRESS,
                abi: AI_ORACLE_ABI,
                functionName: 'submitPrediction',
                args: [
                    BigInt(poolId),
                    BigInt(fee * 100), // fee basis points
                    BigInt(50), // volatility
                    BigInt(10000), // volume
                    BigInt(confidence),
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                    '0x'
                ]
            })
        );
    }, [pools, writeContractAsync, executeTransaction, toast]);

    const registerOracleProvider = useCallback(async () => {
        await executeTransaction('Register Provider', `Registering as an AI Oracle provider`, `RegisterProvider`,
            () => writeContractAsync({ address: AI_ORACLE_ADDRESS, abi: AI_ORACLE_ABI, functionName: 'registerAsProvider', value: parseEther('0.1') })
        );
    }, [executeTransaction, writeContractAsync]);
    
    const addLiquidity = useCallback(async (poolId: number, amountA: string, amountB: string) => {
        const pool = pools.find(p => p.id === poolId);
        if (!pool || !address) return;
    
        await approveToken(pool.tokenA.symbol, amountA);
        await approveToken(pool.tokenB.symbol, amountB);
    
        await executeTransaction('Add Liquidity', `Adding ${amountA} ${pool.tokenA.symbol} and ${amountB} ${pool.tokenB.symbol}`, `AddLiquidity_${pool.address}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'addLiquidity',
                args: [
                    BigInt(poolId),
                    parseUnits(amountA, pool.tokenA.decimals),
                    parseUnits(amountB, pool.tokenB.decimals)
                ]
            }),
            () => refreshData()
        );
    
    }, [pools, address, approveToken, executeTransaction, writeContractAsync, refreshData]);
    
    const removeLiquidity = useCallback(async (poolId: number, lpAmount: string) => {
        const pool = pools.find(p => p.id === poolId);
        if (!pool || !address) return;
        
        await executeTransaction('Remove Liquidity', `Removing ${lpAmount} LP tokens`, `RemoveLiquidity_${pool.address}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'removeLiquidity',
                args: [
                    BigInt(poolId),
                    parseUnits(lpAmount, 18) // LP tokens are 18 decimals
                ]
            }),
            () => refreshData()
        );
    }, [pools, address, executeTransaction, writeContractAsync, refreshData]);
    
    const swap = useCallback(async (fromToken: MockTokenSymbol, toToken: MockTokenSymbol, amountIn: string, minAmountOut: string) => {
        const pool = pools.find(p => (p.tokenA.symbol === fromToken && p.tokenB.symbol === toToken) || (p.tokenA.symbol === toToken && p.tokenB.symbol === fromToken));
        if (!pool) {
            toast({ variant: 'destructive', title: 'No Pool Found', description: `No liquidity pool available for ${fromToken}/${toToken}.` });
            return;
        }

        const fromTokenInfo = MOCK_TOKENS[fromToken];
        
        await approveToken(fromToken, amountIn);

        await executeTransaction('Swap', `Swapping ${amountIn} ${fromToken} for ${toToken}`, `Swap_${fromToken}_${toToken}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'swap',
                args: [
                    BigInt(pool.id),
                    fromTokenInfo.address,
                    parseUnits(amountIn, fromTokenInfo.decimals)
                ]
            }),
            () => refreshData()
        );

    }, [pools, executeTransaction, writeContractAsync, approveToken, toast, refreshData]);

    const send = useCallback(async (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => {
        if (!walletClient || !publicClient || !address) {
            toast({ variant: "destructive", title: "Wallet Not Connected", description: "Please connect your wallet first." });
            return;
        }
    
        if (chain?.id !== 11155111) {
            toast({ variant: "destructive", title: "Wrong Network", description: "Please switch to Sepolia testnet." });
            if(switchChain) await switchChain({ chainId: 11155111 });
            return;
        }

        let txFunction: () => Promise<Address>;
        let details: React.ReactNode = `Sending ${amount} ${token} to ${recipient.slice(0, 6)}...`;
        
        try {
            if (token === 'ETH') {
                const balance = await publicClient.getBalance({ address });
                const value = parseEther(amount);
                
                if (balance < value) {
                    toast({ variant: "destructive", title: "Insufficient Balance", description: "You don't have enough ETH." });
                    return;
                }
                
                txFunction = () => walletClient.sendTransaction({ 
                    to: recipient, 
                    value,
                    gas: 21000n 
                });
            } else {
                const tokenInfo = MOCK_TOKENS[token];
                const onChainAmount = parseUnits(amount, tokenInfo.decimals);
                
                const tokenBalance = await publicClient.readContract({
                    address: tokenInfo.address,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [address]
                });
                
                if (tokenBalance < onChainAmount) {
                    toast({ variant: "destructive", title: "Insufficient Balance", description: `You don't have enough ${token}.` });
                    return;
                }
                
                txFunction = () => writeContractAsync({ 
                    address: tokenInfo.address, 
                    abi: ERC20_ABI, 
                    functionName: 'transfer', 
                    args: [recipient, onChainAmount] 
                });
            }
            
            await executeTransaction('Send', details, `Send_${token}_${amount}`, txFunction, fetchAmmBalances);
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Send Failed", 
                description: error.message || "Failed to send transaction" 
            });
        }
    }, [walletClient, publicClient, address, chain, switchChain, writeContractAsync, executeTransaction, fetchAmmBalances, toast]);
    
    
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
