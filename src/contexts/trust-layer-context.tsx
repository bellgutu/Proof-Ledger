
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import * as DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';
import { type Address, formatUnits, formatEther, parseEther, parseUnits, zeroAddress } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

// Enhanced Types for All Contracts
interface TrustOracleData {
  activeProviders: number;
  minStake: string;
  minSubmissions: number;
  latestPrice: string;
  confidence: number;
  lastUpdate: number;
  providers: Array<{ address: Address; stake: string; confidence: number }>;
}

interface SafeVaultData {
  totalAssets: string;
  totalDeposits: string;
  totalWithdrawals: string;
  userBalance: string;
  isLocked: boolean;
  lockDuration: number;
  owners: Address[];
  threshold: number;
}

interface ProofBondData {
  activeBonds: number;
  tvl: string;
  totalSupply: string;
  bondPrice: string;
  apy: number;
  userBonds: Array<{ id: number; amount: string; maturity: number; yield: string }>;
  trancheSize: string;
  nextTrancheId: number;
}

interface ForgeMarketData {
  totalVolume: string;
  totalLiquidity: string;
  activePools: number;
  currentFee: number;
  aiOptimizedFee: number;
  efficiency: number;
  userLiquidity: string;
  pools: Array<{
    tokenA: Address;
    tokenB: Address;
    reserveA: string;
    reserveB: string;
    fee: number;
    aiOptimized: boolean;
  }>;
}

interface OpenGovernorData {
  proposalCount: number;
  treasuryValue: string;
  activeProposals: number;
  votingPower: string;
  userVotes: Array<{ proposalId: number; support: boolean; votes: string }>;
  proposals: Array<{
    id: number;
    title: string;
    description: string;
    forVotes: string;
    againstVotes: string;
    deadline: number;
    executed: boolean;
  }>;
  quorum: number;
  votingPeriod: number;
}

interface AIData {
  currentPrediction: string;
  confidence: number;
  lastOptimization: number;
  efficiencyGain: number;
  gasSavings: number;
  predictions: Array<{
    timestamp: number;
    prediction: string;
    confidence: number;
    actual: string;
    accuracy: number;
  }>;
}

interface TrustLayerState {
  // Core Contract Data
  mainContractData: { protocolFee: number };
  trustOracleData: TrustOracleData;
  safeVaultData: SafeVaultData;
  proofBondData: ProofBondData;
  forgeMarketData: ForgeMarketData;
  openGovernorData: OpenGovernorData;
  
  // AI Enhancement Data
  aiData: AIData;
  adaptiveAMMData: {
    currentFee: number;
    optimizedFee: number;
    efficiency: number;
    volume24h: string;
  };
  predictiveLiquidityData: {
    predictedLiquidity: string;
    accuracy: number;
    recommendations: Array<{ action: string; confidence: number }>;
  };
  
  // User-specific data
  userData: {
    isOracleProvider: boolean;
    oracleStake: string;
    vaultBalance: string;
    bondHoldings: string;
    liquidityPositions: string;
    votingPower: string;
  };
  
  isLoading: boolean;
  lastUpdated: number;
}

interface TrustLayerActions {
  // Refresh data
  refresh: () => Promise<void>;
  
  // Oracle Functions
  registerOracleProvider: () => Promise<void>;
  submitOracleData: (price: string, confidence: number) => Promise<void>;
  unstakeOracle: () => Promise<void>;
  
  // Vault Functions
  depositToVault: (amount: string) => Promise<void>;
  withdrawFromVault: (amount: string) => Promise<void>;
  approveVault: (amount: string) => Promise<void>;
  
  // Bond Functions
  purchaseBond: (amount: string) => Promise<void>;
  redeemBond: (bondId: number) => Promise<void>;
  claimBondYield: (bondId: number) => Promise<void>;
  
  // Trading Functions
  swapTokens: (tokenA: Address, tokenB: Address, amountIn: string, minAmountOut: string) => Promise<void>;
  addLiquidity: (tokenA: Address, tokenB: Address, amountA: string, amountB: string) => Promise<void>;
  removeLiquidity: (poolId: number, liquidity: string) => Promise<void>;
  
  // Governance Functions
  createProposal: (targets: Address[], values: bigint[], calldatas: `0x${string}`[], description: string) => Promise<void>;
  voteOnProposal: (proposalId: number, support: number) => Promise<void>;
  executeProposal: (proposalId: number) => Promise<void>;
  
