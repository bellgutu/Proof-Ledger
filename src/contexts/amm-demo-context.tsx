
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { getViemPublicClient } from '@/services/blockchain-service';
import { type Address, parseAbi, formatUnits, parseEther, formatEther, getContract } from 'viem';
import { useToast } from '@/hooks/use-toast';

// --- NEW CONTRACT & TOKEN ADDRESSES FOR DEMO ---
const AMM_CONTRACT_ADDRESS = '0xC3F0c7b04995517A4484e242D766f4d48f699e85' as const;
const AI_ORACLE_ADDRESS = '0x730A471452aA3FA1AbC604f22163a7655B78d1B1' as const;
const MOCK_USDT_ADDRESS = '0xC9569792794d40C612C6E4cd97b767EeE4708f24' as const;
const MOCK_USDC_ADDRESS = '0xc4733C1fbdB1Ccd9d2Da26743F21fd3Fe12ECD37' as const;
const MOCK_WETH_ADDRESS = '0x3318056463e5bb26FB66e071999a058bdb35F34f' as const;

const MOCK_TOKENS = {
    'USDT': { address: MOCK_USDT_ADDRESS, name: 'Mock USDT' },
    'USDC': { address: MOCK_USDC_ADDRESS, name: 'Mock USDC' },
    'WETH': { address: MOCK_WETH_ADDRESS, name: 'Mock WETH' },
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
  "function addLiquidity(address, address, uint256, uint256, uint256, uint256)",
  "function removeLiquidity(address, address, uint256, uint256, uint256)",
  "function swap(address, address, uint256, uint256, address)",
  "function setFee(address, uint256)",
]);

const AI_ORACLE_ABI = parseAbi([
    "function submitPrediction(address pool, uint256 predictedFee, uint8 confidence) external",
    "function getPrediction(address pool) view returns (uint256, uint8, uint256)"
]);

// --- TYPE DEFINITIONS ---
type MockTokenSymbol = keyof typeof MOCK_TOKENS;
type TransactionType = 'Faucet' | 'Approve' | 'Add Liquidity' | 'Create Pool' | 'Submit Prediction';
type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

interface DemoTransaction {
    id: string; // txHash
    type: TransactionType;
    status: TransactionStatus;
    timestamp: number;
    details: string;
}

interface AmmDemoState {
    isConnected: boolean;
    address: Address | undefined;
    ethBalance: string;
    tokenBalances: Record<MockTokenSymbol, string>;
    allowances: Record<MockTokenSymbol, bigint>;
    transactions: DemoTransaction[];
}

interface AmmDemoActions {
    connectWallet: () => void;
    getFaucetTokens: (token: MockTokenSymbol) => Promise<void>;
    approveToken: (token: MockTokenSymbol, amount: string) => Promise<void>;
    submitFeePrediction: (poolAddress: Address, fee: number, confidence: number) => Promise<void>;
}

interface AmmDemoContextType {
    state: AmmDemoState;
    actions: AmmDemoActions;
}

const AmmDemoContext = createContext<AmmDemoContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AmmDemoProvider = ({ children }: { children: ReactNode }) => {
    const { address, isConnected, chain } = useAccount();
    const { open, openView } = useWeb3Modal();
    const { data: ethBalanceData } = useBalance({ address });
    const publicClient = getViemPublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();
    const { toast } = useToast();

    const [tokenBalances, setTokenBalances] = useState<Record<MockTokenSymbol, string>>({ USDT: '0', USDC: '0', WETH: '0' });
    const [allowances, setAllowances] = useState<Record<MockTokenSymbol, bigint>>({ USDT: 0n, USDC: 0n, WETH: 0n });
    const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
    
    const ethBalance = ethBalanceData ? parseFloat(ethBalanceData.formatted).toFixed(4) : '0';

    const addTransaction = (tx: Omit<DemoTransaction, 'status' | 'timestamp'>) => {
        const newTx: DemoTransaction = { ...tx, status: 'Pending', timestamp: Date.now() };
        setTransactions(prev => [newTx, ...prev]);
    };

    const updateTransactionStatus = (id: string, status: TransactionStatus, details?: string) => {
        setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status, details: details || tx.details } : tx));
    };

    const executeTransaction = async (
        type: TransactionType,
        details: string,
        txFunction: () => Promise<Address>,
        onSuccess?: (txHash: Address) => void | Promise<void>
    ) => {
        if (!walletClient || !publicClient || !address) {
            toast({ variant: "destructive", title: "Wallet Not Connected" });
            return;
        }

        try {
            const txHash = await txFunction();
            addTransaction({ id: txHash, type, details });

            publicClient.waitForTransactionReceipt({ hash: txHash }).then(async (receipt) => {
                if (receipt.status === 'success') {
                    updateTransactionStatus(txHash, 'Completed');
                    toast({ title: "Transaction Successful", description: `${type} transaction confirmed.` });
                    if (onSuccess) await onSuccess(txHash);
                } else {
                    updateTransactionStatus(txHash, 'Failed', 'Transaction reverted');
                    toast({ variant: "destructive", title: "Transaction Failed", description: 'The transaction was reverted.' });
                }
            });

        } catch (e: any) {
            console.error(`❌ ${type} failed:`, e);
            toast({ variant: "destructive", title: "Transaction Error", description: e.shortMessage || e.message });
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
                const decimals = await publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'decimals' });
                newBalances[symbol as MockTokenSymbol] = formatUnits(balance, decimals);
            } catch (e) {
                console.error(`Failed to fetch balance for ${symbol}`, e);
            }
        }
        setTokenBalances(newBalances);
    }, [address, publicClient]);
    
    useEffect(() => {
        fetchBalances();
        const interval = setInterval(fetchBalances, 5000);
        return () => clearInterval(interval);
    }, [fetchBalances]);

    // --- ACTIONS ---

    const connectWallet = () => {
        open();
    };

    const getFaucetTokens = useCallback(async (token: MockTokenSymbol) => {
        const tokenInfo = MOCK_TOKENS[token];
        const amount = parseEther('1000'); // Mint 1000 tokens

        await executeTransaction(
            'Faucet',
            `Minting 1,000 ${token}`,
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
        const decimals = await publicClient.readContract({ address: tokenInfo.address, abi: ERC20_ABI, functionName: 'decimals' });
        const onChainAmount = BigInt(parseFloat(amount) * (10 ** decimals));

        await executeTransaction(
            'Approve',
            `Approving ${amount} ${token} for AMM`,
            () => writeContractAsync({
                address: tokenInfo.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [AMM_CONTRACT_ADDRESS, onChainAmount],
            }),
            // Can add allowance check on success if needed
        );
    }, [writeContractAsync, publicClient, executeTransaction]);

    const submitFeePrediction = useCallback(async (poolAddress: Address, fee: number, confidence: number) => {
        // Fee needs to be in basis points for the contract
        const feeBps = Math.round(fee * 100); 

        await executeTransaction(
            'Submit Prediction',
            `Submitting fee prediction for pool`,
            () => writeContractAsync({
                address: AI_ORACLE_ADDRESS,
                abi: AI_ORACLE_ABI,
                functionName: 'submitPrediction',
                args: [poolAddress, BigInt(feeBps), confidence],
            })
        );
    }, [writeContractAsync, executeTransaction]);

    const state: AmmDemoState = {
        isConnected,
        address,
        ethBalance,
        tokenBalances,
        allowances,
        transactions
    };

    const actions: AmmDemoActions = {
        connectWallet,
        getFaucetTokens,
        approveToken,
        submitFeePrediction
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
