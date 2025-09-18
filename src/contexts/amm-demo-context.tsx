
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, getContract, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

// --- CONTRACT & TOKEN ADDRESSES ---
const AMM_CONTRACT_ADDRESS = '0xC3F0c7b04995517A4484e242D766f4d48f699e85' as const;
const AI_ORACLE_ADDRESS = '0x730A471452aA3FA1AbC604f22163a7655B78d1B1' as const;
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
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
    "function setFee(address pool, uint256 fee) external",
    "function poolCount() external view returns (uint256)",
    "function pools(uint256 index) external view returns (address pool)",
    "function getReserves(address pool) external view returns (uint256 reserveA, uint256 reserveB)",
    "function getFee(address pool) external view returns (uint256)",
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
    addLiquidity: (poolAddress: Address, amountA: string, amountB: string) => Promise<void>;
    removeLiquidity: (poolAddress: Address, lpAmount: string) => Promise<void>;
    swap: (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string, minAmountOut: string) => Promise<void>;
    send: (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => Promise<void>;
    refreshData: () => Promise<void>;
    writeContractAsync: typeof useWriteContract.prototype.writeContractAsync;
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
            console.log("Executing transaction:", type);
            const txHash = await txFunction();
            console.log("Transaction hash:", txHash);
            
            setTransactions(prev => prev.map(tx => tx.id === tempTxId ? {...tx, id: txHash} : tx));
            tempTxId = txHash;
            toast({ title: "Transaction Submitted", description: `Waiting for confirmation for ${type}...` });
            
            const receipt = await Promise.race([
                publicClient.waitForTransactionReceipt({ hash: txHash }),
                new Promise<any>((_, reject) => 
                    setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
                )
            ]);
            
            console.log("Transaction receipt:", receipt);
            
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

    const findSymbolByAddress = (addr: Address) => 
        Object.entries(MOCK_TOKENS).find(([_, tokenData]) => 
            tokenData.address.toLowerCase() === addr.toLowerCase()
        )?.[0] as MockTokenSymbol | undefined;
    
    const fetchPoolDetails = useCallback(async (poolAddress: Address): Promise<DemoPool | null> => {
        if (!publicClient) return null;
        
        try {
            console.log("Fetching details for pool:", poolAddress);
            
            const [tokenA_addr, tokenB_addr] = await Promise.all([
                publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'tokenA'}),
                publicClient.readContract({ address: poolAddress, abi: AMM_POOL_ABI, functionName: 'tokenB'})
            ]);
            
            const symbolA = findSymbolByAddress(tokenA_addr);
            const symbolB = findSymbolByAddress(tokenB_addr);
            
            if (!symbolA || !symbolB) {
                console.warn(`Unknown tokens in pool: tokenA=${tokenA_addr}, tokenB=${tokenB_addr}`);
                return null;
            }
            
            const tokenAInfo = MOCK_TOKENS[symbolA];
            const tokenBInfo = MOCK_TOKENS[symbolB];
            
            let reserveA: bigint, reserveB: bigint, totalSupply: bigint, feeRate: bigint;
            
            try {
                [reserveA, reserveB] = await publicClient.readContract({
                    address: poolAddress,
                    abi: AMM_POOL_ABI,
                    functionName: 'getReserves'
                });
            } catch (e) {
                console.error(`Failed to get reserves for pool ${poolAddress}:`, e);
                return null;
            }
            
            try {
                totalSupply = await publicClient.readContract({
                    address: poolAddress,
                    abi: AMM_POOL_ABI,
                    functionName: 'totalSupply'
                });
            } catch (e) {
                console.error(`Failed to get total supply for pool ${poolAddress}:`, e);
                totalSupply = 0n;
            }
            
            try {
                feeRate = await publicClient.readContract({
                    address: AMM_CONTRACT_ADDRESS,
                    abi: AMM_ABI,
                    functionName: 'getFee',
                    args: [poolAddress]
                });
            } catch (e) {
                console.error(`Failed to get fee for pool ${poolAddress}:`, e);
                feeRate = 3000n; // Default 0.3%
            }
            
            const volume24h = (Math.random() * 10000).toFixed(2);
            const fees24h = (parseFloat(volume24h) * (Number(feeRate) / 10000)).toFixed(2);
            const apy = (Math.random() * 20 + 5);
            
            let userLpBalance = '0';
            let userShare = 0;
            if (address) {
                try {
                    const balance = await publicClient.readContract({ 
                        address: poolAddress, 
                        abi: AMM_POOL_ABI, 
                        functionName: 'balanceOf', 
                        args: [address] 
                    });
                    userLpBalance = formatUnits(balance, 18);
                    if (totalSupply > 0) {
                        userShare = (Number(userLpBalance) / Number(formatUnits(totalSupply, 18))) * 100;
                    }
                } catch (e) {
                    console.error("Failed to fetch user LP balance for pool " + poolAddress, e);
                }
            }
            
            return {
                address: poolAddress,
                name: `${symbolA}/${symbolB}`,
                tokenA: { address: tokenA_addr, symbol: symbolA, decimals: tokenAInfo.decimals },
                tokenB: { address: tokenB_addr, symbol: symbolB, decimals: tokenBInfo.decimals },
                reserveA: formatUnits(reserveA, tokenAInfo.decimals),
                reserveB: formatUnits(reserveB, tokenBInfo.decimals),
                totalLiquidity: formatUnits(totalSupply, 18),
                feeRate: Number(feeRate) / 100,
                volume24h, fees24h, apy, userLpBalance, userShare
            };
        } catch (e) {
            console.error("Failed to fetch pool details for " + poolAddress, e);
            return null;
        }
    }, [publicClient, address]);


    const fetchPools = useCallback(async () => {
        if (!publicClient) return;
        try {
            console.log("Fetching pools...");
            let poolCount: number;
            try {
                const poolCountResult = await publicClient.readContract({
                    address: AMM_CONTRACT_ADDRESS,
                    abi: AMM_ABI,
                    functionName: 'poolCount'
                });
                poolCount = Number(poolCountResult);
                console.log("Pool count:", poolCount);
            } catch (e) {
                console.error("Failed to get pool count:", e);
                setPools([]);
                return;
            }
            if (poolCount === 0) {
                console.log("No pools found");
                setPools([]);
                return;
            }
            const poolAddresses: Address[] = [];
            for (let i = 0; i < poolCount; i++) {
                try {
                    const poolAddr = await publicClient.readContract({
                        address: AMM_CONTRACT_ADDRESS,
                        abi: AMM_ABI,
                        functionName: 'pools',
                        args: [BigInt(i)]
                    });
                    console.log(`Pool ${i} address:`, poolAddr);
                    poolAddresses.push(poolAddr);
                } catch (e) {
                    console.error(`Failed to fetch pool address for index ${i}`, e);
                }
            }
            console.log("Found pool addresses:", poolAddresses);
            const poolDetails = await Promise.all(poolAddresses.map(addr => fetchPoolDetails(addr)));
            
            const validPools = poolDetails.filter(p => p !== null) as DemoPool[];
            console.log("Fetched pools:", validPools);
            setPools(validPools);
        } catch (e) {
            console.error("Failed to fetch pools:", e);
            toast({
                variant: "destructive",
                title: "Error Fetching Pools",
                description: "Failed to fetch pool data. Please check the console for details."
            });
        }
    }, [publicClient, toast, fetchPoolDetails]);

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
    
    const fetchPoolByTokens = useCallback(async (tokenA: Address, tokenB: Address): Promise<DemoPool | null> => {
        if (!publicClient) return null;
        try {
            console.log("Fetching pool for tokens:", tokenA, tokenB);
            
            const tokens = [tokenA, tokenB];
            tokens.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
            const [sortedTokenA, sortedTokenB] = tokens;

            console.log("Fetching pool for sorted tokens:", sortedTokenA, sortedTokenB);

            const poolAddress = await publicClient.readContract({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'getPool',
                args: [sortedTokenA, sortedTokenB]
            });
            
            console.log("Pool address:", poolAddress);
            
            if (poolAddress === '0x0000000000000000000000000000000000000000') {
                return null;
            }
            
            return await fetchPoolDetails(poolAddress);
        } catch (e) {
            console.error("Failed to fetch pool by tokens:", e);
            return null;
        }
    }, [publicClient, fetchPoolDetails]);
    
    const createPool = useCallback(async (tokenA: MockTokenSymbol, tokenB: MockTokenSymbol) => {
        const tokenAInfo = MOCK_TOKENS[tokenA];
        const tokenBInfo = MOCK_TOKENS[tokenB];
        if (!tokenAInfo || !tokenBInfo) return;
        
        const existingPool = await fetchPoolByTokens(tokenAInfo.address, tokenBInfo.address);
        if (existingPool) {
            toast({ 
                variant: "destructive", 
                title: "Pool Already Exists", 
                description: `A pool for ${tokenA}/${tokenB} already exists.` 
            });
            return;
        }
        
        await executeTransaction('Create Pool', `Creating pool for ${tokenA}/${tokenB}`, `CreatePool_${tokenA}_${tokenB}`,
            () => writeContractAsync({ 
                address: AMM_CONTRACT_ADDRESS, 
                abi: AMM_ABI, 
                functionName: 'createPool', 
                args: [tokenAInfo.address, tokenBInfo.address] 
            }),
            async (txHash) => {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const newPool = await fetchPoolByTokens(tokenAInfo.address, tokenBInfo.address);
                if (newPool) {
                    setPools(prev => {
                        if (prev.find(p => p.address === newPool.address)) {
                            return prev;
                        }
                        return [...prev, newPool];
                    });
                     toast({ 
                        title: "Pool Created Successfully", 
                        description: `Pool ${tokenA}/${tokenB} created.` 
                    });
                } else {
                     toast({ 
                        variant: "destructive", 
                        title: "Pool Creation Issue", 
                        description: "Pool was created but could not be fetched." 
                    });
                }
                await fetchPools();
            }
        );
    }, [writeContractAsync, executeTransaction, fetchPoolByTokens, fetchPools, toast, publicClient]);

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
        const feeBps = Math.round(fee * 100); 
        await executeTransaction('Submit Prediction', `Submitting fee prediction for pool ${poolAddress}`, `Prediction_${poolAddress}`,
            () => writeContractAsync({ address: AI_ORACLE_ADDRESS, abi: AI_ORACLE_ABI, functionName: 'submitPrediction', args: [poolAddress, BigInt(feeBps), confidence] })
        );
    }, [writeContractAsync, executeTransaction]);
    
    const addLiquidity = useCallback(async (poolAddress: Address, amountA: string, amountB: string) => {
       const pool = pools.find(p => p.address === poolAddress);
        if (!pool || !address) return;
        
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
        
        await approveToken(pool.tokenA.symbol, amountA, AMM_CONTRACT_ADDRESS);
        await approveToken(pool.tokenB.symbol, amountB, AMM_CONTRACT_ADDRESS);
        
        await executeTransaction('Add Liquidity', `Adding liquidity to ${pool.name}`, `AddLiquidity_${pool.address}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'addLiquidity',
                args: [
                    pool.tokenA.address,
                    pool.tokenB.address,
                    parseUnits(amountA, pool.tokenA.decimals),
                    parseUnits(amountB, pool.tokenB.decimals),
                    address,
                    deadline
                ]
            }),
            fetchPools
        );
    }, [pools, address, approveToken, executeTransaction, writeContractAsync, fetchPools]);
    
    const removeLiquidity = useCallback(async (poolAddress: Address, lpAmount: string) => {
       const pool = pools.find(p => p.address === poolAddress);
        if (!pool || !address) return;
        
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

        await executeTransaction('Remove Liquidity', `Removing liquidity from ${pool.name}`, `RemoveLiquidity_${pool.address}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'removeLiquidity',
                args: [
                    pool.tokenA.address,
                    pool.tokenB.address,
                    parseUnits(lpAmount, 18),
                    0n, 
                    0n, 
                    address,
                    deadline
                ]
            }),
            fetchPools
        );
    }, [pools, address, executeTransaction, writeContractAsync, fetchPools]);
    
    const swap = useCallback(async (tokenIn: MockTokenSymbol, tokenOut: MockTokenSymbol, amountIn: string, minAmountOut: string) => {
        const tokenInInfo = MOCK_TOKENS[tokenIn];
        const tokenOutInfo = MOCK_TOKENS[tokenOut];
        if (!address || !publicClient) return;

        const onChainAmountIn = parseUnits(amountIn, tokenInInfo.decimals);
        const allowance = await publicClient.readContract({
            address: tokenInInfo.address,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [address, AMM_CONTRACT_ADDRESS],
        });

        if (allowance < onChainAmountIn) {
            try {
                await executeTransaction('Approve', `Approving ${tokenIn} for swap`, `Approve_${tokenIn}`,
                    () => writeContractAsync({
                        address: tokenInInfo.address,
                        abi: ERC20_ABI,
                        functionName: 'approve',
                        args: [AMM_CONTRACT_ADDRESS, parseUnits('1000000', tokenInInfo.decimals)]
                    })
                );
            } catch (e) {
                return;
            }
        }
        
        await executeTransaction('Swap', `Swapping ${amountIn} ${tokenIn} for ${tokenOut}`, `Swap_${tokenIn}_${tokenOut}`,
            () => writeContractAsync({
                address: AMM_CONTRACT_ADDRESS,
                abi: AMM_ABI,
                functionName: 'swapExactTokensForTokens',
                args: [
                    onChainAmountIn,
                    parseUnits(minAmountOut, tokenOutInfo.decimals),
                    [tokenInInfo.address, tokenOutInfo.address],
                    address,
                    BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
                ]
            }),
            async () => {
                await fetchAmmBalances();
                await fetchPools();
            }
        );
    }, [address, publicClient, executeTransaction, writeContractAsync, fetchAmmBalances, fetchPools]);

    const send = useCallback(async (token: MockTokenSymbol | 'ETH', recipient: Address, amount: string) => {
        console.log("Send function called with:", { token, recipient, amount });
        
        if (!walletClient || !publicClient || !address) {
            console.error("Wallet not properly connected:", { walletClient: !!walletClient, publicClient: !!publicClient, address });
            toast({ variant: "destructive", title: "Wallet Not Connected", description: "Please connect your wallet first." });
            return;
        }

        if (chain?.id !== 11155111 && switchChain) {
            toast({ variant: "destructive", title: "Wrong Network", description: "Please switch to Sepolia testnet." });
            try {
                await switchChain({ chainId: 11155111 });
            } catch (e) {
                console.error("Failed to switch network:", e);
            }
            return;
        }
    
        let txFunction: () => Promise<Address>;
        let details: React.ReactNode = `Sending ${amount} ${token} to ${recipient.slice(0, 6)}...`;
        
        try {
            if (token === 'ETH') {
                console.log("Sending ETH transaction");
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
                console.log("Sending token transaction:", token);
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
            console.error("Send error:", error);
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
        transactions, 
        pools, 
        predictions,
        processingStates, 
        isProcessing,
        gasPrice,
        networkStats,
        tokenBalances,
        ethBalance,
        isConnected,
        address
    };
    
    const actions: AmmDemoActions = { 
        getFaucetTokens, 
        approveToken, 
        submitFeePrediction, 
        createPool, 
        addLiquidity,
        removeLiquidity,
        swap,
        send,
        refreshData,
        writeContractAsync
    };
    
    return <AmmDemoContext.Provider value={{ state, actions }}>{children}</AmmDemoContext.Provider>;
};

export const useAmmDemo = (): AmmDemoContextType => {
    const context = useContext(AmmDemoContext);
    if (context === undefined) { throw new Error('useAmmDemo must be used within an AmmDemoProvider'); }
    return context;
};

    