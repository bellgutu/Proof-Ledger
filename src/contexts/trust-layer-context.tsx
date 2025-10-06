
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import * as DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';
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
  userBalance: string;
}

interface ProofBondData {
  activeBonds: number;
  tvl: string;
  userBonds: Array<{ id: number; amount: string; maturity: number; yield: string }>;
}

interface ForgeMarketData {
  totalVolume: string;
}

interface OpenGovernorData {
  proposalCount: number;
  treasuryValue: string;
  activeProposals: number;
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
  mainContractData: { protocolFee: number };
  trustOracleData: TrustOracleData;
  safeVaultData: SafeVaultData;
  proofBondData: ProofBondData;
  forgeMarketData: ForgeMarketData;
  openGovernorData: OpenGovernorData;
  aiData: AIData;
  isLoading: boolean;
}

interface TrustLayerActions {
  refresh: () => Promise<void>;
  registerOracleProvider: () => Promise<void>;
  submitOracleData: (price: string, confidence: number) => Promise<void>;
  depositToVault: (amount: string) => Promise<void>;
  withdrawFromVault: (amount: string) => Promise<void>;
  purchaseBond: () => Promise<void>;
  redeemBond: (bondId: number) => Promise<void>;
  swapTokens: (poolId: number, tokenIn: Address, amountIn: string) => Promise<void>;
  addLiquidity: (poolId: number, amountA: string, amountB: string) => Promise<void>;
  removeLiquidity: (poolId: number, liquidity: string) => Promise<void>;
  createProposal: (description: string) => Promise<void>;
  voteOnProposal: (proposalId: number, support: number) => Promise<void>;
  executeProposal: (description: string) => Promise<void>;
  triggerAIOptimization: () => Promise<void>;
}

interface TrustLayerContextType {
  state: TrustLayerState;
  actions: TrustLayerActions;
}

const TrustLayerContext = createContext<TrustLayerContextType | undefined>(undefined);

