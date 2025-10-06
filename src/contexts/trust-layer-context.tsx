
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import trustLayerContracts from '@/lib/trustlayer-contract-addresses.json';
import { type Address, formatUnits, formatEther, parseEther, parseUnits } from 'viem';
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
  mainContractData: { protocolFee: 0.2 }, // Default to 20% as per docs
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
    const publicClient = usePublicClient({ chainId: trustLayerContracts.chainId });
    const { data: walletClient } = useWalletClient();
    const { walletState, walletActions } = useWallet();
    const { toast } = useToast();
    const { writeContractAsync } = useWriteContract();

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

    // Enhanced data fetching for all contracts
    const fetchData = useCallback(async () => {
        if (!publicClient) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // TrustOracle - Enhanced with AI features
            const activeProviders = await publicClient.readContract({
                address: trustLayerContracts.TrustOracle as Address,
                abi: trustLayerContracts.abis.TrustOracle,
                functionName: 'listActiveOracles',
            }) as Address[];
            
            const minStake = await publicClient.readContract({
                address: trustLayerContracts.TrustOracle as Address,
                abi: trustLayerContracts.abis.TrustOracle,
                functionName: 'minStake',
            });
            
            const minSubmissions = await publicClient.readContract({
                address: trustLayerContracts.TrustOracle as Address,
                abi: trustLayerContracts.abis.TrustOracle,
                functionName: 'minSubmissions',
            });

            // Get latest price and confidence from AI Oracle
            let latestPrice = '0';
            let confidence = 0;
            let lastUpdate = 0;
            
            try {
                const latestData = await publicClient.readContract({
                    address: trustLayerContracts.SimpleAIOracle as Address,
                    abi: trustLayerContracts.abis.SimpleAIOracle,
                    functionName: 'getLatestPrediction',
                });
                latestPrice = formatUnits((latestData as any[])[0], 18);
                confidence = Number((latestData as any[])[1]);
                lastUpdate = Number((latestData as any[])[2]);
            } catch (error) {
                console.log("AI Oracle data not available:", error);
            }

            // SafeVault - Enhanced with multi-sig data
            const totalAssets = await publicClient.readContract({
                address: trustLayerContracts.SafeVault as Address,
                abi: trustLayerContracts.abis.SafeVault,
                functionName: 'totalAssets',
            });
            
            const totalDeposits = await publicClient.readContract({
                address: trustLayerContracts.SafeVault as Address,
                abi: trustLayerContracts.abis.SafeVault,
                functionName: 'totalDeposits',
            });
            
            const totalWithdrawals = await publicClient.readContract({
                address: trustLayerContracts.SafeVault as Address,
                abi: trustLayerContracts.abis.SafeVault,
                functionName: 'totalWithdrawals',
            });

            // Get multi-sig info
            let owners: Address[] = [];
            let threshold = 1;
            let isLocked = false;
            let lockDuration = 0;
            
            try {
                owners = await publicClient.readContract({
                    address: trustLayerContracts.SafeVault as Address,
                    abi: trustLayerContracts.abis.SafeVault,
                    functionName: 'getOwners',
                });
                threshold = Number(await publicClient.readContract({
                    address: trustLayerContracts.SafeVault as Address,
                    abi: trustLayerContracts.abis.SafeVault,
                    functionName: 'threshold',
                }));
                isLocked = await publicClient.readContract({
                    address: trustLayerContracts.SafeVault as Address,
                    abi: trustLayerContracts.abis.SafeVault,
                    functionName: 'isLocked',
                });
                lockDuration = Number(await publicClient.readContract({
                    address: trustLayerContracts.SafeVault as Address,
                    abi: trustLayerContracts.abis.SafeVault,
                    functionName: 'lockDuration',
                }));
            } catch (error) {
                console.log("Multi-sig data not available:", error);
            }
            
            // ProofBond - Enhanced with bond market data
            const activeBonds = await publicClient.readContract({
                address: trustLayerContracts.ProofBond as Address,
                abi: trustLayerContracts.abis.ProofBond,
                functionName: 'totalSupply',
            });
            
            const bondTvl = await publicClient.readContract({
                address: trustLayerContracts.ProofBond as Address,
                abi: trustLayerContracts.abis.ProofBond,
                functionName: 'totalValueLocked',
            });

            let bondPrice = '0';
            let apy = 0;
            let trancheSize = '0';
            let nextTrancheId = 0;
            
            try {
                const bondPriceRaw = await publicClient.readContract({
                    address: trustLayerContracts.ProofBond as Address,
                    abi: trustLayerContracts.abis.ProofBond,
                    functionName: 'bondPrice',
                });
                bondPrice = formatUnits(bondPriceRaw, 18);
                const apyRaw = await publicClient.readContract({
                    address: trustLayerContracts.ProofBond as Address,
                    abi: trustLayerContracts.abis.ProofBond,
                    functionName: 'apy',
                });
                apy = Number(apyRaw);
                const trancheSizeRaw = await publicClient.readContract({
                    address: trustLayerContracts.ProofBond as Address,
                    abi: trustLayerContracts.abis.ProofBond,
                    functionName: 'trancheSize',
                });
                trancheSize = formatUnits(trancheSizeRaw, 18);
                const nextTrancheIdRaw = await publicClient.readContract({
                    address: trustLayerContracts.ProofBond as Address,
                    abi: trustLayerContracts.abis.ProofBond,
                    functionName: 'nextTrancheId',
                });
                nextTrancheId = Number(nextTrancheIdRaw);
            } catch (error) {
                console.log("Bond market data not available:", error);
            }

            // ForgeMarket - Enhanced with AI optimization data
            const totalVolume = await publicClient.readContract({
                address: trustLayerContracts.ForgeMarket as Address,
                abi: trustLayerContracts.abis.ForgeMarket,
                functionName: 'totalVolume',
            });

            let totalLiquidity = '0';
            let currentFee = 0;
            let aiOptimizedFee = 0;
            let efficiency = 0;
            let activePools = 0;
            
            try {
                const tlRaw = await publicClient.readContract({
                    address: trustLayerContracts.ForgeMarket as Address,
                    abi: trustLayerContracts.abis.ForgeMarket,
                    functionName: 'totalLiquidity',
                });
                totalLiquidity = formatUnits(tlRaw, 6);
                const cfRaw = await publicClient.readContract({
                    address: trustLayerContracts.ForgeMarket as Address,
                    abi: trustLayerContracts.abis.ForgeMarket,
                    functionName: 'currentFee',
                });
                currentFee = Number(cfRaw);
                const aofRaw = await publicClient.readContract({
                    address: trustLayerContracts.AdaptiveMarketMaker as Address,
                    abi: trustLayerContracts.abis.AdaptiveMarketMaker,
                    functionName: 'getOptimizedFee',
                });
                aiOptimizedFee = Number(aofRaw);
                const effRaw = await publicClient.readContract({
                    address: trustLayerContracts.SimpleAdaptiveAMM as Address,
                    abi: trustLayerContracts.abis.SimpleAdaptiveAMM,
                    functionName: 'getEfficiency',
                });
                efficiency = Number(effRaw);
                const apRaw = await publicClient.readContract({
                    address: trustLayerContracts.ForgeMarket as Address,
                    abi: trustLayerContracts.abis.ForgeMarket,
                    functionName: 'activePools',
                });
                activePools = Number(apRaw);
            } catch (error) {
                console.log("AI market data not available:", error);
            }
            
            // OpenGovernor - Enhanced with detailed proposal data
            const proposalCount = await publicClient.readContract({
                address: trustLayerContracts.OpenGovernor as Address,
                abi: trustLayerContracts.abis.OpenGovernor,
                functionName: 'proposalCount',
            });
            
            const treasuryAddress = await publicClient.readContract({
                address: trustLayerContracts.OpenGovernor as Address,
                abi: trustLayerContracts.abis.OpenGovernor,
                functionName: 'treasury',
            });
            
            const treasuryBalance = await publicClient.getBalance({ address: treasuryAddress as Address });
            
            let quorum = 0;
            let votingPeriod = 0;
            
            try {
                quorum = Number(await publicClient.readContract({
                    address: trustLayerContracts.OpenGovernor as Address,
                    abi: trustLayerContracts.abis.OpenGovernor,
                    functionName: 'quorum',
                }));
                votingPeriod = Number(await publicClient.readContract({
                    address: trustLayerContracts.OpenGovernor as Address,
                    abi: trustLayerContracts.abis.OpenGovernor,
                    functionName: 'votingPeriod',
                }));
            } catch (error) {
                console.log("Governance config not available:", error);
            }
            
            const activeProposalsPromises = Array.from({ length: Math.min(Number(proposalCount), 10) }, (_, i) => 
                publicClient.readContract({
                    address: trustLayerContracts.OpenGovernor as Address,
                    abi: trustLayerContracts.abis.OpenGovernor,
                    functionName: 'state',
                    args: [BigInt(i + 1)],
                })
            );
            const proposalStates = await Promise.all(activeProposalsPromises);
            const activeProposals = proposalStates.filter(s => s === 1).length;

            // AI Data - Enhanced with prediction history
            let currentPrediction = '0';
            let aiConfidence = 0;
            let lastOptimization = 0;
            let efficiencyGain = 0;
            let gasSavings = 0;
            
            try {
                const aiData = await publicClient.readContract({
                    address: trustLayerContracts.SimpleAIOracle as Address,
                    abi: trustLayerContracts.abis.SimpleAIOracle,
                    functionName: 'getAIData',
                });
                currentPrediction = formatUnits((aiData as any[])[0], 18);
                aiConfidence = Number((aiData as any[])[1]);
                lastOptimization = Number((aiData as any[])[2]);
                efficiencyGain = Number((aiData as any[])[3]);
                gasSavings = Number((aiData as any[])[4]);
            } catch (error) {
                console.log("AI data not available:", error);
            }

            // Predictive Liquidity Data
            let predictedLiquidity = '0';
            let predictionAccuracy = 0;
            
            try {
                const liquidityData = await publicClient.readContract({
                    address: trustLayerContracts.AIPredictiveLiquidityOracle as Address,
                    abi: trustLayerContracts.abis.AIPredictiveLiquidityOracle,
                    functionName: 'getPrediction',
                });
                predictedLiquidity = formatUnits((liquidityData as any[])[0], 18);
                predictionAccuracy = Number((liquidityData as any[])[1]);
            } catch (error) {
                console.log("Predictive liquidity data not available:", error);
            }

            setState(prev => ({
                ...prev,
                trustOracleData: { 
                    activeProviders: activeProviders.length, 
                    minStake: formatEther(minStake as bigint), 
                    minSubmissions: Number(minSubmissions),
                    latestPrice,
                    confidence,
                    lastUpdate,
                    providers: []
                },
                safeVaultData: { 
                    totalAssets: formatUnits(totalAssets as bigint, 6),
                    totalDeposits: formatUnits(totalDeposits as bigint, 6),
                    totalWithdrawals: formatUnits(totalWithdrawals as bigint, 6),
                    userBalance: '0',
                    isLocked,
                    lockDuration,
                    owners,
                    threshold
                },
                proofBondData: { 
                    activeBonds: Number(activeBonds), 
                    tvl: formatUnits(bondTvl as bigint, 6),
                    totalSupply: formatUnits(activeBonds as bigint, 18),
                    bondPrice,
                    apy,
                    userBonds: [],
                    trancheSize,
                    nextTrancheId
                },
                forgeMarketData: { 
                    totalVolume: formatUnits(totalVolume as bigint, 6),
                    totalLiquidity,
                    activePools,
                    currentFee,
                    aiOptimizedFee,
                    efficiency,
                    userLiquidity: '0',
                    pools: []
                },
                openGovernorData: { 
                    proposalCount: Number(proposalCount), 
                    treasuryValue: formatEther(treasuryBalance), 
                    activeProposals: activeProposals,
                    votingPower: '0',
                    userVotes: [],
                    proposals: [],
                    quorum,
                    votingPeriod
                },
                aiData: {
                    currentPrediction,
                    confidence: aiConfidence,
                    lastOptimization,
                    efficiencyGain,
                    gasSavings,
                    predictions: []
                },
                adaptiveAMMData: {
                    currentFee,
                    optimizedFee: aiOptimizedFee,
                    efficiency,
                    volume24h: '0'
                },
                predictiveLiquidityData: {
                    predictedLiquidity,
                    accuracy: predictionAccuracy,
                    recommendations: []
                },
                isLoading: false,
                lastUpdated: Date.now(),
            }));

        } catch (error) {
            console.error("Failed to fetch Trust Layer data:", error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [publicClient]);

    // Enhanced Oracle Functions
    const registerOracleProvider = useCallback(async () => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to register as a provider.',
            });
            return;
        }

        const minStake = parseEther(state.trustOracleData.minStake);

        const dialogDetails = {
            amount: parseFloat(state.trustOracleData.minStake),
            token: 'ETH',
            to: trustLayerContracts.TrustOracle,
            details: 'Staking to become an AI Oracle Provider',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.TrustOracle as Address,
                abi: trustLayerContracts.abis.TrustOracle,
                functionName: 'registerOracle',
                value: minStake,
            });
        
        await walletActions.executeTransaction('Register as Oracle', dialogDetails, txFunction, fetchData);
    }, [walletClient, state.trustOracleData.minStake, toast, writeContractAsync, walletActions, fetchData]);

    const submitOracleData = useCallback(async (price: string, confidence: number) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to submit oracle data.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: trustLayerContracts.SimpleAIOracle,
            details: `Submitting AI Oracle data: ${price} with ${confidence}% confidence`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.SimpleAIOracle as Address,
                abi: trustLayerContracts.abis.SimpleAIOracle,
                functionName: 'submitPrediction',
                args: [parseEther(price), BigInt(Math.floor(confidence * 100))],
            });
        
        await walletActions.executeTransaction('Submit Oracle Data', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const unstakeOracle = useCallback(async () => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to unstake.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: trustLayerContracts.TrustOracle,
            details: 'Unstaking from Oracle Provider',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.TrustOracle as Address,
                abi: trustLayerContracts.abis.TrustOracle,
                functionName: 'unregisterAndWithdraw',
            });
        
        await walletActions.executeTransaction('Unstake Oracle', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    // Vault Functions
    const depositToVault = useCallback(async (amount: string) => {
        if (!walletClient || !walletState.walletAddress) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to deposit.',
            });
            return;
        }

        const dialogDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: trustLayerContracts.SafeVault,
            details: 'Depositing to SafeVault',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.SafeVault as Address,
                abi: trustLayerContracts.abis.SafeVault,
                functionName: 'deposit',
                args: [parseUnits(amount, 6), walletState.walletAddress as Address],
            });
        
        await walletActions.executeTransaction('Deposit to Vault', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData, walletState.walletAddress]);

    const withdrawFromVault = useCallback(async (amount: string) => {
        if (!walletClient || !walletState.walletAddress) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to withdraw.',
            });
            return;
        }

        const dialogDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: trustLayerContracts.SafeVault,
            details: 'Withdrawing from SafeVault',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.SafeVault as Address,
                abi: trustLayerContracts.abis.SafeVault,
                functionName: 'withdraw',
                args: [parseUnits(amount, 6), walletState.walletAddress as Address, walletState.walletAddress as Address],
            });
        
        await walletActions.executeTransaction('Withdraw from Vault', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData, walletState.walletAddress]);

    const approveVault = useCallback(async (amount: string) => {
        toast({ title: 'Not implemented' });
    }, [toast]);

    // Bond Functions
    const purchaseBond = useCallback(async (amount: string) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to purchase bonds.',
            });
            return;
        }

        const dialogDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: trustLayerContracts.ProofBond,
            details: 'Purchasing ProofBonds',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.ProofBond as Address,
                abi: trustLayerContracts.abis.ProofBond,
                functionName: 'purchase',
                args: [parseUnits(amount, 6)],
            });
        
        await walletActions.executeTransaction('Purchase Bonds', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const redeemBond = useCallback(async (bondId: number) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to redeem bonds.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'USDC',
            to: trustLayerContracts.ProofBond,
            details: `Redeeming Bond #${bondId}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.ProofBond as Address,
                abi: trustLayerContracts.abis.ProofBond,
                functionName: 'redeem',
                args: [BigInt(bondId)],
            });
        
        await walletActions.executeTransaction('Redeem Bond', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const claimBondYield = useCallback(async (bondId: number) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to claim yield.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'USDC',
            to: trustLayerContracts.ProofBond,
            details: `Claiming yield for Bond #${bondId}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.ProofBond as Address,
                abi: trustLayerContracts.abis.ProofBond,
                functionName: 'claimYield',
                args: [BigInt(bondId)],
            });
        
        await walletActions.executeTransaction('Claim Bond Yield', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    // Trading Functions
    const swapTokens = useCallback(async (tokenA: Address, tokenB: Address, amountIn: string, minAmountOut: string) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to swap tokens.',
            });
            return;
        }

        const dialogDetails = {
            amount: parseFloat(amountIn),
            token: 'TOKEN',
            to: trustLayerContracts.ForgeMarket,
            details: `Swapping ${amountIn} tokens`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.ForgeMarket as Address,
                abi: trustLayerContracts.abis.ForgeMarket,
                functionName: 'swap',
                args: [tokenA, tokenB, parseUnits(amountIn, 18), parseUnits(minAmountOut, 18)],
            });
        
        await walletActions.executeTransaction('Swap Tokens', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const addLiquidity = useCallback(async (tokenA: Address, tokenB: Address, amountA: string, amountB: string) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to add liquidity.',
            });
            return;
        }

        const dialogDetails = {
            amount: parseFloat(amountA),
            token: 'TOKEN',
            to: trustLayerContracts.ForgeMarket,
            details: 'Adding liquidity to pool',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.ForgeMarket as Address,
                abi: trustLayerContracts.abis.ForgeMarket,
                functionName: 'addLiquidity',
                args: [tokenA, tokenB, parseUnits(amountA, 18), parseUnits(amountB, 18)],
            });
        
        await walletActions.executeTransaction('Add Liquidity', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const removeLiquidity = useCallback(async (poolId: number, liquidity: string) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to remove liquidity.',
            });
            return;
        }

        const dialogDetails = {
            amount: parseFloat(liquidity),
            token: 'LP',
            to: trustLayerContracts.ForgeMarket,
            details: 'Removing liquidity from pool',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.ForgeMarket as Address,
                abi: trustLayerContracts.abis.ForgeMarket,
                functionName: 'removeLiquidity',
                args: [BigInt(poolId), parseUnits(liquidity, 18)],
            });
        
        await walletActions.executeTransaction('Remove Liquidity', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    // Governance Functions
    const createProposal = useCallback(async (targets: Address[], values: bigint[], calldatas: `0x${string}`[], description: string) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to create a proposal.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: trustLayerContracts.OpenGovernor,
            details: `Creating proposal: ${description}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.OpenGovernor as Address,
                abi: trustLayerContracts.abis.OpenGovernor,
                functionName: 'propose',
                args: [targets, values, calldatas, description],
            });
        
        await walletActions.executeTransaction('Create Proposal', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const voteOnProposal = useCallback(async (proposalId: number, support: number) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to vote.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: trustLayerContracts.OpenGovernor,
            details: `Voting on proposal #${proposalId}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.OpenGovernor as Address,
                abi: trustLayerContracts.abis.OpenGovernor,
                functionName: 'castVote',
                args: [BigInt(proposalId), support as 0 | 1],
            });
        
        await walletActions.executeTransaction('Vote on Proposal', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const executeProposal = useCallback(async (proposalId: number) => {
        toast({ title: 'Not implemented' });
    }, [toast]);

    // AI Functions
    const triggerAIOptimization = useCallback(async () => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to trigger AI optimization.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: trustLayerContracts.SimpleAdaptiveAMM,
            details: 'Triggering AI optimization',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.SimpleAdaptiveAMM as Address,
                abi: trustLayerContracts.abis.SimpleAdaptiveAMM,
                functionName: 'optimize',
            });
        
        await walletActions.executeTransaction('AI Optimization', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const getAIPrediction = useCallback(async (market: string) => {
        if (!publicClient) return { prediction: '0', confidence: 0 };

        try {
            const prediction = await publicClient.readContract({
                address: trustLayerContracts.SimpleAIOracle as Address,
                abi: trustLayerContracts.abis.SimpleAIOracle,
                functionName: 'getPrediction',
                args: [market],
            });
            
            return {
                prediction: formatUnits((prediction as any[])[0], 18),
                confidence: Number((prediction as any[])[1])
            };
        } catch (error) {
            console.error("Failed to get AI prediction:", error);
            return { prediction: '0', confidence: 0 };
        }
    }, [publicClient]);

    const updateAIModel = useCallback(async () => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to update AI model.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: trustLayerContracts.SimpleAIOracle,
            details: 'Updating AI model',
        };

        const txFunction = () =>
            writeContractAsync({
                address: trustLayerContracts.SimpleAIOracle as Address,
                abi: trustLayerContracts.abis.SimpleAIOracle,
                functionName: 'updateModel',
            });
        
        await walletActions.executeTransaction('Update AI Model', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

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