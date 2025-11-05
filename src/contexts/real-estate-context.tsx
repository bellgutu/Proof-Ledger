"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useTrustLayer } from './trust-layer-context';
import { useWallet } from './wallet-context';
import { type Address, parseUnits } from 'viem';

// Types
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

export interface RealEstateState {
  properties: Property[];
  userProperties: Property[];
  verifiedProperties: Property[];
  isLoading: boolean;
}

export interface RealEstateActions {
  createPropertyListing: (property: Omit<Property, 'id' | 'verificationStatus' | 'oracleAttestations' | 'owner'>) => Promise<void>;
  verifyProperty: (propertyId: string) => Promise<void>;
  purchaseTokens: (propertyId: string, amount: string) => Promise<void>;
  refreshProperties: () => Promise<void>;
}

const RealEstateContext = createContext<{ state: RealEstateState; actions: RealEstateActions } | undefined>(undefined);

const getLocalStorageKey = (address: string) => `real_estate_properties_${address}`;

export const RealEstateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<RealEstateState>({
    properties: [],
    userProperties: [],
    verifiedProperties: [],
    isLoading: true,
  });

  const { state: trustState, actions: trustActions } = useTrustLayer();
  const { walletState, walletActions } = useWallet();
  const { toast } = useToast();

  const refreshProperties = useCallback(async () => {
    if (!walletState.walletAddress) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const storedProperties = localStorage.getItem(getLocalStorageKey(walletState.walletAddress));
      const allProps: Property[] = storedProperties ? JSON.parse(storedProperties) : [];
      
      const verifiedProps = allProps.filter(p => p.verificationStatus === 'verified');
      const userProps = allProps.filter(p => walletState.walletAddress && p.owner.toLowerCase() === walletState.walletAddress.toLowerCase());

      setState({
        properties: allProps,
        userProperties: userProps,
        verifiedProperties: verifiedProps,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletState.walletAddress]);

  useEffect(() => {
    if(walletState.isConnected) {
        refreshProperties();
    }
  }, [walletState.isConnected, refreshProperties]);

  const createPropertyListing = useCallback(async (propertyData: Omit<Property, 'id' | 'verificationStatus' | 'oracleAttestations' | 'owner'>) => {
    if (!walletState.walletAddress) {
      toast({ variant: 'destructive', title: 'Wallet not connected' });
      return;
    }

    walletActions.addTransaction({type: 'Vault Deposit', details: `Submitted property "${propertyData.title}" for verification.`});
    
    const newProperty: Property = {
        ...propertyData,
        id: Date.now().toString(),
        verificationStatus: 'pending',
        oracleAttestations: 1, // Start with one attestation from the lister
        owner: walletState.walletAddress as Address,
    };
    
    setState(prev => {
        const updatedProperties = [...prev.properties, newProperty];
        localStorage.setItem(getLocalStorageKey(walletState.walletAddress!), JSON.stringify(updatedProperties));
        return {
          ...prev,
          properties: updatedProperties,
          userProperties: [...prev.userProperties, newProperty],
        };
    });

    toast({
      title: 'Property Listed Successfully',
      description: 'Your property has been submitted for verification.',
    });
  }, [walletState.walletAddress, walletActions, toast]);

  const verifyProperty = useCallback(async (propertyId: string) => {
    if (!trustState.userOracleStatus.isProvider) {
      toast({
        variant: 'destructive',
        title: 'Provider Required',
        description: 'You must be a registered oracle provider to verify properties.',
      });
      return;
    }
    
    walletActions.addTransaction({type: 'Vote', details: `Attested to the validity of property #${propertyId}`});

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

    toast({
      title: 'Property Verified',
      description: 'Your verification has been recorded.',
    });
  }, [trustState.userOracleStatus.isProvider, walletState.walletAddress, toast, walletActions]);

  const purchaseTokens = useCallback(async (propertyId: string, amount: string) => {
    const property = state.properties.find(p => p.id === propertyId);
    if (!walletState.walletAddress || !property) {
      toast({ variant: 'destructive', title: 'Wallet not connected or property not found' });
      return;
    }
    
    walletActions.addTransaction({type: 'Swap', details: `Purchased ${amount} tokens for property "${property.title}"`});

    toast({
      title: 'Tokens Purchased (Simulated)',
      description: `You have successfully purchased ${amount} tokens.`,
    });

    await refreshProperties();
  }, [walletState.walletAddress, state.properties, refreshProperties, toast, walletActions]);


  return (
    <RealEstateContext.Provider
      value={{
        state,
        actions: {
          createPropertyListing,
          verifyProperty,
          purchaseTokens,
          refreshProperties,
        },
      }}
    >
      {children}
    </RealEstateContext.Provider>
  );
};

export const useRealEstate = () => {
  const context = useContext(RealEstateContext);
  if (context === undefined) {
    throw new Error('useRealEstate must be used within a RealEstateProvider');
  }
  return context;
};