const initialTrustLayerState: TrustLayerState = {
    mainContractData: { protocolFee: 0 },
    trustOracleData: { activeProviders: 0, minStake: '0', minSubmissions: 0, latestPrice: '0', confidence: 0, lastUpdate: 0, providers: [] },
    safeVaultData: { totalAssets: '0', userBalance: '0' },
    proofBondData: { activeBonds: 0, tvl: '0', userBonds: [] },
    forgeMarketData: { totalVolume: '0' },
    openGovernorData: { proposalCount: 0, treasuryValue: '0', activeProposals: 0, userVotes: [], proposals: [] },
    aiData: { currentPrediction: '0', confidence: 0, lastOptimization: 0, efficiencyGain: 0, gasSavings: 0, predictions: [] },
    isLoading: true,
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
            const [
                protocolFee,
                activeProviders,
                minStake,
                minSubmissions,
                totalAssets,
                activeBonds,
                bondTvl,
                totalVolume,
                proposalCount,
                treasuryAddress
            ] = await publicClient.multicall({
                contracts: [
                    { address: DEPLOYED_CONTRACTS.MainContract as Address, abi: DEPLOYED_CONTRACTS.abis.MainContract, functionName: 'protocolFeePercent' },
                    { address: DEPLOYED_CONTRACTS.TrustOracle as Address, abi: DEPLOYED_CONTRACTS.abis.TrustOracle, functionName: 'listActiveOracles' },
                    { address: DEPLOYED_CONTRACTS.TrustOracle as Address, abi: DEPLOYED_CONTRACTS.abis.TrustOracle, functionName: 'minStake' },
                    { address: DEPLOYED_CONTRACTS.TrustOracle as Address, abi: DEPLOYED_CONTRACTS.abis.TrustOracle, functionName: 'minSubmissions' },
                    { address: DEPLOYED_CONTRACTS.SafeVault as Address, abi: DEPLOYED_CONTRACTS.abis.SafeVault, functionName: 'totalAssets' },
                    { address: DEPLOYED_CONTRACTS.ProofBond as Address, abi: DEPLOYED_CONTRACTS.abis.ProofBond, functionName: 'totalSupply' },
                    { address: DEPLOYED_CONTRACTS.ProofBond as Address, abi: DEPLOYED_CONTRACTS.abis.ProofBond, functionName: 'totalValueLocked' },
                    { address: DEPLOYED_CONTRACTS.ForgeMarket as Address, abi: DEPLOYED_CONTRACTS.abis.ForgeMarket, functionName: 'totalVolume' },
                    { address: DEPLOYED_CONTRACTS.OpenGovernor as Address, abi: DEPLOYED_CONTRACTS.abis.OpenGovernor, functionName: 'proposalCount' },
                    { address: DEPLOYED_CONTRACTS.OpenGovernor as Address, abi: DEPLOYED_CONTRACTS.abis.OpenGovernor, functionName: 'treasury' },
                ]
            });
            
            const treasuryBalance = await publicClient.getBalance({ address: treasuryAddress.result! });

            const proposalStates = proposalCount.result ? await Promise.all(Array.from({ length: Number(proposalCount.result) }, (_, i) => 
                 publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.OpenGovernor as Address,
                    abi: DEPLOYED_CONTRACTS.abis.OpenGovernor,
                    functionName: 'state',
                    args: [BigInt(i + 1)],
                })
            )) : [];
            const activeProposalsCount = proposalStates.filter(s => s === 1).length;

            setState({
                mainContractData: { protocolFee: Number(protocolFee.result) },
                trustOracleData: { 
                    activeProviders: (activeProviders.result as Address[]).length, 
                    minStake: formatEther(minStake.result!), 
                    minSubmissions: Number(minSubmissions.result),
                    latestPrice: 'N/A', confidence: 0, lastUpdate: 0, providers: []
                },
                safeVaultData: { totalAssets: formatUnits(totalAssets.result!, 6), userBalance: '0' },
                proofBondData: { activeBonds: Number(activeBonds.result), tvl: formatUnits(bondTvl.result!, 6), userBonds: [] },
                forgeMarketData: { totalVolume: formatUnits(totalVolume.result!, 6) },
                openGovernorData: { 
                    proposalCount: Number(proposalCount.result), 
                    treasuryValue: formatEther(treasuryBalance), 
                    activeProposals: activeProposalsCount,
                    userVotes: [], proposals: []
                },
                aiData: { currentPrediction: '0', confidence: 0, lastOptimization: 0, efficiencyGain: 0, gasSavings: 0, predictions: [] },
                isLoading: false,
            });

        } catch (error) {
            console.error("Failed to fetch Trust Layer data:", error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [publicClient]);

    const createTx = async (type: any, details: any, txFunction: any, refresh: any) => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
        await walletActions.executeTransaction(type, details, txFunction, refresh);
    };

    const registerOracleProvider = async () => createTx('Register as Oracle', { amount: parseFloat(state.trustOracleData.minStake), token: 'ETH', to: DEPLOYED_CONTRACTS.TrustOracle }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.TrustOracle as Address, abi: DEPLOYED_CONTRACTS.abis.TrustOracle, functionName: 'registerOracle', value: parseEther(state.trustOracleData.minStake) }), fetchData);
    const submitOracleData = async (price: string, confidence: number) => { toast({ title: "Not Implemented" })};
    const depositToVault = async (amount: string) => createTx('Vault Deposit', { amount: parseFloat(amount), token: 'ETH', to: DEPLOYED_CONTRACTS.SafeVault }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.SafeVault as Address, abi: DEPLOYED_CONTRACTS.abis.SafeVault, functionName: 'deposit', args: [parseEther(amount), walletState.walletAddress as Address], value: parseEther(amount) }), fetchData);
    const withdrawFromVault = async (amount: string) => createTx('Vault Withdraw', { amount: parseFloat(amount), token: 'ETH', to: DEPLOYED_CONTRACTS.SafeVault }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.SafeVault as Address, abi: DEPLOYED_CONTRACTS.abis.SafeVault, functionName: 'withdraw', args: [parseEther(amount), walletState.walletAddress as Address, walletState.walletAddress as Address] }), fetchData);
    const purchaseBond = async () => createTx('Purchase Bond', { amount: 1, token: 'ETH', to: DEPLOYED_CONTRACTS.ProofBond }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.ProofBond as Address, abi: DEPLOYED_CONTRACTS.abis.ProofBond, functionName: 'purchase', value: parseEther('0.1') }), fetchData);
    const redeemBond = async (bondId: number) => createTx('Redeem Bond', { to: DEPLOYED_CONTRACTS.ProofBond }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.ProofBond as Address, abi: DEPLOYED_CONTRACTS.abis.ProofBond, functionName: 'redeem', args: [BigInt(bondId)] }), fetchData);
    const swapTokens = async (poolId: number, tokenIn: Address, amountIn: string) => createTx('Swap Tokens', { to: DEPLOYED_CONTRACTS.AdaptiveMarketMaker }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.AdaptiveMarketMaker as Address, abi: DEPLOYED_CONTRACTS.abis.AdaptiveMarketMaker, functionName: 'swap', args: [BigInt(poolId), tokenIn, parseEther(amountIn)] }), fetchData);
    const addLiquidity = async (poolId: number, amountA: string, amountB: string) => createTx('Add Liquidity', { to: DEPLOYED_CONTRACTS.AdaptiveMarketMaker }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.AdaptiveMarketMaker as Address, abi: DEPLOYED_CONTRACTS.abis.AdaptiveMarketMaker, functionName: 'addLiquidity', args: [BigInt(poolId), parseEther(amountA), parseEther(amountB)] }), fetchData);
    const removeLiquidity = async (poolId: number, liquidity: string) => createTx('Remove Liquidity', { to: DEPLOYED_CONTRACTS.AdaptiveMarketMaker }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.AdaptiveMarketMaker as Address, abi: DEPLOYED_CONTRACTS.abis.AdaptiveMarketMaker, functionName: 'removeLiquidity', args: [BigInt(poolId), parseEther(liquidity)] }), fetchData);
    const createProposal = async (description: string) => createTx('Create Proposal', { to: DEPLOYED_CONTRACTS.OpenGovernor }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.OpenGovernor as Address, abi: DEPLOYED_CONTRACTS.abis.OpenGovernor, functionName: 'propose', args: [[], [], [], description] }), fetchData);
    const voteOnProposal = async (proposalId: number, support: number) => createTx('Vote', { to: DEPLOYED_CONTRACTS.OpenGovernor }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.OpenGovernor as Address, abi: DEPLOYED_CONTRACTS.abis.OpenGovernor, functionName: 'castVote', args: [BigInt(proposalId), support] }), fetchData);
    const executeProposal = async (description: string) => createTx('Execute Proposal', { to: DEPLOYED_CONTRACTS.OpenGovernor }, () => writeContractAsync({ address: DEPLOYED_CONTRACTS.OpenGovernor as Address, abi: DEPLOYED_CONTRACTS.abis.OpenGovernor, functionName: 'execute', args: [[], [], [], "0x" + Buffer.from(description).toString('hex')] }), fetchData);
    const triggerAIOptimization = async () => { toast({ title: "Not Implemented" })};
    
    useEffect(() => { fetchData(); }, [fetchData]);
    
    const value: TrustLayerContextType = {
        state,
        actions: { refresh: fetchData, registerOracleProvider, submitOracleData, depositToVault, withdrawFromVault, purchaseBond, redeemBond, swapTokens, addLiquidity, removeLiquidity, createProposal, voteOnProposal, executeProposal, triggerAIOptimization, unstakeOracle: async () => {}, approveVault: async () => {}, claimBondYield: async () => {}, getAIPrediction: async () => ({prediction: '0', confidence: 0}), updateAIModel: async () => {} }
    };

    return <TrustLayerContext.Provider value={value}>{children}</TrustLayerContext.Provider>;
};

export const useTrustLayer = (): TrustLayerContextType => {
    const context = useContext(TrustLayerContext);
    if (context === undefined) throw new Error('useTrustLayer must be used within a TrustLayerProvider');
    return context;
};
