

"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';
import { type Address, formatUnits, formatEther, parseEther, maxUint256, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';
import LEGACY_CONTRACTS from '@/lib/legacy-contract-addresses.json';

// Enhanced Types for All Contracts
interface TrustOracleData {
  activeProviders: number;
  minStake: string;
  minSubmissions: number;
  latestPrice: string;
  confidence: number;
  lastUpdate: number;
  providers: Array<{ address: Address; stake: string; lastUpdate: number }>;
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
  strategies: Array<{ name: string; value: string; apy: number }>;
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

interface ArbitrageEngineData {
    medianPrice: string;
    profitThreshold: string;
    isPaused: boolean;
    oraclePrices: { address: Address; price: string; name: string }[];
    lastProfit: string;
    totalProfit: string;
}

interface TrustLayerState {
  // Core Contract Data
  mainContractData: { protocolFee: number };
  trustOracleData: TrustOracleData;
  safeVaultData: SafeVaultData;
  proofBondData: ProofBondData;
  forgeMarketData: ForgeMarketData;
  openGovernorData: OpenGovernorData;
  arbitrageEngineData: ArbitrageEngineData;
  
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
  issueTranche: (investor: Address, amount: string, interest: number, duration: number, collateralToken: Address, collateralAmount: string) => Promise<void>;
  redeemBond: (bondId: number) => Promise<void>;
  claimBondYield: (bondId: number) => Promise<void>;
  
  // Trading Functions
  swapTokens: (tokenA: Address, tokenB: Address, amountIn: string, minAmountOut: string) => Promise<void>;
  addLiquidity: (tokenA: Address, tokenB: Address, amountA: string, amountB: string) => Promise<void>;
  removeLiquidity: (poolId: number, liquidity: string) => Promise<void>;
  
  // Governance Functions
  createProposal: (title: string, description: string) => Promise<void>;
  voteOnProposal: (proposalId: number, support: boolean) => Promise<void>;
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
    threshold: 0,
    strategies: [
        { name: 'Aave Lending', value: '150450.23', apy: 4.5 },
        { name: 'Convex Farming', value: '85200.50', apy: 8.1 },
        { name: 'Idle', value: '25349.27', apy: 0 },
    ]
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
  arbitrageEngineData: {
      medianPrice: '0',
      profitThreshold: '0',
      isPaused: false,
      oraclePrices: [],
      lastProfit: '0',
      totalProfit: '0',
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
    const { walletActions } = useWallet();
    const { toast } = useToast();
    const { writeContractAsync } = useWriteContract();

    // Enhanced data fetching for all contracts
    const fetchData = useCallback(async () => {
        if (!publicClient) return;

        setState(prev => ({ ...prev, isLoading: true }));

        // --- MainContract ---
        let protocolFee: bigint = 0n;
        try {
            protocolFee = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.MainContract as Address,
                abi: DEPLOYED_CONTRACTS.abis.MainContract,
                functionName: 'protocolFeePercent',
            });
        } catch (e) {
            console.log("Could not fetch protocolFeePercent, using fallback.", e);
        }

        // --- TrustOracle ---
        let activeProviders: Address[] = [];
        let providerDetails: { address: Address; stake: string; lastUpdate: number; }[] = [];
        try {
            activeProviders = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'listActiveOracles',
            }) as Address[];
            
            const providerDataPromises = activeProviders.map(async (providerAddr) => {
                const [stake, lastUpdate] = await Promise.all([
                    publicClient.readContract({
                        address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                        abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                        functionName: 'stakes',
                        args: [providerAddr]
                    }),
                    publicClient.readContract({
                        address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                        abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                        functionName: 'lastUpdate',
                        args: [providerAddr]
                    })
                ]);
                return { address: providerAddr, stake: formatEther(stake as bigint), lastUpdate: Number(lastUpdate) };
            });
            providerDetails = await Promise.all(providerDataPromises);
            
        } catch (e) {
            console.log("Could not fetch active providers, using fallback.", e);
        }
        let minStake: bigint = 0n;
        try {
            minStake = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'minStake',
            });
        } catch (e) {
             console.log("Could not fetch minStake, using fallback.", e);
        }
        let minSubmissions: bigint = 0n;
        try {
            minSubmissions = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'minSubmissions',
            });
        } catch (e) {
             console.log("Could not fetch minSubmissions, using fallback.", e);
        }

        // --- SimpleAIOracle ---
        let latestPrice = '0';
        let confidence = 0;
        let lastUpdate = 0;
        try {
            const latestData = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SimpleAIOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle,
                functionName: 'getLatestPrediction',
            });
            latestPrice = formatUnits((latestData as any[])[0], 18);
            confidence = Number((latestData as any[])[1]);
            lastUpdate = Number((latestData as any[])[2]);
        } catch (error) {
            console.log("AI Oracle data not available:", error);
        }
        
        // --- SafeVault ---
        let totalAssets: bigint = 0n;
        try {
            totalAssets = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'totalAssets',
            });
        } catch(e) {
            console.error("Could not fetch totalAssets, using fallback.", e);
        }
        let totalDeposits: bigint = 0n;
        let totalWithdrawals: bigint = 0n;
        try {
            totalDeposits = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'totalDeposits',
            });
        } catch (e) {
             console.log("Could not fetch SafeVault totalDeposits, using fallback.", e);
        }
        try {
            totalWithdrawals = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'totalWithdrawals',
            });
        } catch (e) {
             console.log("Could not fetch SafeVault totalWithdrawals, using fallback.", e);
        }
        let owners: Address[] = [];
        let threshold: bigint = 1n;
        let isLocked = false;
        let lockDuration: bigint = 0n;
        try {
            owners = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'getOwners',
            });
        } catch (e) {
             console.log("Could not fetch SafeVault getOwners, using fallback.", e);
        }
        try {
            threshold = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'threshold',
            });
        } catch (e) {
            console.log("Could not fetch SafeVault threshold, using fallback.", e);
        }
        try {
            isLocked = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'isLocked',
            });
        } catch (e) {
            console.log("Could not fetch SafeVault isLocked, using fallback.", e);
        }
        try {
            lockDuration = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'lockDuration',
            });
        } catch (error) {
            console.log("Multi-sig data not available:", error);
        }
        
        // --- ProofBond ---
        let activeBonds: bigint = 0n;
        try {
             activeBonds = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ProofBond as Address,
                abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                functionName: 'totalSupply',
            });
        } catch(e) {
             console.error("Could not fetch active bonds, using fallback.", e);
        }
        let bondTvl: bigint = 0n;
        try {
            // Using balanceOf the vault as a proxy for TVL
             bondTvl = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.abis.ProofBond[0].inputs.find(i => i.name === 'safeVaultAddress_') ? DEPLOYED_CONTRACTS.SafeVault as Address : DEPLOYED_CONTRACTS.ProofBond as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault, 
                functionName: 'totalAssets',
            });
        } catch (error) {
            console.error("Could not fetch bond TVL, using fallback.", error);
        }
        let bondPrice: bigint = 0n;
        let apy: bigint = 0n;
        let trancheSize: bigint = 0n;
        let nextTrancheId: bigint = 0n;
        try {
            // These functions do not exist, so we keep them as 0
            bondPrice = 0n; 
            apy = 0n;
            trancheSize = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ProofBond as Address,
                abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                functionName: 'trancheSize',
            });
        } catch (error) {
             console.log("Bond trancheSize data not available:", error);
        }
        try {
            nextTrancheId = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ProofBond as Address,
                abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                functionName: 'trancheCounter',
            });
        } catch (error) {
            console.log("Bond trancheCounter data not available:", error);
        }


        // --- ForgeMarket ---
        let totalVolume: bigint = 0n;
        try {
            totalVolume = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
                functionName: 'totalVolume',
            });
        } catch(e) {
             console.error("Could not fetch total volume, using fallback.", e);
        }
        let totalLiquidity: bigint = 0n;
        let currentFee: bigint = 0n;
        let aiOptimizedFee: bigint = 0n;
        let efficiency: bigint = 0n;
        let forgeActivePools: bigint = 0n;
        try {
            totalLiquidity = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
                functionName: 'totalLiquidity',
            });
        } catch(e) {
            console.log("Could not fetch forge totalLiquidity, using fallback.", e);
        }
        try {
            currentFee = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
                functionName: 'currentFee',
            });
        } catch (e) {
            console.log("Could not fetch forge currentFee, using fallback.", e);
        }
        try {
            aiOptimizedFee = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AdaptiveMarketMaker as Address,
                abi: DEPLOYED_CONTRACTS.abis.AdaptiveMarketMaker,
                functionName: 'getOptimizedFee',
            });
        } catch(e) {
            console.log("Could not fetch AMM optimized fee, using fallback.", e);
        }
        try {
            efficiency = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SimpleAdaptiveAMM as Address,
                abi: DEPLOYED_CONTRACTS.abis.SimpleAdaptiveAMM,
                functionName: 'getEfficiency',
            });
        } catch(e) {
            console.log("Could not fetch AMM efficiency, using fallback.", e);
        }
        try {
            forgeActivePools = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
                functionName: 'activePools',
            });
        } catch (error) {
            console.log("AI market data not available:", error);
        }
        
        // --- OpenGovernor ---
        let proposalCount: bigint = 0n;
        let treasuryBalance: bigint = 0n;
        let activeProposalsCount: number = 0;
        let quorum: bigint = 0n;
        let votingPeriod: bigint = 0n;
        try {
            proposalCount = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'proposalCount',
            });
        } catch(e) {
            console.error("Could not fetch proposalCount, using fallback.", e);
        }
        try {
            const treasuryAddress = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'treasury',
            });
            treasuryBalance = await publicClient.getBalance({ address: treasuryAddress as Address });
        } catch(e) {
            console.error("Could not fetch treasury balance, using fallback.", e);
        }
        try {
            if (proposalCount > 0n) {
                const activeProposalsPromises = Array.from({ length: Math.min(Number(proposalCount), 10) }, (_, i) => 
                    publicClient.readContract({
                        address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                        abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                        functionName: 'state',
                        args: [BigInt(i + 1)],
                    })
                );
                const proposalStates = await Promise.all(activeProposalsPromises);
                activeProposalsCount = proposalStates.filter(s => s === 1).length;
            }
        } catch(e) {
            console.error("Could not fetch proposal states, using fallback.", e);
        }
        try {
            quorum = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'quorum',
            });
        } catch(e) {
            console.error("Could not fetch quorum, using fallback.", e);
        }
        try {
            votingPeriod = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'votingPeriod',
            });
        } catch(e) {
            console.error("Could not fetch voting period, using fallback.", e);
        }


        // --- ArbitrageEngine ---
        let medianPrice: bigint = 0n;
        let profitThreshold: bigint = 0n;
        let isPaused: boolean = false;
        let oraclePrices: { address: Address; price: string; name: string }[] = [];
        try {
            const oracleAddresses = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ArbitrageEngine as Address,
                abi: DEPLOYED_CONTRACTS.abis.ArbitrageEngine,
                functionName: 'getOracles',
            }) as Address[];

            const prices = await Promise.all(oracleAddresses.map(async (oracleAddr, i) => {
                try {
                    const price = await publicClient.readContract({
                        address: oracleAddr,
                        abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle, // Assuming all use this ABI
                        functionName: 'latestAnswer',
                    }) as bigint;
                    return { address: oracleAddr, price: formatUnits(price, 8), name: `Oracle ${i + 1}` }; // Assuming 8 decimals for oracle price
                } catch {
                    return { address: oracleAddr, price: '0', name: `Oracle ${i + 1}` };
                }
            }));
            oraclePrices = prices;
            
            medianPrice = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ArbitrageEngine as Address,
                abi: DEPLOYED_CONTRACTS.abis.ArbitrageEngine,
                functionName: 'getMedianPrice',
            });
            profitThreshold = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ArbitrageEngine as Address,
                abi: DEPLOYED_CONTRACTS.abis.ArbitrageEngine,
                functionName: 'profitThreshold',
            });
            isPaused = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.ArbitrageEngine as Address,
                abi: DEPLOYED_CONTRACTS.abis.ArbitrageEngine,
                functionName: 'isPaused',
            });
        } catch (e) {
            console.error("Could not fetch Arbitrage Engine data.", e);
        }

        // --- AI Data ---
        let currentPrediction = '0';
        let aiConfidence = 0;
        let lastOptimization = 0;
        let efficiencyGain = 0;
        let gasSavings = 0;
        try {
            const aiData = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SimpleAIOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle,
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

        // --- Predictive Liquidity Data ---
        let predictedLiquidity = '0';
        let predictionAccuracy = 0;
        try {
            const liquidityData = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                functionName: 'getPrediction',
            });
            predictedLiquidity = formatUnits((liquidityData as any[])[0], 18);
            predictionAccuracy = Number((liquidityData as any[])[1]);
        } catch (error) {
            console.log("Predictive liquidity data not available:", error);
        }

        setState({
            mainContractData: { protocolFee: Number(protocolFee) },
            trustOracleData: { 
                activeProviders: activeProviders.length, 
                minStake: formatEther(minStake), 
                minSubmissions: Number(minSubmissions),
                latestPrice,
                confidence,
                lastUpdate,
                providers: providerDetails
            },
            safeVaultData: { 
                ...initialTrustLayerState.safeVaultData, // keep mocked strategies
                totalAssets: formatUnits(totalAssets, 6),
                totalDeposits: formatUnits(totalDeposits, 6),
                totalWithdrawals: formatUnits(totalWithdrawals, 6),
                userBalance: '0',
                isLocked,
                lockDuration: Number(lockDuration),
                owners,
                threshold: Number(threshold)
            },
            proofBondData: { 
                activeBonds: Number(activeBonds), 
                tvl: formatUnits(bondTvl, 6),
                totalSupply: formatUnits(activeBonds, 18),
                bondPrice: formatUnits(bondPrice, 18),
                apy: Number(apy),
                userBonds: [],
                trancheSize: formatUnits(trancheSize, 18),
                nextTrancheId: Number(nextTrancheId)
            },
            forgeMarketData: { 
                totalVolume: formatUnits(totalVolume, 6),
                totalLiquidity: formatUnits(totalLiquidity, 6),
                activePools: Number(forgeActivePools),
                currentFee: Number(currentFee),
                aiOptimizedFee: Number(aiOptimizedFee),
                efficiency: Number(efficiency),
                userLiquidity: '0',
                pools: []
            },
            openGovernorData: { 
                proposalCount: Number(proposalCount), 
                treasuryValue: formatEther(treasuryBalance), 
                activeProposals: activeProposalsCount,
                votingPower: '0',
                userVotes: [],
                proposals: [],
                quorum: Number(quorum),
                votingPeriod: Number(votingPeriod)
            },
            arbitrageEngineData: {
                medianPrice: formatUnits(medianPrice, 8),
                profitThreshold: formatUnits(profitThreshold, 6),
                isPaused,
                oraclePrices,
                lastProfit: '123.45', // mock
                totalProfit: '5678.90', // mock
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
                currentFee: Number(currentFee),
                optimizedFee: Number(aiOptimizedFee),
                efficiency: Number(efficiency),
                volume24h: '0'
            },
            predictiveLiquidityData: {
                predictedLiquidity,
                accuracy: predictionAccuracy,
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
            isLoading: false,
            lastUpdated: Date.now(),
        });
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

        const minStakeValue = parseEther(state.trustOracleData.minStake);

        const dialogDetails = {
            amount: parseFloat(state.trustOracleData.minStake),
            token: 'ETH',
            to: DEPLOYED_CONTRACTS.TrustOracle,
            details: 'Staking to become an AI Oracle Provider',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'registerOracle',
                value: minStakeValue,
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
            to: DEPLOYED_CONTRACTS.SimpleAIOracle,
            details: `Submitting AI Oracle data: ${price} with ${confidence}% confidence`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.SimpleAIOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle,
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
            to: DEPLOYED_CONTRACTS.TrustOracle,
            details: 'Unstaking from Oracle Provider',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.TrustOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'unregisterAndWithdraw',
            });
        
        await walletActions.executeTransaction('Unstake Oracle', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    // Vault Functions
    const depositToVault = useCallback(async (amount: string) => {
        if (!walletClient) {
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
            to: DEPLOYED_CONTRACTS.SafeVault,
            details: 'Depositing to SafeVault',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'deposit',
                args: [parseUnits(amount, 6), walletClient.account.address],
            });
        
        await walletActions.executeTransaction('Deposit to Vault', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const withdrawFromVault = useCallback(async (amount: string) => {
        if (!walletClient) {
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
            to: DEPLOYED_CONTRACTS.SafeVault,
            details: 'Withdrawing from SafeVault',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.SafeVault as Address,
                abi: DEPLOYED_CONTRACTS.abis.SafeVault,
                functionName: 'withdraw',
                args: [parseUnits(amount, 6), walletClient.account.address, walletClient.account.address],
            });
        
        await walletActions.executeTransaction('Withdraw from Vault', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const approveVault = useCallback(async (amount: string) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to approve.',
            });
            return;
        }

        const dialogDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: DEPLOYED_CONTRACTS.SafeVault,
            details: 'Approving SafeVault to spend USDC',
        };

        const txFunction = () =>
            writeContractAsync({
                address: LEGACY_CONTRACTS.USDC_ADDRESS as Address,
                abi: [{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}],
                functionName: 'approve',
                args: [DEPLOYED_CONTRACTS.SafeVault as Address, parseUnits(amount, 6)],
            });
        
        await walletActions.executeTransaction('Approve Vault', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    // Bond Functions
    const purchaseBond = useCallback(async (amount: string) => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
    
        // Step 1: Approve the ProofBond contract to spend USDC
        const approveDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: DEPLOYED_CONTRACTS.ProofBond,
            details: `Approving ${amount} USDC for bond purchase`
        };
    
        const approveTxFunction = () => writeContractAsync({
            address: LEGACY_CONTRACTS.USDC_ADDRESS as Address,
            abi: [{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}],
            functionName: 'approve',
            args: [DEPLOYED_CONTRACTS.ProofBond as Address, parseUnits(amount, 6)]
        });
    
        try {
            await walletActions.executeTransaction('Approve USDC', approveDetails, approveTxFunction);
        } catch (e) {
            console.error("Approval failed, stopping bond purchase.", e);
            return; // Stop if approval fails
        }
        
        // Step 2: Call issueTranche
        const issueDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: DEPLOYED_CONTRACTS.ProofBond,
            details: `Purchasing bond worth ${amount} USDC`
        };
        
        const interestBP = 500; // 5%
        const durationSeconds = 30 * 24 * 60 * 60; // 30 days
        
        const issueTxFunction = () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.ProofBond as Address,
            abi: DEPLOYED_CONTRACTS.abis.ProofBond,
            functionName: 'issueTranche',
            args: [
                walletClient.account.address, 
                parseUnits(amount, 6), 
                BigInt(interestBP), 
                BigInt(durationSeconds),
                LEGACY_CONTRACTS.USDC_ADDRESS as Address, 
                parseUnits(amount, 6)
            ]
        });
    
        await walletActions.executeTransaction('Purchase Bond', issueDetails, issueTxFunction, fetchData);
    
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const issueTranche = useCallback(async (investor: Address, amount: string, interest: number, duration: number, collateralToken: Address, collateralAmount: string) => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
        
        const dialogDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: DEPLOYED_CONTRACTS.ProofBond,
            details: `Issuing bond tranche of ${amount} for ${investor.slice(0,6)}...`
        };

        const txFunction = () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.ProofBond as Address,
            abi: DEPLOYED_CONTRACTS.abis.ProofBond,
            functionName: 'issueTranche',
            args: [investor, parseUnits(amount, 6), BigInt(interest), BigInt(duration), collateralToken, parseUnits(collateralAmount, 18)] // Assuming collateral is WETH
        });

        await walletActions.executeTransaction('Issue Bond Tranche', dialogDetails, txFunction, fetchData);
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
            to: DEPLOYED_CONTRACTS.ProofBond,
            details: `Redeeming Bond #${bondId}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.ProofBond as Address,
                abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                functionName: 'redeemTranche',
                args: [BigInt(bondId)],
            });
        
        await walletActions.executeTransaction('Redeem Bond', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const claimBondYield = useCallback(async (bondId: number) => {
        toast({
            variant: 'destructive',
            title: 'Not Implemented',
            description: '`claimYield` is not a function in the ProofBond contract. Use "Redeem" to claim principal and yield at maturity.',
        });
    }, [toast]);

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
            to: DEPLOYED_CONTRACTS.ForgeMarket,
            details: `Swapping ${amountIn} tokens`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
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
            to: DEPLOYED_CONTRACTS.ForgeMarket,
            details: 'Adding liquidity to pool',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
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
            to: DEPLOYED_CONTRACTS.ForgeMarket,
            details: 'Removing liquidity from pool',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.ForgeMarket as Address,
                abi: DEPLOYED_CONTRACTS.abis.ForgeMarket,
                functionName: 'removeLiquidity',
                args: [BigInt(poolId), parseUnits(liquidity, 18)],
            });
        
        await walletActions.executeTransaction('Remove Liquidity', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    // Governance Functions
    const createProposal = useCallback(async (title: string, description: string) => {
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
            to: DEPLOYED_CONTRACTS.OpenGovernor,
            details: `Creating proposal: ${title}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'propose',
                args: [[], [], [], description],
            });
        
        await walletActions.executeTransaction('Create Proposal', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const voteOnProposal = useCallback(async (proposalId: number, support: boolean) => {
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
            to: DEPLOYED_CONTRACTS.OpenGovernor,
            details: `Voting ${support ? 'for' : 'against'} proposal #${proposalId}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'castVote',
                args: [BigInt(proposalId), support ? 1 : 0],
            });
        
        await walletActions.executeTransaction('Vote on Proposal', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const executeProposal = useCallback(async (proposalId: number) => {
        if (!walletClient) {
            toast({
                variant: 'destructive',
                title: 'Wallet not connected',
                description: 'Please connect your wallet to execute proposal.',
            });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: DEPLOYED_CONTRACTS.OpenGovernor,
            details: `Executing proposal #${proposalId}`,
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                functionName: 'execute',
                args: [[],[],[], ''], // Simplified for now
            });
        
        await walletActions.executeTransaction('Execute Proposal', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

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
            to: DEPLOYED_CONTRACTS.SimpleAdaptiveAMM,
            details: 'Triggering AI optimization',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.SimpleAdaptiveAMM as Address,
                abi: DEPLOYED_CONTRACTS.abis.SimpleAdaptiveAMM,
                functionName: 'optimize',
            });
        
        await walletActions.executeTransaction('AI Optimization', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const getAIPrediction = useCallback(async (market: string) => {
        if (!publicClient) return { prediction: '0', confidence: 0 };

        try {
            const prediction = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.SimpleAIOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle,
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
            to: DEPLOYED_CONTRACTS.SimpleAIOracle,
            details: 'Updating AI model',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.SimpleAIOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.SimpleAIOracle,
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
            issueTranche,
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
