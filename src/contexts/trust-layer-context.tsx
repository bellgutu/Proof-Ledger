"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';
import { type Address, formatUnits, formatEther, parseEther, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

// --- ABIs ---
const TRUST_ORACLE_ABI = DEPLOYED_CONTRACTS.abis.TrustOracle;
const PROOF_BOND_ABI = DEPLOYED_CONTRACTS.abis.ProofBond;

// --- TYPE DEFINITIONS ---
interface ProviderDetails {
    address: Address;
    stake: string;
    lastUpdate: number;
    active: boolean;
}

interface TrustOracleData {
  activeProviders: number;
  minStake: string;
  minSubmissions: number;
  providers: ProviderDetails[];
  activePairIds: bigint[];
  latestPrice: string;
}

interface MainContractData {
    protocolFee: number;
}

interface SafeVaultData {
  totalAssets: string;
  strategies: Array<{ name: string; value: string; apy: number }>;
}

export interface UserBond {
    id: number;
    amount: string;
    maturity: number;
    yield: string;
}

interface ProofBondData {
  tvl: string;
  userBonds: UserBond[];
  trancheSize: string;
}

interface ArbitrageEngineData {
  isPaused: boolean;
  profitThreshold: string;
  totalProfit: string;
}

interface UserOracleStatus {
    isProvider: boolean;
    isActive: boolean;
    stake: string;
}

interface TrustLayerState {
  mainContractData: MainContractData;
  trustOracleData: TrustOracleData;
  safeVaultData: SafeVaultData;
  proofBondData: ProofBondData;
  arbitrageEngineData: ArbitrageEngineData;
  isLoading: boolean;
  lastUpdated: number;
  userOracleStatus: UserOracleStatus;
  currentRoundId: bigint;
}

interface TrustLayerActions {
  refresh: () => Promise<void>;
  registerAsProvider: () => Promise<void>;
  unregisterAndWithdraw: () => Promise<void>;
  submitObservation: (price: string) => Promise<void>;
  addAssetPair: (tokenA: Address, tokenB: Address) => Promise<void>;
  purchaseBond: (amount: string) => Promise<void>;
  issueTranche: (investor: Address, amount: string, interest: number, duration: number, collateralToken: Address, collateralAmount: string) => Promise<void>;
  redeemBond: (bondId: number) => Promise<void>;
  finalizeRound: (roundId: bigint) => Promise<void>;
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
    providers: [],
    activePairIds: [],
    latestPrice: '0'
  },
  safeVaultData: {
    totalAssets: '1250000',
    strategies: [
        { name: 'Aave Lending', value: '750450.23', apy: 4.5 },
        { name: 'Convex Farming', value: '415200.50', apy: 8.1 },
    ]
  },
  proofBondData: {
    tvl: '0',
    userBonds: [],
    trancheSize: '0',
  },
  arbitrageEngineData: {
    isPaused: false,
    profitThreshold: '100',
    totalProfit: '12850.75'
  },
  isLoading: true,
  lastUpdated: 0,
  userOracleStatus: { isProvider: false, isActive: false, stake: '0' },
  currentRoundId: 0n,
};

const TRUST_ORACLE_ADDRESS = DEPLOYED_CONTRACTS.TrustOracle as Address;
const PROOF_BOND_ADDRESS = DEPLOYED_CONTRACTS.ProofBond as Address;