  // AI Functions
  triggerAIOptimization: () => Promise<void>;
  getAIPrediction: (market: string) => Promise<{ prediction: string; confidence: number }>;
  updateAIModel: () => Promise<void>;
}

interface TrustLayerContextType {
  state: TrustLayerState;
  actions: TrustLayerActions;
}

const TrustLayerContext = createContext<TrustLayerContextType | undefined>(undefined);

const initialTrustLayerState: TrustLayerState = {
  mainContractData: { protocolFee: 0 },
  trustOracleData: { 
    activeProviders: 0, 
    minStake: '0', 
    minSubmissions: 0,
    latestPrice: '0',
    confidence: 0,
    lastUpdate: 0,
    providers: []
  },
  safeVaultData: { 
    totalAssets: '0',
    totalDeposits: '0',
    totalWithdrawals: '0',
    userBalance: '0',
    isLocked: false,
    lockDuration: 0,
    owners: [],
    threshold: 0
  },
  proofBondData: { 
    activeBonds: 0, 
    tvl: '0',
    totalSupply: '0',
    bondPrice: '0',
    apy: 0,
    userBonds: [],
    trancheSize: '0',
    nextTrancheId: 0
  },
  forgeMarketData: { 
    totalVolume: '0',
    totalLiquidity: '0',
    activePools: 0,
    currentFee: 0,
    aiOptimizedFee: 0,
    efficiency: 0,
    userLiquidity: '0',
    pools: []
  },
  openGovernorData: { 
    proposalCount: 0, 
    treasuryValue: '0', 
    activeProposals: 0,
    votingPower: '0',
    userVotes: [],
    proposals: [],
    quorum: 0,
    votingPeriod: 0
  },
  aiData: {
    currentPrediction: '0',
    confidence: 0,
    lastOptimization: 0,
    efficiencyGain: 0,
    gasSavings: 0,
    predictions: []
  },
  adaptiveAMMData: {
    currentFee: 0,
    optimizedFee: 0,
    efficiency: 0,
    volume24h: '0'
  },
  predictiveLiquidityData: {
    predictedLiquidity: '0',
    accuracy: 0,
    recommendations: []
  },
  userData: {
    isOracleProvider: false,
    oracleStake: '0',
    vaultBalance: '0',
    bondHoldings: '0',
    liquidityPositions: '0',
    votingPower: '0'
  },
  isLoading: true,
  lastUpdated: 0,
};

