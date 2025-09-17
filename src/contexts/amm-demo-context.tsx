
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, formatEther, getContract, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';

// --- NEW CONTRACT & TOKEN ADDRESSES FOR DEMO ---
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
    "function mint(address to, uint256 amount) external", // For faucet
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
]);

const AMM_POOL_ABI = parseAbi([
    "function tokenA() view returns (address)",
    "function tokenB() view returns (address)",
]);


const AI_ORACLE_ABI = parseAbi([
    "function submitPrediction(address pool, uint256 predictedFee, uint8 confidence) external",
    "function getPrediction(address pool) view returns (uint256, uint8, uint256)"
]);

// --- TYPE DEFINITIONS ---
export type MockTokenSymbol = keyof typeof MOCK_TOKENS;
export type DemoTransactionType = 'Faucet' | 'Approve' | 'Add Liquidity' | 'Create Pool' | 'Submit Prediction' | 'Swap';
export type DemoTransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface DemoTransaction {
    id: string; // txHash
    type: DemoTransactionType;
    status: DemoTransactionStatus;
    timestamp: number;
    details: string;
}

export interface DemoPool {
    address: Address;
    name: string;
    tokenA: Address;
    tokenB: Address;
}

interface AmmDemoState {
    isConnected: boolean;
    address: Address | undefined;
    ethBalance: string;
    tokenBalances: Record<MockTokenSymbol, string>;
    allowances: Record<MockTokenSymbol, bigint>;
    transactions: DemoTransaction[];
    pools: DemoPool[];
    processingStates: Record<string, boolean>;
    isProcessing: (key: string) => boolean;
}

interface AmmDemoActions {
    connectWallet: () => void;
    getFaucetTokens: (token: MockTokenSymbol) => Promise<void>;
    approveToken: (token: MockTokenSymbol, amount: string) => Promise<void>;
    submitFeePrediction: (poolAddress: Address, fee: number, confidence: number) => Promise<void>;
    createPool: (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => Promise<void>;
    addLiquidity: (poolAddress: Address, amountA: string, amountB: string) => Promise<void>;
    swap: (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string) => Promise<void>;
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
    const [processingStates, setProcessingStates] = useState<Record<string, boolean>>({});

    const ethBalance = ethBalanceData ? parseFloat(ethBalanceData.formatted).toFixed(4) : '0';

    const setProcessing = (key: string, value: boolean) => {
        setProcessingStates(prev => ({...prev, [key]: value}));
    };

    const isProcessing = (key: string) => !!processingStates[key];

    const addTransaction = (tx: Omit<DemoTransaction, 'status' | 'timestamp'>) => {
        const newTx: DemoTransaction = { ...tx, status: 'Pending', timestamp: Date.now() };
        setTransactions(prev => [newTx, ...prev]);
    };

    const updateTransactionStatus = (id: string, status: DemoTransactionStatus, details?: string) => {
        setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status, details: details || tx.details } : tx));
    };

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
                updateTransactionStatus(txHash, 'Completed');
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
    }, [address, publicClient]);

    const fetchPools = useCallback(async () => {
        if (!publicClient) return;
        try {
            const poolCount = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'poolCount' });
            const poolAddresses: Address[] = [];
            for (let i = 0; i < Number(poolCount); i++) {
                const address = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'pools', args: [BigInt(i)] });
                poolAddresses.push(address);
            }
            const poolDetails = await Promise.all(poolAddresses.map(async (addr) => {
                try {
                    const [tokenA, tokenB] = await Promise.all([
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'tokenA'}),
                        publicClient.readContract({ address: addr, abi: AMM_POOL_ABI, functionName: 'tokenB'}),
                    ]);

                    const findSymbol = (addr: Address) => Object.keys(MOCK_TOKENS).find(key => MOCK_TOKENS[key as MockTokenSymbol].address.toLowerCase() === addr.toLowerCase());
                    const symbolA = findSymbol(tokenA);
                    const symbolB = findSymbol(tokenB);

                    if(!symbolA || !symbolB) return null;

                    return { address: addr, name: `${symbolA}/${symbolB}`, tokenA, tokenB };
                } catch {
                    return null;
                }
            }));

            setPools(poolDetails.filter(p => p !== null) as DemoPool[]);
        } catch (e) {
            console.error("Failed to fetch pools", e);
        }
    }, [publicClient]);
    
    useEffect(() => {
        if(!isConnected) return;
        fetchBalances();
        fetchPools();
        const interval = setInterval(() => {
            fetchBalances();
            fetchPools();
        }, 10000);
        return () => clearInterval(interval);
    }, [isConnected, fetchBalances, fetchPools]);

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
            })
        );
    }, [writeContractAsync, executeTransaction]);

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
                args: [tokenA.address, tokenB.address, parseUnits(amountA, tokenA.decimals), parseUnits(amountB, tokenB.decimals), address!, BigInt(Math.floor(Date.now() / 1000) + 60*20)],
            }),
            fetchBalances
        );
    }, [pools, approveToken, executeTransaction, writeContractAsync, fetchBalances, address]);
    
    const swap = useCallback(async (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string) => {
         const tokenInInfo = MOCK_TOKENS[tokenIn];
         const tokenOutInfo = MOCK_TOKENS[tokenOut];
         if (!tokenInInfo || !tokenOutInfo) return;
        
         const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);

        await approveToken(tokenIn, amountIn);

         await executeTransaction(
             'Swap',
             `Swapping ${amountIn} ${tokenIn} for ${tokenOut}`,
             `Swap_${tokenIn}_${tokenOut}`,
             () => writeContractAsync({
                 address: AMM_CONTRACT_ADDRESS,
                 abi: AMM_ABI,
                 functionName: 'swapExactTokensForTokens',
                 args: [amountInWei, 0n, [tokenInInfo.address, tokenOutInfo.address], address!, BigInt(Math.floor(Date.now() / 1000) + 60 * 20)],
             }),
             fetchBalances
         );
    }, [executeTransaction, approveToken, writeContractAsync, address, fetchBalances]);

    const state: AmmDemoState = { isConnected, address, ethBalance, tokenBalances, allowances, transactions, pools, processingStates, isProcessing };
    const actions: AmmDemoActions = { connectWallet, getFaucetTokens, approveToken, submitFeePrediction, createPool, addLiquidity, swap };

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
