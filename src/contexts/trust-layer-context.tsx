

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
  
  // Bond Functions
  purchaseBond: (amount: string) => Promise<void>;
  issueTranche: (investor: Address, amount: string, interest: number, duration: number, collateralToken: Address, collateralAmount: string) => Promise<void>;
  redeemBond: (bondId: number) => Promise<void>;
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
                functionName: 'protocolFeeRate',
            });
        } catch (e) {
            console.log("Could not fetch protocolFeeRate, using fallback.", e);
        }

        // --- TrustOracle ---
        let activeProviders: Address[] = [];
        let providerDetails: { address: Address; stake: string; lastUpdate: number; }[] = [];
        try {
            activeProviders = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                functionName: 'getActiveProviders', // Assuming function exists
            }) as Address[];
            
            const providerDataPromises = activeProviders.map(async (providerAddr) => {
                const [stake, lastUpdate] = await Promise.all([
                    publicClient.readContract({
                        address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                        abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                        functionName: 'providerStakes',
                        args: [providerAddr]
                    }),
                    0 // Mocking last update as it's not in the ABI
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
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                functionName: 'MIN_PROVIDER_STAKE',
            });
        } catch (e) {
             console.log("Could not fetch minStake, using fallback.", e);
        }
        let minSubmissions: bigint = 0n;
        try {
             minSubmissions = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                functionName: 'consensusThreshold',
            });
        } catch (e) {
             console.log("Could not fetch minSubmissions, using fallback.", e);
        }

        // --- AdvancedPriceOracle ---
        let latestPrice = '0';
        let confidence = 0;
        let lastUpdate = 0;
        try {
            const latestData = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AdvancedPriceOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AdvancedPriceOracle,
                functionName: 'getPriceWithTimestamp',
                args: [LEGACY_CONTRACTS.WETH_ADDRESS as Address]
            });
            latestPrice = formatUnits((latestData as any[])[0], 18);
            lastUpdate = Number((latestData as any[])[1]);
            confidence = Number((latestData as any[])[2]);
        } catch (error) {
            console.log("AdvancedPriceOracle data not available:", error);
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
            const usdcAddress = LEGACY_CONTRACTS.USDC_ADDRESS as Address;
            bondTvl = await publicClient.readContract({
                address: usdcAddress,
                abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
                functionName: 'balanceOf',
                args: [DEPLOYED_CONTRACTS.ProofBond as Address]
            });
        } catch (error) {
            console.error("Could not fetch bond TVL, using fallback.", error);
        }

        // --- And so on for other contracts...

        setState(prev => ({
            ...prev,
            mainContractData: { protocolFee: Number(protocolFee) / 100 },
            trustOracleData: { 
                activeProviders: providerDetails.length, 
                minStake: formatEther(minStake), 
                minSubmissions: Number(minSubmissions),
                latestPrice,
                confidence,
                lastUpdate,
                providers: providerDetails
            },
            safeVaultData: {
                ...prev.safeVaultData,
                totalAssets: formatUnits(totalAssets, 6),
            },
            proofBondData: {
                ...prev.proofBondData,
                activeBonds: Number(activeBonds),
                tvl: formatUnits(bondTvl, 6)
            },
            isLoading: false,
            lastUpdated: Date.now(),
        }));
    }, [publicClient]);

    // Enhanced Oracle Functions
    const registerOracleProvider = useCallback(async () => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }

        const minStakeValue = parseEther(state.trustOracleData.minStake);

        const dialogDetails = {
            amount: parseFloat(state.trustOracleData.minStake),
            token: 'ETH',
            to: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle,
            details: 'Staking to become an AI Oracle Provider',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                functionName: 'registerAsProvider',
                value: minStakeValue,
            });
        
        await walletActions.executeTransaction('Register as Oracle', dialogDetails, txFunction, fetchData);
    }, [walletClient, state.trustOracleData.minStake, toast, writeContractAsync, walletActions, fetchData]);

    const submitOracleData = useCallback(async (price: string, confidence: number) => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }

        const dialogDetails = {
            amount: 0,
            token: 'ETH',
            to: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle,
            details: `Submitting Oracle data: ${price} with ${confidence}% confidence`,
        };
        
        const MOCK_PAIR_ID = 0; // Assuming we're submitting for the first pair

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                functionName: 'submitPrediction',
                args: [BigInt(MOCK_PAIR_ID), parseUnits(price, 8), BigInt(0), BigInt(0), BigInt(confidence), '0x0000000000000000000000000000000000000000000000000000000000000000', '0x'],
            });
        
        await walletActions.executeTransaction('Submit Oracle Data', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const unstakeOracle = useCallback(async () => {
         toast({ variant: 'destructive', title: 'Not Implemented' });
    }, [toast]);
    
    // Bond Functions
    const purchaseBond = useCallback(async (amount: string) => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
    
        const approveDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: DEPLOYED_CONTRACTS.ProofBond,
            details: `Approving ${amount} USDC for bond purchase`
        };
    
        const approveTxFunction = () => writeContractAsync({
            address: LEGACY_CONTRACTS.USDC_ADDRESS as Address,
            abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
            functionName: 'approve',
            args: [DEPLOYED_CONTRACTS.ProofBond as Address, parseUnits(amount, 6)]
        });
    
        try {
            await walletActions.executeTransaction('Approve USDC', approveDetails, approveTxFunction);
        } catch (e) {
            console.error("Approval failed, stopping bond purchase.", e);
            return;
        }
        
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
            toast({ variant: 'destructive', title: 'Wallet not connected' });
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
            purchaseBond,
            issueTranche,
            redeemBond
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