export const TrustLayerProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TrustLayerState>(initialTrustLayerState);
    const publicClient = usePublicClient({ chainId: DEPLOYED_CONTRACTS.chainId });
    const { data: walletClient } = useWalletClient();
    const { walletState, walletActions } = useWallet();
    const { toast } = useToast();
    const { writeContractAsync } = useWriteContract();

    // Enhanced data fetching for all contracts
    const fetchData = useCallback(async () => {
        if (!publicClient) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // MainContract
            const protocolFee = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.MainContract as Address,
                abi: DEPLOYED_CONTRACTS.abis.MainContract,
                functionName: 'protocolFeePercent',
            });

            // TrustOracle - Enhanced with AI features
            const activeProviders = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'listActiveOracles',
            }) as Address[];
            
            const minStake = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'minStake',
            });
            
            const minSubmissions = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'minSubmissions',
            });

            // SafeVault
            const totalAssets = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'totalAssets',
            });
            
            // ProofBond
            const activeBonds = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ProofBond as Address,
                abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                functionName: 'totalSupply',
            });
            
            const bondTvl = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ProofBond as Address,
                abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                functionName: 'totalValueLocked',
            });
            
            // ForgeMarket
            const totalVolume = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
                functionName: 'totalVolume',
            });
            
            // OpenGovernor
            const proposalCount = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'proposalCount',
            });
            
            const treasuryAddress = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'treasury',
            });
            
            const treasuryBalance = await publicClient.getBalance({ address: treasuryAddress as Address });
            
            const proposalStates = proposalCount ? await Promise.all(Array.from({ length: Number(proposalCount) }, (_, i) => 
                 publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                    abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                    functionName: 'state',
                    args: [BigInt(i + 1)],
                })
            )) : [];
            const activeProposalsCount = proposalStates.filter(s => s === 1).length;

            setState(prev => ({
                ...prev,
                mainContractData: { protocolFee: Number(protocolFee) },
                trustOracleData: { 
                    ...prev.trustOracleData,
                    activeProviders: activeProviders.length, 
                    minStake: formatEther(minStake as bigint), 
                    minSubmissions: Number(minSubmissions),
                },
                safeVaultData: { 
                    ...prev.safeVaultData,
                    totalAssets: formatUnits(totalAssets as bigint, 6),
                },
                proofBondData: { 
                    ...prev.proofBondData,
                    activeBonds: Number(activeBonds), 
                    tvl: formatUnits(bondTvl as bigint, 6),
                },
                forgeMarketData: { 
                    ...prev.forgeMarketData,
                    totalVolume: formatUnits(totalVolume as bigint, 6),
                },
                openGovernorData: { 
                    ...prev.openGovernorData,
                    proposalCount: Number(proposalCount), 
                    treasuryValue: formatEther(treasuryBalance), 
                    activeProposals: activeProposalsCount,
                },
                isLoading: false,
                lastUpdated: Date.now(),
            }));

        } catch (error) {
            console.error("Failed to fetch Trust Layer data:", error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [publicClient]);

    const executeTrustLayerTx = async (
        type: any,
        details: any,
        txFunction: () => Promise<Address>
    ) => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
        await walletActions.executeTransaction(type, details, txFunction, fetchData);
    };

    const registerOracleProvider = async () => {
        const minStake = parseEther(state.trustOracleData.minStake);
        await executeTrustLayerTx('Register as Oracle', { amount: parseFloat(state.trustOracleData.minStake), token: 'ETH', to: DEPLOYED_CONTRACTS.TrustOracle }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.TrustOracle as Address,
            abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
            functionName: 'registerOracle',
            value: minStake,
        }));
    };

    const submitOracleData = async (price: string, confidence: number) => {
        await executeTrustLayerTx('Submit Oracle Data', { to: DEPLOYED_CONTRACTS.SimpleAIOracle }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.SimpleAIOracle as Address,
            abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle,
            functionName: 'submitPrediction',
            args: [parseEther(price), BigInt(Math.floor(confidence * 100))],
        }));
    };

    const unstakeOracle = async () => {
        await executeTrustLayerTx('Unstake Oracle', { to: DEPLOYED_CONTRACTS.TrustOracle }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.TrustOracle as Address,
            abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
            functionName: 'unregisterAndWithdraw',
        }));
    };

    const depositToVault = async (amount: string) => {
        await executeTrustLayerTx('Deposit to Vault', { amount: parseFloat(amount), token: 'USDC', to: DEPLOYED_CONTRACTS.SafeVault }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.SafeVault as Address,
            abi: DEPLOYED_CONTRACTS.abis.SafeVault,
            functionName: 'deposit',
            args: [parseUnits(amount, 6), walletState.walletAddress as Address],
        }));
    };

    const withdrawFromVault = async (amount: string) => {
        await executeTrustLayerTx('Withdraw from Vault', { amount: parseFloat(amount), token: 'USDC', to: DEPLOYED_CONTRACTS.SafeVault }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.SafeVault as Address,
            abi: DEPLOYED_CONTRACTS.abis.SafeVault,
            functionName: 'withdraw',
            args: [parseUnits(amount, 6), walletState.walletAddress as Address, walletState.walletAddress as Address],
        }));
    };

    const approveVault = async (amount: string) => {
        // This should approve the Vault to spend a token, e.g., USDC, not self-approve.
        // Assuming a stablecoin like USDC for deposits.
        const usdcAddress = zeroAddress; // Replace with actual USDC address if available
        if(usdcAddress === zeroAddress) {
            toast({variant: 'destructive', title: 'USDC Address not configured'});
            return;
        }
        await executeTrustLayerTx('Approve Vault', { amount: parseFloat(amount), token: 'USDC', to: DEPLOYED_CONTRACTS.SafeVault }, () => writeContractAsync({
            address: usdcAddress, // The token being approved
            abi: [{ type: 'function', name: 'approve', inputs: [{name: 'spender', type: 'address'}, {name: 'amount', type: 'uint256'}], outputs: [{name: '', type: 'bool'}] }],
            functionName: 'approve',
            args: [DEPLOYED_CONTRACTS.SafeVault as Address, parseUnits(amount, 6)],
        }));
    };

    const purchaseBond = async (amount: string) => {
        await executeTrustLayerTx('Purchase Bonds', { amount: parseFloat(amount), token: 'USDC', to: DEPLOYED_CONTRACTS.ProofBond }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.ProofBond as Address,
            abi: DEPLOYED_CONTRACTS.abis.ProofBond,
            functionName: 'purchase',
            args: [parseUnits(amount, 6)],
        }));
    };

    const redeemBond = async (bondId: number) => {
        await executeTrustLayerTx('Redeem Bond', { to: DEPLOYED_CONTRACTS.ProofBond }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.ProofBond as Address,
            abi: DEPLOYED_CONTRACTS.abis.ProofBond,
            functionName: 'redeem',
            args: [BigInt(bondId)],
        }));
    };

    const claimBondYield = async (bondId: number) => {
        await executeTrustLayerTx('Claim Bond Yield', { to: DEPLOYED_CONTRACTS.ProofBond }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.ProofBond as Address,
            abi: DEPLOYED_CONTRACTS.abis.ProofBond,
            functionName: 'claimYield',
            args: [BigInt(bondId)],
        }));
    };
    
    const swapTokens = async (tokenA: Address, tokenB: Address, amountIn: string, minAmountOut: string) => {
        toast({ title: "Not Implemented" });
    };
    const addLiquidity = async (tokenA: Address, tokenB: Address, amountA: string, amountB: string) => {
        toast({ title: "Not Implemented" });
    };
    const removeLiquidity = async (poolId: number, liquidity: string) => {
        toast({ title: "Not Implemented" });
    };

    const createProposal = async (targets: Address[], values: bigint[], calldatas: `0x${string}`[], description: string) => {
        await executeTrustLayerTx('Create Proposal', { to: DEPLOYED_CONTRACTS.OpenGovernor }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
            abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
            functionName: 'propose',
            args: [targets, values, calldatas, description],
        }));
    };

    const voteOnProposal = async (proposalId: number, support: number) => {
        await executeTrustLayerTx('Vote on Proposal', { to: DEPLOYED_CONTRACTS.OpenGovernor }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
            abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
            functionName: 'castVote',
            args: [BigInt(proposalId), support as 0 | 1],
        }));
    };

    const executeProposal = async (proposalId: number) => {
        const proposal = state.openGovernorData.proposals.find(p => p.id === proposalId);
        if (!proposal) {
            toast({ variant: 'destructive', title: "Proposal not found"});
            return;
        }
        // This is a simplified execute call, real one needs targets, values, calldatas
        await executeTrustLayerTx('Execute Proposal', { to: DEPLOYED_CONTRACTS.OpenGovernor }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
            abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
            functionName: 'execute',
            args: [[], [], [], "0x"],
        }));
    };

    const triggerAIOptimization = async () => {
        await executeTrustLayerTx('AI Optimization', { to: DEPLOYED_CONTRACTS.SimpleAdaptiveAMM }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.SimpleAdaptiveAMM as Address,
            abi: DEPLOYED_CONTRACTS.abis.SimpleAdaptiveAMM,
            functionName: 'optimize',
        }));
    };

    const getAIPrediction = async (market: string): Promise<{ prediction: string; confidence: number }> => {
        // This would be a read operation, not a transaction
        return { prediction: '0', confidence: 0 };
    };

    const updateAIModel = async () => {
        await executeTrustLayerTx('Update AI Model', { to: DEPLOYED_CONTRACTS.SimpleAIOracle }, () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.SimpleAIOracle as Address,
            abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle,
            functionName: 'updateModel',
        }));
    };
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const value: TrustLayerContextType = {
        state,
        actions: {
            refresh: fetchData,
            registerOracleProvider,
            submitOracleData,
            unstakeOracle,
            depositToVault,
            withdrawFromVault,
            approveVault,
            purchaseBond,
            redeemBond,
            claimBondYield,
            swapTokens,
            addLiquidity,
            removeLiquidity,
            createProposal,
            voteOnProposal,
            executeProposal,
            triggerAIOptimization,
            getAIPrediction,
            updateAIModel,
        }
    };

    return (
        <TrustLayerContext.Provider value={value}>
            {children}
        </TrustLayerContext.Provider>
    );
};

export const useTrustLayer = (): TrustLayerContextType => {
    const context = useContext(TrustLayerContext);
    if (context === undefined) {
        throw new Error('useTrustLayer must be used within a TrustLayerProvider');
    }
    return context;
};