export const TrustLayerProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TrustLayerState>(initialTrustLayerState);
    const publicClient = usePublicClient({ chainId: DEPLOYED_CONTRACTS.chainId });
    const { data: walletClient } = useWalletClient();
    const { walletActions, walletState } = useWallet();
    const { toast } = useToast();
    const { writeContractAsync } = useWriteContract();

    const calculateCurrentRoundId = useCallback((): bigint => {
        return BigInt(Math.floor(Date.now() / 1000 / 3600));
    }, []);

    const fetchData = useCallback(async () => {
        if (!publicClient || !walletState.walletAddress) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const currentRoundId = calculateCurrentRoundId();

            const [
                protocolFeeRate,
                minStake,
                minSubmissions,
                allProviders,
                bondTrancheSize,
                bondDecimals
            ] = await Promise.all([
                 publicClient.readContract({ address: DEPLOYED_CONTRACTS.MainContract as Address, abi: DEPLOYED_CONTRACTS.abis.MainContract, functionName: 'protocolFeeRate' }),
                 publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'minStake' }),
                 publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'minSubmissions' }),
                 publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'listActiveOracles' }),
                 publicClient.readContract({ address: PROOF_BOND_ADDRESS, abi: PROOF_BOND_ABI, functionName: 'trancheSize' }),
                 publicClient.readContract({ address: PROOF_BOND_ADDRESS, abi: PROOF_BOND_ABI, functionName: 'decimals' }),
            ]);

            let currentConsensus = '0';
            try {
                const consensus = await publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'getConsensus', args: [currentRoundId] });
                if(consensus > 0n) currentConsensus = formatUnits(consensus as bigint, 8);
                else throw new Error("Consensus not finalized for current round");
            } catch (e) {
                try {
                    const prevRoundId = currentRoundId > 0n ? currentRoundId - 1n : 0n;
                    if (prevRoundId > 0) {
                      const consensus = await publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'getConsensus', args: [prevRoundId] });
                      if(consensus > 0n) currentConsensus = formatUnits(consensus as bigint, 8);
                    }
                } catch (e2) {
                     console.log('No consensus available for current or previous round.');
                }
            }

            let userProviderStatus: UserOracleStatus = { isProvider: false, isActive: false, stake: '0' };
            const providerDetails = await Promise.all((allProviders as Address[]).map(async (providerAddress) => {
                const oracleData = await publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'oracles', args: [providerAddress] });
                const [ stake, active ] = oracleData as [bigint, boolean, bigint];

                if (walletState.isConnected && walletClient && providerAddress.toLowerCase() === walletClient.account.address.toLowerCase()) {
                    userProviderStatus = { isProvider: true, isActive: active, stake: formatEther(stake) };
                }

                return { address: providerAddress, stake: formatEther(stake), active: active, lastUpdate: Date.now() };
            }));

            // --- ProofBond Data ---
            let freshUserBonds: UserBond[] = [];
            if (walletState.isConnected && walletClient) {
                const userBondIds = await publicClient.readContract({
                    address: PROOF_BOND_ADDRESS,
                    abi: PROOF_BOND_ABI,
                    functionName: 'getInvestorTranches',
                    args: [walletClient.account.address]
                }) as bigint[];

                if (userBondIds.length > 0) {
                    const bondDataPromises = userBondIds.map(id =>
                        publicClient.readContract({
                            address: PROOF_BOND_ADDRESS,
                            abi: PROOF_BOND_ABI,
                            functionName: 'tranches',
                            args: [id]
                        })
                    );
                    const bondResults = await Promise.all(bondDataPromises);
                    
                    const bondDecimalsValue = await publicClient.readContract({ address: PROOF_BOND_ADDRESS, abi: PROOF_BOND_ABI, functionName: 'decimals' });

                    freshUserBonds = bondResults.map((bond, index) => {
                        const [amount, interestBP, maturity] = bond as [bigint, bigint, bigint];
                        return {
                            id: Number(userBondIds[index]),
                            amount: formatUnits(amount, bondDecimalsValue),
                            maturity: Number(maturity),
                            yield: (Number(interestBP) / 100).toFixed(2),
                        };
                    });
                }
            }
            const tvl = freshUserBonds.reduce((acc, bond) => acc + parseFloat(bond.amount), 0);

            setState(prev => ({
                ...prev,
                mainContractData: { protocolFee: Number(protocolFeeRate) / 100 },
                trustOracleData: {
                    minStake: formatEther(minStake as bigint),
                    minSubmissions: Number(minSubmissions),
                    activeProviders: providerDetails.length,
                    providers: providerDetails,
                    activePairIds: [],
                    latestPrice: currentConsensus
                },
                proofBondData: {
                    trancheSize: formatUnits(bondTrancheSize as bigint, bondDecimals as number),
                    userBonds: freshUserBonds,
                    tvl: tvl.toString(),
                },
                userOracleStatus: userProviderStatus,
                currentRoundId,
                isLoading: false,
                lastUpdated: Date.now(),
            }));
        } catch (error) {
            console.error("Failed to fetch Trust Layer data:", error);
            toast({ variant: 'destructive', title: 'Failed to load data', description: 'Please check your connection and try again.' });
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [publicClient, walletState.isConnected, walletState.walletAddress, walletClient, toast, calculateCurrentRoundId]);

    const registerAsProvider = useCallback(async () => {
        if (!walletClient || !state.trustOracleData.minStake) { toast({ variant: 'destructive', title: 'Could not register provider' }); return; }
        const details = { to: TRUST_ORACLE_ADDRESS, details: `Registering as Oracle Provider with ${state.trustOracleData.minStake} ETH stake` };
        const txFunction = () => writeContractAsync({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'registerOracle', value: parseEther(state.trustOracleData.minStake) });
        await walletActions.executeTransaction('Register as Oracle', details, txFunction, fetchData);
    }, [walletClient, state.trustOracleData.minStake, toast, writeContractAsync, walletActions, fetchData]);

    const unregisterAndWithdraw = useCallback(async () => {
        if (!walletClient) { toast({ variant: 'destructive', title: 'Could not unregister' }); return; }
        const details = { to: TRUST_ORACLE_ADDRESS, details: `Unregistering as Oracle Provider and withdrawing stake.` };
        const txFunction = () => writeContractAsync({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'unregisterAndWithdraw' });
        await walletActions.executeTransaction('Unregister Oracle', details, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const submitObservation = useCallback(async (price: string) => {
        if (!walletClient) { toast({ variant: 'destructive', title: 'Could not submit observation' }); return; }
        const roundId = state.currentRoundId;
        const details = { to: TRUST_ORACLE_ADDRESS, details: `Submitting observation: ${price} for round ${roundId.toString()}` };
        const txFunction = () => writeContractAsync({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'submitObservation', args: [roundId, parseUnits(price, 8)] });
        await walletActions.executeTransaction('Submit Observation', details, txFunction, fetchData);
    }, [walletClient, state.currentRoundId, toast, writeContractAsync, walletActions, fetchData]);

    const finalizeRound = useCallback(async (roundId: bigint) => {
        if (!walletClient) { toast({ variant: 'destructive', title: 'Could not finalize round' }); return; }
        const details = { to: TRUST_ORACLE_ADDRESS, details: `Finalizing round ${roundId.toString()}` };
        const txFunction = () => writeContractAsync({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'finalizeRound', args: [roundId] });
        await walletActions.executeTransaction('Finalize Round', details, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    // --- Dummy Implementations for now ---
    const addAssetPair = useCallback(async (tokenA: Address, tokenB: Address) => { toast({ title: 'Not Implemented' }); }, [toast]);
    const purchaseBond = useCallback(async (amount: string) => { toast({ title: 'Not Implemented' }); }, [toast]);
    const issueTranche = useCallback(async (investor: Address, amount: string, interest: number, duration: number, collateralToken: Address, collateralAmount: string) => { toast({ title: 'Not Implemented' }); }, [toast]);
    const redeemBond = useCallback(async (bondId: number) => { toast({ title: 'Not Implemented' }); }, [toast]);

    useEffect(() => {
        if (walletState.isConnected && walletClient) {
            fetchData();
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        } else {
             setState(prev => ({...prev, isLoading: false, userOracleStatus: { isProvider: false, isActive: false, stake: '0' }}));
        }
    }, [walletState.isConnected, walletClient, fetchData]);

    const value: TrustLayerContextType = {
        state,
        actions: {
            refresh: fetchData, registerAsProvider, unregisterAndWithdraw, submitObservation, addAssetPair,
            purchaseBond, issueTranche, redeemBond, finalizeRound
        }
    };

    return <TrustLayerContext.Provider value={value}>{children}</TrustLayerContext.Provider>;
};

export const useTrustLayer = (): TrustLayerContextType => {
    const context = useContext(TrustLayerContext);
    if (context === undefined) {
        throw new Error('useTrustLayer must be used within a TrustLayerProvider');
    }
    return context;
};
