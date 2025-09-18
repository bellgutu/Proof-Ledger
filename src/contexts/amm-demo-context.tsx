
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useSwitchChain, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, formatEther, getContract, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';

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
export type DemoTransactionType = 'Faucet' | 'Approve' | 'Add Liquidity' | 'Create Pool' | 'Submit Prediction' | 'Swap' | 'Remove Liquidity' | 'Send';
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
    disconnectWallet: () => void;
    getFaucetTokens: (token: MockTokenSymbol) => Promise<void>;
    approveToken: (token: MockTokenSymbol, amount: string, spender?: Address) => Promise<void>;
    submitFeePrediction: (poolAddress: Address, fee: number, confidence: number) => Promise<void>;
    createPool: (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => Promise<void>;
    addLiquidity: (poolAddress: Address, amountA: string, amountB: string) => Promise<void>;
    removeLiquidity: (poolAddress: Address, lpAmount: string) => Promise<void>;
    swap: (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string, minAmountOut: string) => Promise<void>;
    send: (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => Promise<void>;
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
    const { disconnect } = useDisconnect();
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
    
    const updateTransactionStatus = (id: string, status: DemoTransactionStatus, details?: React.ReactNode, gasUsed?: string, effectiveGasPrice?: string) => {
        setTransactions(prev => prev.map(tx => 
            tx.id === id ? { ...tx, status, details: details || tx.details, gasUsed, effectiveGasPrice } : tx
        ));
    };

    const fetchNetworkStats = useCallback(async () => {
        if (!publicClient) return;
        try {
            const [blockNumber, gasPriceResult] = await Promise.all([
                publicClient.getBlockNumber(),
                publicClient.getGasPrice()
            ]);
            setGasPrice(formatUnits(gasPriceResult, 9));
            setNetworkStats({
                blockNumber: Number(blockNumber),
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
            
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            
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
            updateTransactionStatus(tempTxId, 'Failed', e.shortMessage || e.message);
            toast({ variant: "destructive", title: "Transaction Error", description: e.shortMessage || e.message });
        } finally {
            setProcessing(processingKey, false);
        }
    };

    const fetchBalances = useCallback(async () => {
        if (!address || !publicClient) return;
        const newBalances: Record<MockTokenSymbol, string> = { USDT: '0', USDC: '0', WETH: '0' };
        
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
    }, [address, publicClient]);

    const findSymbolByAddress = (addr: Address) => 
        Object.entries(MOCK_TOKENS).find(([_, tokenData]) => 
            tokenData.address.toLowerCase() === addr.toLowerCase()
        )?.[0] as MockTokenSymbol | undefined;


    const fetchPools = useCallback(async () => {
        if (!publicClient) return;
        try {
            const poolCount = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'poolCount' });
            
            const poolAddresses: Address[] = [];
            for (let i = 0; i < Number(poolCount); i++) {
                const poolAddr = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'pools', args: [BigInt(i)] });
                poolAddresses.push(poolAddr);
            }
            
            const poolDetails = await Promise.all(poolAddresses.map(async (addr) => {
                try {
                    const [tokenA_addr, tokenB_addr] = await Promise.all([
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'tokenA'}),
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'tokenB'}),
                    ]);
                    
                    const symbolA = findSymbolByAddress(tokenA_addr);
                    const symbolB = findSymbolByAddress(tokenB_addr);
                    
                    if(!symbolA || !symbolB) return null;

                    const tokenAInfo = MOCK_TOKENS[symbolA];
                    const tokenBInfo = MOCK_TOKENS[symbolB];
                    
                    const [[reserveA, reserveB], totalSupply, feeRate] = await Promise.all([
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'getReserves' }),
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'totalSupply' }),
                        publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'getFee', args: [addr] })
                    ]);
                    
                    const volume24h = (Math.random() * 10000).toFixed(2);
                    const fees24h = (parseFloat(volume24h) * (Number(feeRate) / 10000)).toFixed(2); // fee is in bps
                    const apy = (Math.random() * 20 + 5);
                    
                    let userLpBalance = '0';
                    let userShare = 0;
                    if (address) {
                        try {
                            const balance = await publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'balanceOf', args: [address] });
                            userLpBalance = formatUnits(balance, 18);
                            if (totalSupply > 0) {
                                userShare = (Number(userLpBalance) / Number(formatUnits(totalSupply, 18))) * 100;
                            }
                        } catch (e) {
                             console.error("Failed to fetch user LP balance", e);
                        }
                    }
                    
                    return {
                        address: addr,
                        name: `${symbolA}/${symbolB}`,
                        tokenA: { address: tokenA_addr, symbol: symbolA, decimals: tokenAInfo.decimals },
                        tokenB: { address: tokenB_addr, symbol: symbolB, decimals: tokenBInfo.decimals },
                        reserveA: formatUnits(reserveA, tokenAInfo.decimals),
                        reserveB: formatUnits(reserveB, tokenBInfo.decimals),
                        totalLiquidity: formatUnits(totalSupply, 18),
                        feeRate: Number(feeRate) / 100, // bps to percent
                        volume24h, fees24h, apy, userLpBalance, userShare
                    };
                } catch (e) {
                    console.error("Failed to fetch details for pool", addr, e);
                    return null;
                }
            }));
            
            setPools(poolDetails.filter(p => p !== null) as DemoPool[]);
        } catch (e) {
            console.error("Failed to fetch pools", e);
        }
    }, [publicClient, address]);
    
    useEffect(() => {
        if(!isConnected || !chain || chain.id !== 11155111) return;

        const fetchData = async () => {
            await fetchBalances();
            await fetchPools();
            await fetchNetworkStats();
        }

        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [isConnected, chain, fetchBalances, fetchPools, fetchNetworkStats]);
    
    const connectWallet = () => open();
    const disconnectWallet = () => disconnect();
    
    const getFaucetTokens = useCallback(async (token: MockTokenSymbol) => {
        const tokenInfo = MOCK_TOKENS[token];
        const amount = parseUnits('1000', tokenInfo.decimals);
        await executeTransaction('Faucet', `Minting 1,000 ${token}`, `Faucet_${token}`,
            () => writeContractAsync({ address: tokenInfo.address, abi: ERC20_ABI, functionName: 'mint', args: [address!, amount] }),
            fetchBalances
        );
    }, [address, writeContractAsync, fetchBalances, executeTransaction]);
    
    const approveToken = useCallback(async (token: MockTokenSymbol, amount: string, spender: Address = AMM_CONTRACT_ADDRESS) => {
        const tokenInfo = MOCK_TOKENS[token];
        const onChainAmount = parseUnits(amount, tokenInfo.decimals);
        await executeTransaction('Approve', `Approving ${amount} ${token}`, `Approve_${token}_${spender}`,
            () => writeContractAsync({ address: tokenInfo.address, abi: ERC20_ABI, functionName: 'approve', args: [spender, onChainAmount] }),
        );
    }, [writeContractAsync, executeTransaction]);
    
    const submitFeePrediction = useCallback(async (poolAddress: Address, fee: number, confidence: number) => {
        const feeBps = Math.round(fee * 100); 
        await executeTransaction('Submit Prediction', `Submitting fee prediction for pool ${poolAddress}`, `Prediction_${poolAddress}`,
            () => writeContractAsync({ address: AI_ORACLE_ADDRESS, abi: AI_ORACLE_ABI, functionName: 'submitPrediction', args: [poolAddress, BigInt(feeBps), confidence] })
        );
    }, [writeContractAsync, executeTransaction]);
    
    const createPool = useCallback(async (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => {
        const tokenAInfo = MOCK_TOKENS[tokenA];
        const tokenBInfo = MOCK_TOKENS[tokenB];
        if (!tokenAInfo || !tokenBInfo) return;
        await executeTransaction('Create Pool', `Creating pool for ${tokenA}/${tokenB}`, `CreatePool_${tokenA}_${tokenB}`,
            () => writeContractAsync({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'createPool', args: [tokenAInfo.address, tokenBInfo.address] }),
            fetchPools
        );
    }, [writeContractAsync, executeTransaction, fetchPools]);
    
    const addLiquidity = useCallback(async (poolAddress: Address, amountA: string, amountB: string) => {
        const pool = pools.find(p => p.address === poolAddress);
        if (!pool) return;
        
        await approveToken(pool.tokenA.symbol, amountA);
        await approveToken(pool.tokenB.symbol, amountB);
        
        await executeTransaction('Add Liquidity', `Adding ${amountA} ${pool.tokenA.symbol} and ${amountB} ${pool.tokenB.symbol}`, `AddLiquidity_${poolAddress}`,
            () => writeContractAsync({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'addLiquidity', args: [
                    pool.tokenA.address, pool.tokenB.address, 
                    parseUnits(amountA, pool.tokenA.decimals), parseUnits(amountB, pool.tokenB.decimals), 
                    address!, BigInt(Math.floor(Date.now() / 1000) + 60*20)
                ]}),
            async () => { await fetchBalances(); await fetchPools(); }
        );
    }, [pools, approveToken, executeTransaction, writeContractAsync, fetchBalances, fetchPools, address]);
    
    const removeLiquidity = useCallback(async (poolAddress: Address, lpAmount: string) => {
        const pool = pools.find(p => p.address === poolAddress);
        if (!pool) return;
        await executeTransaction('Remove Liquidity', `Removing ${lpAmount} LP tokens from ${pool.name}`, `RemoveLiquidity_${poolAddress}`,
            () => writeContractAsync({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'removeLiquidity', args: [
                    pool.tokenA.address, pool.tokenB.address, parseUnits(lpAmount, 18), 0n, 0n, address!,
                    BigInt(Math.floor(Date.now() / 1000) + 60*20)
                ]}),
            async () => { await fetchBalances(); await fetchPools(); }
        );
    }, [pools, executeTransaction, writeContractAsync, fetchBalances, fetchPools, address]);
    
    const swap = useCallback(async (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string, minAmountOut: string) => {
         const tokenInInfo = MOCK_TOKENS[tokenIn];
         const tokenOutInfo = MOCK_TOKENS[tokenOut];
         if (!tokenInInfo || !tokenOutInfo) return;
        
         const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);
         const minAmountOutWei = parseUnits(minAmountOut, tokenOutInfo.decimals);
        
         await approveToken(tokenIn, amountIn);
         await executeTransaction('Swap', `Swapping ${amountIn} ${tokenIn} for at least ${minAmountOut} ${tokenOut}`, `Swap_${tokenIn}_${tokenOut}`,
             () => writeContractAsync({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'swapExactTokensForTokens', args: [
                     amountInWei, minAmountOutWei, [tokenInInfo.address, tokenOutInfo.address], address!, 
                     BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
                 ]}),
             fetchBalances
         );
    }, [executeTransaction, approveToken, writeContractAsync, address, fetchBalances]);

    const send = useCallback(async (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => {
        let txFunction: () => Promise<Address>;
        let details: React.ReactNode = `Sending ${amount} ${token} to ${recipient.slice(0, 6)}...`;

        if (token === 'ETH') {
            txFunction = () => walletClient!.sendTransaction({ to: recipient, value: parseEther(amount) });
        } else {
            const tokenInfo = MOCK_TOKENS[token];
            const onChainAmount = parseUnits(amount, tokenInfo.decimals);
            txFunction = () => writeContractAsync({ address: tokenInfo.address, abi: ERC20_ABI, functionName: 'transfer', args: [recipient, onChainAmount] });
        }

        await executeTransaction('Send', details, `Send_${token}_${amount}`, txFunction, fetchBalances);
    }, [walletClient, executeTransaction, writeContractAsync, fetchBalances]);
    
    const refreshData = useCallback(async () => {
        setProcessing('refresh', true);
        await Promise.all([ fetchBalances(), fetchPools(), fetchNetworkStats() ]);
        setProcessing('refresh', false);
    }, [fetchBalances, fetchPools, fetchNetworkStats]);
    
    const state: AmmDemoState = { isConnected, address, ethBalance, tokenBalances, allowances, transactions, pools, predictions, processingStates, isProcessing, gasPrice, networkStats };
    const actions: AmmDemoActions = { connectWallet, disconnectWallet, getFaucetTokens, approveToken, submitFeePrediction, createPool, addLiquidity, removeLiquidity, swap, send, refreshData };
    
    return <AmmDemoContext.Provider value={{ state, actions }}>{children}</AmmDemoContext.Provider>;
};

export const useAmmDemo = (): AmmDemoContextType => {
    const context = useContext(AmmDemoContext);
    if (context === undefined) { throw new Error('useAmmDemo must be used within an AmmDemoProvider'); }
    return context;
};
