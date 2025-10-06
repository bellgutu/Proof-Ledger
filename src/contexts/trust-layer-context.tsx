
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import * as DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';
import { type Address, formatUnits, formatEther, parseEther } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

interface TrustLayerState {
    mainContractData: { protocolFee: number };
    trustOracleData: { activeProviders: number; minStake: string; minSubmissions: number };
    safeVaultData: { totalAssets: string };
    proofBondData: { activeBonds: number; tvl: string };
    forgeMarketData: { totalVolume: string };
    openGovernorData: { proposalCount: number; treasuryValue: string; activeProposals: number };
    isLoading: boolean;
}

interface TrustLayerActions {
    refresh: () => Promise<void>;
    registerOracleProvider: () => Promise<void>;
}

interface TrustLayerContextType {
    state: TrustLayerState;
    actions: TrustLayerActions;
}

const TrustLayerContext = createContext<TrustLayerContextType | undefined>(undefined);

const initialTrustLayerState: TrustLayerState = {
    mainContractData: { protocolFee: 0 },
    trustOracleData: { activeProviders: 0, minStake: '0', minSubmissions: 0 },
    safeVaultData: { totalAssets: '0' },
    proofBondData: { activeBonds: 0, tvl: '0' },
    forgeMarketData: { totalVolume: '0' },
    openGovernorData: { proposalCount: 0, treasuryValue: '0', activeProposals: 0 },
    isLoading: true,
};

export const TrustLayerProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TrustLayerState>(initialTrustLayerState);
    const publicClient = usePublicClient({ chainId: DEPLOYED_CONTRACTS.chainId });
    const { data: walletClient } = useWalletClient();
    const { walletActions } = useWallet();
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
                functionName: 'protocolFeePercent',
            });

            // TrustOracle
            const activeProviders = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'getActiveProviders',
            });
            const minStake = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'minStake',
            });
            const minSubmissions = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
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
            const treasuryBalance = await publicClient.getBalance({ address: treasuryAddress });
            
            const activeProposalsPromises = Array.from({ length: Number(proposalCount) }, (_, i) => 
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                    abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                    functionName: 'state',
                    args: [BigInt(i + 1)],
                })
            );
            const proposalStates = await Promise.all(activeProposalsPromises);
            const activeProposals = proposalStates.filter(s => s === 1).length;


            setState({
                mainContractData: { protocolFee: Number(protocolFee) },
                trustOracleData: { 
                    activeProviders: activeProviders.length, 
                    minStake: formatEther(minStake), 
                    minSubmissions: Number(minSubmissions) 
                },
                safeVaultData: { totalAssets: formatUnits(totalAssets, 6) },
                proofBondData: { activeBonds: Number(activeBonds), tvl: formatUnits(bondTvl, 6) },
                forgeMarketData: { totalVolume: formatUnits(totalVolume, 6) },
                openGovernorData: { 
                    proposalCount: Number(proposalCount), 
                    treasuryValue: formatEther(treasuryBalance), 
                    activeProposals: activeProposals 
                },
                isLoading: false,
            });

        } catch (error) {
            console.error("Failed to fetch Trust Layer data:", error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [publicClient]);

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
            to: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle,
            details: 'Staking to become an AI Oracle Provider',
        };

        const txFunction = () =>
            writeContractAsync({
                address: DEPLOYED_CONTRACTS.AIPredictiveLiquidityOracle as Address,
                abi: DEPLOYED_CONTRACTS.abis.TrustOracle,
                functionName: 'registerAsProvider',
                value: minStake,
            });
        
        await walletActions.executeTransaction('Register as Oracle', dialogDetails, txFunction, fetchData);
    }, [walletClient, state.trustOracleData.minStake, toast, writeContractAsync, walletActions, fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const value: TrustLayerContextType = {
        state,
        actions: {
            refresh: fetchData,
            registerOracleProvider,
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
