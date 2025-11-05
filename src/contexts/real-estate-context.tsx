
"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';
import { type Address, formatUnits, parseUnits } from 'viem';

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

export interface PropertyToken {
  propertyId: string;
  tokenAddress: Address;
  pricePerToken: string;
  totalSupply: string;
  circulatingSupply: string;
  owner: Address;
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
  listPropertyForTokenization: (property: any) => Promise<void>;
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

  const { walletState, walletActions } = useWallet();
  const { isConnected, walletAddress } = walletState;
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();

  const refreshProperties = useCallback(async () => {
    if (!walletAddress) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const storedProperties = localStorage.getItem(getLocalStorageKey(walletAddress));
      const allProps: Property[] = storedProperties ? JSON.parse(storedProperties) : [];

      const verifiedProps = allProps.filter(p => p.verificationStatus === 'verified');
      const userProps = allProps.filter(p => 
        walletClient && p.owner.toLowerCase() === walletClient.account.address.toLowerCase()
      );

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
  }, [walletAddress, walletClient]);
  
  useEffect(() => {
    if(isConnected && walletAddress) {
      refreshProperties();
    } else {
      setState({ properties: [], userProperties: [], verifiedProperties: [], isLoading: false });
    }
  }, [isConnected, walletAddress, refreshProperties]);

  const createPropertyListing = useCallback(async (propertyData: Omit<Property, 'id' | 'verificationStatus' | 'oracleAttestations' | 'owner'>) => {
    if (!walletClient) {
      toast({ variant: 'destructive', title: 'Wallet not connected' });
      return;
    }
    
    // Simulate submitting to oracle
    walletActions.addTransaction({
      type: 'Vault Deposit', // Mocking as a vault tx for now
      details: `Submitted property "${propertyData.title}" for verification.`
    });

    const newProperty: Property = {
      ...propertyData,
      id: Date.now().toString(),
      verificationStatus: 'pending',
      oracleAttestations: 1,
      owner: walletClient.account.address,
    };

    setState(prev => {
      const updatedProperties = [...prev.properties, newProperty];
      if(walletAddress) {
        localStorage.setItem(getLocalStorageKey(walletAddress), JSON.stringify(updatedProperties));
      }
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
  }, [walletClient, walletAddress, walletActions, toast]);

  const verifyProperty = useCallback(async (propertyId: string) => {
    if (!walletState.userOracleStatus.isProvider) {
      toast({
        variant: 'destructive',
        title: 'Provider Required',
        description: 'You must be a registered oracle provider to verify properties.',
      });
      return;
    }
    
    // Simulate oracle attestation tx
    walletActions.addTransaction({
        type: 'Vote',
        details: `Attested to the validity of property #${propertyId}`
    });

    setState(prev => {
      const updatedProperties = prev.properties.map(p =>
        p.id === propertyId
          ? {
              ...p,
              oracleAttestations: p.oracleAttestations + 1,
              verificationStatus: p.oracleAttestations + 1 >= 3 ? 'verified' : p.verificationStatus,
            }
          : p
      );
      if(walletAddress) {
        localStorage.setItem(getLocalStorageKey(walletAddress), JSON.stringify(updatedProperties));
      }
      return {
          ...prev,
          properties: updatedProperties,
          verifiedProperties: updatedProperties.filter(p => p.verificationStatus === 'verified'),
      };
    });

    toast({
      title: 'Property Verified',
      description: 'Your verification has been recorded.',
    });
  }, [walletState.userOracleStatus.isProvider, walletAddress, toast, walletActions]);

  const purchaseTokens = useCallback(async (propertyId: string, amount: string) => {
    const property = state.properties.find(p => p.id === propertyId);
    if (!walletClient || !property) {
      toast({ variant: 'destructive', title: 'Wallet not connected or property not found' });
      return;
    }
    
    // Simulate purchase tx
    walletActions.addTransaction({
        type: 'Swap',
        details: `Purchased ${amount} tokens for property "${property.title}"`
    });

    toast({
      title: 'Tokens Purchased (Simulated)',
      description: `You have successfully purchased ${amount} tokens.`,
    });

    await refreshProperties();
  }, [walletClient, state.properties, refreshProperties, toast, walletActions]);

  const listPropertyForTokenization = useCallback(async (propertyData: any) => {
    await createPropertyListing(propertyData);
  }, [createPropertyListing]);

  return (
    <RealEstateContext.Provider
      value={{
        state,
        actions: {
          createPropertyListing,
          verifyProperty,
          purchaseTokens,
          listPropertyForTokenization,
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
