
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import DEPLOYED_CONTRACTS from '@/lib/trustlayer-contract-addresses.json';
import { type Address, formatUnits, formatEther, parseEther, parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

// --- Generic ERC20 ABI for approvals ---
const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// --- TrustOracle ABI (from your provided ABI) ---
const TRUST_ORACLE_ABI = [
  {"inputs":[{"internalType":"uint256","name":"_minStake","type":"uint256"},{"internalType":"uint256","name":"_minSubmissions","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newMinStake","type":"uint256"}],"name":"MinStakeUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newMinSubmissions","type":"uint256"}],"name":"MinSubmissionsUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"ObservationSubmitted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"stake","type":"uint256"}],"name":"OracleRegistered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"address","name":"slasher","type":"address"}],"name":"OracleSlashed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"returnedStake","type":"uint256"}],"name":"OracleUnregistered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"consensusValue","type":"uint256"}],"name":"RoundFinalized","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"consensusForRound","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"finalizeRound","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"getConsensus","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"getObservations","outputs":[{"components":[{"internalType":"address","name":"submitter","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"internalType":"struct TrustOracle.Observation[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"listActiveOracles","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"minStake","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"minSubmissions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"observationCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"oracleAddresses","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"oracles","outputs":[{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"index","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"registerOracle","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"newMin","type":"uint256"}],"name":"setMinStake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"newMin","type":"uint256"}],"name":"setMinSubmissions","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"oracleAddr","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"slashOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"roundId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"submitObservation","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"unregisterAndWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"stateMutability":"payable","type":"receive"}
] as const;

// Types for contract data
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
  currentRoundId: bigint; // NEW: Track current round
}

interface TrustLayerActions {
  refresh: () => Promise<void>;
  registerAsProvider: () => Promise<void>;
  unregisterAndWithdraw: () => Promise<void>;
  submitObservation: (price: string) => Promise<void>; // REMOVED: confidence parameter
  addAssetPair: (tokenA: Address, tokenB: Address) => Promise<void>;
  purchaseBond: (amount: string) => Promise<void>;
  issueTranche: (investor: Address, amount: string, interest: number, duration: number, collateralToken: Address, collateralAmount: string) => Promise<void>;
  redeemBond: (bondId: number) => Promise<void>;
  finalizeRound: (roundId: bigint) => Promise<void>; // NEW: Round finalization
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
  currentRoundId: 0n, // NEW: Initialize round ID
};

const USDC_ADDRESS = DEPLOYED_CONTRACTS.USDC as Address;
const TRUST_ORACLE_ADDRESS = "0x5a92b7E95dC3537E87eC6a755403B9191C9055cD" as Address; // Your TrustOracle address

