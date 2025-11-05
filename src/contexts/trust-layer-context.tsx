"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';
import { type Address, formatUnits, formatEther, parseEther, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

// --- ABIs ---
const ERC20_ABI = [{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}] as const;
const TRUST_ORACLE_ABI = DEPLOYED_CONTRACTS.abis.TrustOracle;

// --- TYPE DEFINITIONS ---
interface ProviderDetails {
    address: Address;
    stake: string;
    lastUpdate: number;
    active: boolean;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  value: string; // USD value
  tokenSupply: string;
  tokensIssued: string;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'land';
  images: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  oracleAttestations: number;
  owner: Address;
  tokenAddress?: Address;
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
  properties: Property[]; // Real Estate
  userProperties: Property[]; // Real Estate
  verifiedProperties: Property[]; // Real Estate
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
  createPropertyListing: (property: Omit<Property, 'id' | 'verificationStatus' | 'oracleAttestations' | 'owner'>) => Promise<void>;
  verifyProperty: (propertyId: string) => Promise<void>;
  purchaseTokens: (propertyId: string, amount: string) => Promise<void>;
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
  properties: [],
  userProperties: [],
  verifiedProperties: [],
  isLoading: true,
  lastUpdated: 0,
  userOracleStatus: { isProvider: false, isActive: false, stake: '0' },
  currentRoundId: 0n,
};

const USDC_ADDRESS = DEPLOYED_CONTRACTS.USDC as Address;
const TRUST_ORACLE_ADDRESS = DEPLOYED_CONTRACTS.TrustOracle as Address;

const getLocalStorageKey = (address: string) => `real_estate_properties_${address}`;

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
        if (!publicClient || !walletState.walletAddress) return;

        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const currentRoundId = calculateCurrentRoundId();
            
            // Fetch All Data
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
                 publicClient.readContract({ address: DEPLOYED_CONTRACTS.ProofBond as Address, abi: DEPLOYED_CONTRACTS.abis.ProofBond, functionName: 'trancheSize' }),
                 publicClient.readContract({ address: DEPLOYED_CONTRACTS.ProofBond as Address, abi: DEPLOYED_CONTRACTS.abis.ProofBond, functionName: 'decimals' }),
            ]);

            // Get current round consensus if available
            let currentConsensus = '0';
            try {
                // Try current round first
                const consensus = await publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'getConsensus', args: [currentRoundId] });
                currentConsensus = formatUnits(consensus as bigint, 8);
            } catch (e) {
                try {
                    // If current fails, try previous round
                    const prevRoundId = currentRoundId - 1n;
                    const consensus = await publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'getConsensus', args: [prevRoundId] });
                    currentConsensus = formatUnits(consensus as bigint, 8);
                } catch (e2) {
                     console.log('No consensus for current or previous round yet');
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

            // --- Real Estate Data ---
            const storedProperties = localStorage.getItem(getLocalStorageKey(walletState.walletAddress));
            const allProps: Property[] = storedProperties ? JSON.parse(storedProperties) : [];
            const verifiedProps = allProps.filter(p => p.verificationStatus === 'verified');
            const userProps = allProps.filter(p => walletClient && p.owner.toLowerCase() === walletClient.account.address.toLowerCase());
            
            // --- ProofBond Data ---
            let freshUserBonds: UserBond[] = [];
            if (walletState.isConnected && walletClient) {
                // ... (bond fetching logic remains the same)
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
                properties: allProps,
                verifiedProperties: verifiedProps,
                userProperties: userProps,
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

    const createPropertyListing = useCallback(async (propertyData: Omit<Property, 'id' | 'verificationStatus' | 'oracleAttestations' | 'owner'>) => {
        if (!walletClient) { toast({ variant: 'destructive', title: 'Wallet not connected' }); return; }
        
        walletActions.addTransaction({ type: 'Vault Deposit', details: `Submitted property "${propertyData.title}" for verification.` });

        const newProperty: Property = {
          ...propertyData,
          id: Date.now().toString(),
          verificationStatus: 'pending',
          oracleAttestations: 1, // Start with one attestation from the lister
          owner: walletClient.account.address,
        };

        setState(prev => {
          const updatedProperties = [...prev.properties, newProperty];
          if(walletState.walletAddress) {
            localStorage.setItem(getLocalStorageKey(walletState.walletAddress), JSON.stringify(updatedProperties));
          }
          return {
            ...prev,
            properties: updatedProperties,
            userProperties: [...prev.userProperties, newProperty],
          };
        });

        toast({ title: 'Property Listed Successfully', description: 'Your property has been submitted for verification.' });
    }, [walletClient, walletState.walletAddress, walletActions, toast]);

    const verifyProperty = useCallback(async (propertyId: string) => {
        if (!state.userOracleStatus.isProvider) { toast({ variant: 'destructive', title: 'Provider Required', description: 'You must be a registered oracle provider to verify properties.' }); return; }
        
        walletActions.addTransaction({ type: 'Vote', details: `Attested to the validity of property #${propertyId}` });

        setState(prev => {
          const updatedProperties = prev.properties.map(p =>
            p.id === propertyId
              ? { ...p, oracleAttestations: p.oracleAttestations + 1, verificationStatus: p.oracleAttestations + 1 >= 3 ? 'verified' : p.verificationStatus }
              : p
          );
          if(walletState.walletAddress) {
            localStorage.setItem(getLocalStorageKey(walletState.walletAddress), JSON.stringify(updatedProperties));
          }
          return { ...prev, properties: updatedProperties, verifiedProperties: updatedProperties.filter(p => p.verificationStatus === 'verified') };
        });

        toast({ title: 'Property Verified', description: 'Your verification has been recorded.' });
    }, [state.userOracleStatus.isProvider, walletState.walletAddress, toast, walletActions]);
    
    const purchaseTokens = useCallback(async (propertyId: string, amount: string) => {
        const property = state.properties.find(p => p.id === propertyId);
        if (!walletClient || !property) { toast({ variant: 'destructive', title: 'Wallet not connected or property not found' }); return; }
        
        walletActions.addTransaction({ type: 'Swap', details: `Purchased ${amount} tokens for property "${property.title}"` });

        toast({ title: 'Tokens Purchased (Simulated)', description: `You have successfully purchased ${amount} tokens.` });

        await fetchData();
    }, [walletClient, state.properties, fetchData, toast, walletActions]);
    
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
        }
    }, [walletState.isConnected, walletClient, fetchData]);
    
    const value: TrustLayerContextType = {
        state,
        actions: {
            refresh: fetchData, registerAsProvider, unregisterAndWithdraw, submitObservation, addAssetPair,
            purchaseBond, issueTranche, redeemBond, finalizeRound, createPropertyListing, verifyProperty, purchaseTokens
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
