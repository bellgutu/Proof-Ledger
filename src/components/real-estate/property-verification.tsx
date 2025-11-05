"use client";
import React, { useState } from 'react';
import { useRealEstate } from '@/contexts/real-estate-context';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export const PropertyVerificationPanel = () => {
  const { state, actions } = useRealEstate();
  const { state: trustState } = useTrustLayer();
  const { properties, isLoading } = state;
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);

  const pendingProperties = properties.filter(p => p.verificationStatus === 'pending');

  const handleVerify = async (propertyId: string) => {
    setIsVerifyingId(propertyId);
    await actions.verifyProperty(propertyId);
    setIsVerifyingId(null);
  };

  if (!trustState.userOracleStatus.isProvider) {
    return null; // Don't show the card if user is not an oracle
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Property Verification Queue
        </CardTitle>
        <CardDescription>
          Verify property listings as a trusted oracle provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : pendingProperties.length === 0 ? (
            <Alert>
              <AlertDescription>
                No properties pending verification.
              </AlertDescription>
            </Alert>
          ) : (
            pendingProperties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{property.title}</h4>
                      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                    <p className="text-sm">{property.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Property Value</div>
                    <div>${parseInt(property.value).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Current Verifications</div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {property.oracleAttestations} / 3
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleVerify(property.id)}
                  className="w-full"
                  variant="outline"
                  disabled={isVerifyingId === property.id}
                >
                  {isVerifyingId === property.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isVerifyingId === property.id ? 'Verifying...' : 'Verify Property'}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  </change>
  <change>
    <file>/src/contexts/trust-layer-context.tsx</file>
    <content><![CDATA["use client";
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

const USDC_ADDRESS = DEPLOYED_CONTRACTS.USDC as Address;
const TRUST_ORACLE_ADDRESS = DEPLOYED_CONTRACTS.TrustOracle as Address;

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
                if(consensus > 0n) currentConsensus = formatUnits(consensus as bigint, 8);
                else throw new Error("Consensus not finalized");
            } catch (e) {
                try {
                    // If current fails, try previous round
                    const prevRoundId = currentRoundId - 1n;
                    if (prevRoundId > 0) {
                      const consensus = await publicClient.readContract({ address: TRUST_ORACLE_ADDRESS, abi: TRUST_ORACLE_ABI, functionName: 'getConsensus', args: [prevRoundId] });
                      if(consensus > 0n) currentConsensus = formatUnits(consensus as bigint, 8);
                    }
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