export const TrustLayerProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TrustLayerState>(initialTrustLayerState);
    const publicClient = usePublicClient({ chainId: DEPLOYED_CONTRACTS.chainId });
    const { data: walletClient } = useWalletClient();
    const { walletActions, walletState } = useWallet();
    const { toast } = useToast();
    const { writeContractAsync } = useWriteContract();

    // Calculate current round ID (hourly rounds)
    const calculateCurrentRoundId = useCallback((): bigint => {
        return BigInt(Math.floor(Date.now() / 1000 / 3600)); // Hourly rounds
    }, []);

    const fetchData = useCallback(async () => {
        if (!publicClient) return;

        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const currentRoundId = calculateCurrentRoundId();
            
            // MainContract Data
            const protocolFeeRate = await publicClient.readContract({
                address: DEPLOYED_CONTRACTS.MainContract as Address,
                abi: DEPLOYED_CONTRACTS.abis.MainContract,
                functionName: 'protocolFeeRate',
            });

            // TrustOracle Data - FIXED: Using correct contract and ABI
            const [minStake, minSubmissions, allProviders] = await Promise.all([
                 publicClient.readContract({ 
                   address: TRUST_ORACLE_ADDRESS, 
                   abi: TRUST_ORACLE_ABI, 
                   functionName: 'minStake' 
                 }),
                 publicClient.readContract({ 
                   address: TRUST_ORACLE_ADDRESS, 
                   abi: TRUST_ORACLE_ABI, 
                   functionName: 'minSubmissions' 
                 }),
                 publicClient.readContract({ 
                   address: TRUST_ORACLE_ADDRESS, 
                   abi: TRUST_ORACLE_ABI, 
                   functionName: 'listActiveOracles' 
                 }),
            ]);
            
            // Get current round consensus if available
            let currentConsensus = '0';
            try {
                const consensus = await publicClient.readContract({
                    address: TRUST_ORACLE_ADDRESS,
                    abi: TRUST_ORACLE_ABI,
                    functionName: 'getConsensus',
                    args: [currentRoundId]
                });
                currentConsensus = formatUnits(consensus as bigint, 8);
            } catch (e) {
                // Round might not be finalized yet
                console.log('No consensus for current round yet');
            }
            
            let userProviderStatus: UserOracleStatus = { isProvider: false, isActive: false, stake: '0' };
            const providerDetails = await Promise.all((allProviders as Address[]).map(async (providerAddress) => {
                const oracleData = await publicClient.readContract({ 
                    address: TRUST_ORACLE_ADDRESS, 
                    abi: TRUST_ORACLE_ABI, 
                    functionName: 'oracles', 
                    args: [providerAddress] 
                });
                
                // FIXED: Proper type assertion
                const data = oracleData as [bigint, boolean, bigint];
                const [ stake, active ] = data;

                if (walletState.isConnected && walletClient && 
                    providerAddress.toLowerCase() === walletClient.account.address.toLowerCase()) {
                    userProviderStatus = {
                        isProvider: true,
                        isActive: active,
                        stake: formatEther(stake)
                    };
                }
                
                return {
                    address: providerAddress,
                    stake: formatEther(stake),
                    active: active,
                    lastUpdate: Date.now()
                };
            }));
            
            // ProofBond Data
            const [bondTrancheSize, bondDecimals] = await Promise.all([
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.ProofBond as Address,
                    abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                    functionName: 'trancheSize',
                }),
                publicClient.readContract({
                    address: DEPLOYED_CONTRACTS.ProofBond as Address,
                    abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                    functionName: 'decimals',
                }),
            ]);
            
            let freshUserBonds: UserBond[] = [];
            if (walletState.isConnected && walletClient) {
                try {
                    const userTrancheIds = await publicClient.readContract({
                        address: DEPLOYED_CONTRACTS.ProofBond as Address,
                        abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                        functionName: 'getInvestorTranches',
                        args: [walletClient.account.address],
                    });
                    
                    if (userTrancheIds && Array.isArray(userTrancheIds)) {
                        const newBonds = await Promise.all(
                            (userTrancheIds as bigint[]).map(async (bondId) => {
                                try {
                                    const bondData = await publicClient.readContract({
                                        address: DEPLOYED_CONTRACTS.ProofBond as Address,
                                        abi: DEPLOYED_CONTRACTS.abis.ProofBond,
                                        functionName: 'tranches',
                                        args: [bondId],
                                    });
                                    const [amount, interest, maturity, investor, redeemed] = bondData as [bigint, bigint, bigint, Address, boolean];
                                    if (!redeemed) {
                                        return {
                                            id: Number(bondId),
                                            amount: formatUnits(amount, 6), // Assuming USDC decimals
                                            maturity: Number(maturity),
                                            yield: (Number(interest) / 100).toFixed(2)
                                        };
                                    }
                                } catch (e) {
                                    console.error(`Error fetching bond ${bondId}:`, e);
                                }
                                return null;
                            })
                        );
                        freshUserBonds = newBonds.filter(b => b !== null) as UserBond[];
                    }
                } catch (e) {
                    console.error("Error fetching user bonds:", e);
                    toast({
                        variant: 'destructive',
                        title: 'Error loading bonds',
                        description: 'Failed to load your bond information'
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
            toast({
                variant: 'destructive',
                title: 'Failed to load data',
                description: 'Please check your connection and try again.'
            });
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [publicClient, walletState.isConnected, walletClient, toast, calculateCurrentRoundId]);
    
    const registerAsProvider = useCallback(async () => {
        if (!walletClient || !state.trustOracleData.minStake) {
            toast({ 
                variant: 'destructive', 
                title: 'Could not register provider', 
                description: 'Wallet not connected or min stake not loaded.'
            });
            return;
        }

        const details = { 
            to: TRUST_ORACLE_ADDRESS, 
            details: `Registering as Oracle Provider with ${state.trustOracleData.minStake} ETH stake` 
        };
        
        const txFunction = () => writeContractAsync({
            address: TRUST_ORACLE_ADDRESS,
            abi: TRUST_ORACLE_ABI,
            functionName: 'registerOracle',
            value: parseEther(state.trustOracleData.minStake)
        });

        await walletActions.executeTransaction('Register as Oracle', details, txFunction, fetchData);
    }, [walletClient, state.trustOracleData.minStake, toast, writeContractAsync, walletActions, fetchData]);

    const unregisterAndWithdraw = useCallback(async () => {
        if (!walletClient) {
            toast({ 
                variant: 'destructive', 
                title: 'Could not unregister', 
                description: 'Wallet not connected.'
            });
            return;
        }

        const details = { 
            to: TRUST_ORACLE_ADDRESS, 
            details: `Unregistering as Oracle Provider and withdrawing stake.` 
        };
        
        const txFunction = () => writeContractAsync({
            address: TRUST_ORACLE_ADDRESS,
            abi: TRUST_ORACLE_ABI,
            functionName: 'unregisterAndWithdraw',
        });

        await walletActions.executeTransaction('Unregister Oracle', details, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);

    const submitObservation = useCallback(async (price: string) => {
        if (!walletClient) {
            toast({ 
                variant: 'destructive', 
                title: 'Could not submit observation', 
                description: 'Wallet not connected.'
            });
            return;
        }

        const roundId = state.currentRoundId;
        const details = { 
            to: TRUST_ORACLE_ADDRESS, 
            details: `Submitting observation: ${price} for round ${roundId.toString()}` 
        };
        
        const txFunction = () => writeContractAsync({
            address: TRUST_ORACLE_ADDRESS,
            abi: TRUST_ORACLE_ABI,
            functionName: 'submitObservation',
            args: [roundId, parseUnits(price, 8)] // value with 8 decimals
        });
        
        await walletActions.executeTransaction('Submit Observation', details, txFunction, fetchData);
    }, [walletClient, state.currentRoundId, toast, writeContractAsync, walletActions, fetchData]);

    const finalizeRound = useCallback(async (roundId: bigint) => {
        if (!walletClient) {
            toast({ 
                variant: 'destructive', 
                title: 'Could not finalize round', 
                description: 'Wallet not connected.'
            });
            return;
        }

        const details = { 
            to: TRUST_ORACLE_ADDRESS, 
            details: `Finalizing round ${roundId.toString()}` 
        };
        
        const txFunction = () => writeContractAsync({
            address: TRUST_ORACLE_ADDRESS,
            abi: TRUST_ORACLE_ABI,
            functionName: 'finalizeRound',
            args: [roundId]
        });
        
        await walletActions.executeTransaction('Finalize Round', details, txFunction, fetchData);
    }, [walletClient, toast, writeContractAsync, walletActions, fetchData]);
    
    const addAssetPair = useCallback(async (tokenA: Address, tokenB: Address) => {
        toast({ 
            variant: 'destructive', 
            title: 'Function Not Available', 
            description: 'addAssetPair is not a function in the TrustOracle ABI.' 
        });
    }, [toast]);

    const purchaseBond = useCallback(async (amount: string) => {
        if (!walletClient) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
    
        const approveDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: DEPLOYED_CONTRACTS.ProofBond as Address,
            details: `Approving ${amount} USDC for bond purchase`
        };
    
        const approveTxFunction = () => writeContractAsync({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [DEPLOYED_CONTRACTS.ProofBond as Address, parseUnits(amount, 6)]
        });
    
        try {
            await walletActions.executeTransaction('Approve USDC', approveDetails, approveTxFunction);
        } catch (e) {
            console.error("Approval failed, stopping bond purchase.", e);
            return; 
        }
        
        toast({ title: "Approval Successful", description: "Proceeding with bond purchase..." });

        const issueDetails = {
            amount: parseFloat(amount),
            token: 'USDC',
            to: DEPLOYED_CONTRACTS.ProofBond as Address,
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
                USDC_ADDRESS, 
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
            to: DEPLOYED_CONTRACTS.ProofBond as Address,
            details: `Issuing bond tranche of ${amount} for ${investor.slice(0,6)}...`
        };

        const txFunction = () => writeContractAsync({
            address: DEPLOYED_CONTRACTS.ProofBond as Address,
            abi: DEPLOYED_CONTRACTS.abis.ProofBond,
            functionName: 'issueTranche',
            args: [investor, parseUnits(amount, 6), BigInt(interest), BigInt(duration), collateralToken, parseUnits(collateralAmount, 18)]
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
            to: DEPLOYED_CONTRACTS.ProofBond as Address,
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
        if (walletState.isConnected && walletClient) {
            fetchData();
            const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [walletState.isConnected, walletClient, fetchData]);
    
    const value: TrustLayerContextType = {
        state,
        actions: {
            refresh: fetchData,
            registerAsProvider,
            unregisterAndWithdraw,
            submitObservation,
            addAssetPair,
            purchaseBond,
            issueTranche,
            redeemBond,
            finalizeRound // NEW: Added round finalization
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

    