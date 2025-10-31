
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
    totalAssets: '1250000',
    totalDeposits: '0',
    totalWithdrawals: '0',
    userBalance: '0',
    isLocked: false,
    lockDuration: 0,
    owners: [],
    threshold: 0,
    strategies: [
        { name: 'Aave Lending', value: '750450.23', apy: 4.5 },
        { name: 'Convex Farming', value: '415200.50', apy: 8.1 },
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
    proposalCount: 2, 
    treasuryValue: '2500000', 
    activeProposals: 2,
    votingPower: '0',
    userVotes: [],
    proposals: [],
    quorum: 0,
    votingPeriod: 0
  },
  arbitrageEngineData: {
      medianPrice: '4150.75',
      profitThreshold: '500',
      isPaused: false,
      oraclePrices: [],
      lastProfit: '1250.34',
      totalProfit: '175340.58',
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
    const { walletActions, walletState } = useWallet();
    const { toast } = useToast();
    const { writeContractAsync } = useWriteContract();

    const fetchData = useCallback(async () => {
        if (!publicClient) return;

        setState(prev => ({ ...prev, isLoading: true }));
        try {
            // MainContract
            const protocolFee = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.MainContract as Address,
                abi: DEPLOYED_CONTRACTS.abis.MainContract,
                functionName: 'protocolFeeRate',
            });

            // AIPredictiveLiquidityOracle (TrustOracle)
            const [minStake, minSubmissions, allProviders] = await Promise.all([
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                    abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                    functionName: 'minStake',
                }),
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                    abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                    functionName: 'minSubmissions',
                }),
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                    abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                    functionName: 'listActiveOracles',
                }),
            ]);
            
            const providerDetails = await Promise.all((allProviders as Address[]).map(async (providerAddress: Address) => {
                const providerData = await publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                    abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                    functionName: 'oracles',
                    args: [providerAddress],
                });
                const [stake, active] = providerData as [bigint, boolean];
                return {
                    address: providerAddress,
                    stake: formatEther(stake),
                    lastUpdate: 0 // This ABI doesn't have lastUpdate per oracle
                };
            }));

            // AdvancedPriceOracle
            const latestPriceData = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AdvancedPriceOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AdvancedPriceOracle,
                functionName: 'getPriceWithTimestamp',
                args: [LEGACY_CONTRACTS.WETH_ADDRESS as Address]
            });
            const [price, timestamp, confidence] = latestPriceData as [bigint, bigint, bigint];

            // ProofBond Data
            const [activeBonds, bondTvl, bondTotalSupply] = await Promise.all([
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.ProofBond as Address,
                    abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                    functionName: 'totalSupply',
                }),
                publicClient.readContract({
                    address: LEGACY_CONTRACTS.USDC_ADDRESS as Address,
                    abi: DEPLOYED_CONTRACTS.abis.ProofBond, // Using an ABI that has balanceOf
                    functionName: 'balanceOf',
                    args: [DEPLOYED_CONTRACTS.ProofBond as Address],
                }),
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.ProofBond as Address,
                    abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                    functionName: 'totalSupply',
                }),
            ]);
            
            // User Data
            let isProvider = false;
            let userBonds: any[] = [];
            if (walletState.isConnected && walletClient) {
                const oracleData = await publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                    abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                    functionName: 'oracles',
                    args: [walletClient.account.address],
                });
                isProvider = (oracleData as [bigint, boolean])[1];


                const userBondBalance = await publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.ProofBond as Address,
                    abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                    functionName: 'balanceOf',
                    args: [walletClient.account.address],
                });

                for(let i=0; i < Number(userBondBalance); i++) {
                    const bondId = await publicClient.readContract({
                         address: DEPLOYED_CONTRACTS.ProofBond as Address,
                         abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                         functionName: 'tokenOfOwnerByIndex',
                         args: [walletClient.account.address, BigInt(i)],
                    });
                    const bondData = await publicClient.readContract({
                         address: DEPLOYED_CONTRACTS.ProofBond as Address,
                         abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                         functionName: 'getTranche',
                         args: [bondId],
                    });
                    const [investor, amount, interest, maturity, redeemed] = bondData as [Address, bigint, bigint, bigint, boolean];
                    if(!redeemed) {
                        userBonds.push({
                            id: Number(bondId),
                            amount: formatUnits(amount, 6),
                            maturity: Number(maturity),
                            yield: '0' // This would require more complex calculation
                        });
                    }
                }
            }
            

            setState(prev => ({
                ...prev,
                mainContractData: { protocolFee: Number(protocolFee) / 100 },
                trustOracleData: { 
                    activeProviders: (allProviders as Address[]).length, 
                    minStake: formatEther(minStake as bigint), 
                    minSubmissions: Number(minSubmissions),
                    latestPrice: formatUnits(price, 8),
                    confidence: Number(confidence),
                    lastUpdate: Number(timestamp),
                    providers: providerDetails
                },
                proofBondData: {
                    ...prev.proofBondData,
                    activeBonds: Number(activeBonds),
                    tvl: formatUnits(bondTvl as bigint, 6),
                    totalSupply: formatUnits(bondTotalSupply as bigint, 0), // Assuming no decimals for NFT count
                    userBonds: userBonds,
                },
                userData: {
                    ...prev.userData,
                    isOracleProvider: isProvider,
                },
                isLoading: false,
                lastUpdated: Date.now(),
            }));
        } catch (error) {
            console.error("Failed to fetch Trust Layer data:", error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [publicClient, walletState.isConnected, walletClient]);

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
                functionName: 'registerOracle',
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
        
        const MOCK_ROUND_ID = 0; // In a real scenario, this would be dynamically determined

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.AIPredictiveLiquidityOracle,
                functionName: 'submitObservation',
                args: [BigInt(MOCK_ROUND_ID), parseUnits(price, 8)],
            });
        
        await walletActions.executeTransaction('Submit Oracle Data', dialogDetails, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const unstakeOracle = useCallback(async () => {
         toast({ variant: 'destructive', title: 'Not Implemented' });
    }, [toast]);
    
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
            abi: DEPLOYED_CONTRACTS.abis.ProofBond, // Using proofbond abi as it includes erc20 approve
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
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
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
