

"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useWriteContract, useWalletClient, useSwitchChain } from 'wagmi';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, getContract, parseUnits, decodeEventLog } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

// --- CONTRACT & TOKEN ADDRESSES ---
// These are specific to the new, isolated AI-powered AMM Demo
const DEPLOYED_CONTRACTS = {
  AdaptiveMarketMaker: "0xC3F0c7b04995517A4484e242D766f4d48f699e85",
  AIPredictiveLiquidityOracle: "0x730A471452aA3FA1AbC604f22163a7655B78d1B1",
};

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

const AMM_ABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "tokenA",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "tokenB",
          "type": "address"
        }
      ],
      "name": "PoolCreated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenB",
          "type": "address"
        }
      ],
      "name": "createPool",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "getPool",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "poolCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "pools",
      "outputs": [
        {
          "internalType": "address",
          "name": "tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenB",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "reserveA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveB",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const;


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

const initialPools: DemoPool[] = [
    {
        address: '0x1234567890123456789012345678901234567890', // Placeholder
        id: 0,
        name: 'USDT/USDC',
        tokenA: { address: MOCK_TOKENS.USDT.address, symbol: 'USDT', decimals: MOCK_TOKENS.USDT.decimals },
        tokenB: { address: MOCK_TOKENS.USDC.address, symbol: 'USDC', decimals: MOCK_TOKENS.USDC.decimals },
        reserveA: '0',
        reserveB: '0',
        totalLiquidity: '0',
        feeRate: 0.3,
        volume24h: '0',
        fees24h: '0',
        apy: 0,
        userLpBalance: '0',
        userShare: 0,
    }
];

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
    const [pools, setPools] = useState<DemoPool[]>(initialPools);
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

    
    const fetchPoolDetails = useCallback(async (poolId: number): Promise<DemoPool | null> => {
        if (!publicClient) return null;
    
        try {
            const poolData = await publicClient.readContract({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'pools',
                args: [BigInt(poolId)]
            });
    
            const { tokenA: tokenA_addr, tokenB: tokenB_addr, reserveA, reserveB, exists } = poolData;

            if (!exists) {
                return null;
            }
            
            const poolAddress = await publicClient.readContract({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'getPool',
                args: [BigInt(poolId)]
            })[0];

            const symbolA = findSymbolByAddress(tokenA_addr);
            const symbolB = findSymbolByAddress(tokenB_addr);
    
            if (!symbolA || !symbolB) return null;
    
            const tokenAInfo = MOCK_TOKENS[symbolA];
            const tokenBInfo = MOCK_TOKENS[symbolB];
    
            const volume24h = (Math.random() * 10000).toFixed(2);
            const feeRate = 0.3;
            const fees24h = (parseFloat(volume24h) * (feeRate / 100)).toFixed(2);
            const apy = (Math.random() * 20 + 5);
    
            let userLpBalance = '0';
            let userShare = 0;
    
            return {
                address: poolAddress,
                id: poolId,
                name: `${symbolA}/${symbolB}`,
                tokenA: { address: tokenA_addr, symbol: symbolA, decimals: tokenAInfo.decimals },
                tokenB: { address: tokenB_addr, symbol: symbolB, decimals: tokenBInfo.decimals },
                reserveA: formatUnits(reserveA, tokenAInfo.decimals),
                reserveB: formatUnits(reserveB, tokenBInfo.decimals),
                totalLiquidity: "0",
                feeRate,
                volume24h, fees24h, apy, userLpBalance, userShare
            };
        } catch (e) {
            console.error(`Failed to fetch pool details for ID ${poolId}`, e);
            return null;
        }
    }, [publicClient, address]);

    const fetchPools = useCallback(async () => {
        if (!publicClient) return;
        try {
            const poolCount = await publicClient.readContract({ address: AMM_CONTRACT_ADDRESS, abi: AMM_ABI, functionName: 'poolCount' });
            
            const poolPromises: Promise<DemoPool | null>[] = [];
            for (let i = 0; i < Number(poolCount); i++) {
                poolPromises.push(fetchPoolDetails(i));
            }
    
            const resolvedPools = (await Promise.all(poolPromises)).filter((p): p is DemoPool => p !== null);
            setPools(resolvedPools);
        } catch (e) {
            console.error("Failed to fetch pools", e);
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
        if (!tokenAInfo || !tokenBInfo) return;
    
        const [sortedTokenA, sortedTokenB] = [tokenAInfo.address, tokenBInfo.address].sort((a, b) =>
            a.toLowerCase() < b.toLowerCase() ? -1 : 1
        );
    
        await executeTransaction('Create Pool', `Creating pool for ${tokenA}/${tokenB}`, `CreatePool_${tokenA}_${tokenB}`,
            () => writeContractAsync({ 
                address: AMM_CONTRACT_ADDRESS, 
                abi: AMM_ABI, 
                functionName: 'createPool', 
                args: [sortedTokenA, sortedTokenB] 
            }),
            async (txHash, receipt) => {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Delay to allow chain to update
                await fetchPools();
            }
        );
    }, [writeContractAsync, executeTransaction, fetchPools, toast, publicClient, fetchPoolDetails]);

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
        
        toast({variant: "destructive", title: "Not Implemented", description: "This simplified AMM does not support adding liquidity."})

     }, [pools, address, approveToken, executeTransaction, writeContractAsync, fetchPools]);
    
    const removeLiquidity = useCallback(async (poolId: number, lpAmount: string) => {
        const pool = pools.find(p => p.id === poolId);
        if (!pool || !address) return;
        
        toast({variant: "destructive", title: "Not Implemented", description: "This simplified AMM does not support removing liquidity."})
    }, [pools, address, executeTransaction, writeContractAsync, fetchPools]);
    
    const swap = useCallback(async (fromToken: MockTokenSymbol, toToken: MockTokenSymbol, amountIn: string, minAmountOut: string) => {
        const pool = pools.find(p => (p.tokenA.symbol === fromToken && p.tokenB.symbol === toToken) || (p.tokenA.symbol === toToken && p.tokenB.symbol === fromToken));
        if (!pool) {
            toast({ variant: 'destructive', title: 'No Pool Found', description: `No liquidity pool available for ${fromToken}/${toToken}.` });
            return;
        }
        toast({variant: "destructive", title: "Not Implemented", description: "This simplified AMM does not support swaps."})

    }, [address, publicClient, pools, executeTransaction, writeContractAsync, fetchAmmBalances, fetchPools, approveToken, toast]);

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

    

    

    









