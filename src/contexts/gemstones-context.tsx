
"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

// Re-using from agriculture context for now, can be specialized later
export interface SupplyChainStep {
  step: 'mining' | 'cutting' | 'certification' | 'transport' | 'retail';
  timestamp: string;
  location: string;
  handler: string;
  verificationHash: string; // IPFS hash of step verification
}

export interface Gemstone {
  id: string;
  type: 'diamond' | 'ruby' | 'sapphire' | 'emerald' | 'tanzanite' | 'opal' | 'other';
  origin: string; // Mine location
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  certification: string; // GIA, IGI, etc.
  certificationNumber: string;
  mineToMarket: SupplyChainStep[];
  currentOwner: string;
  price: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  oracleAttestations: number;
  imageHash: string; // IPFS hash of gemstone images
}

export interface GemstoneState {
  gemstones: Gemstone[];
  userGemstones: Gemstone[];
  verifiedGemstones: Gemstone[];
  isLoading: boolean;
}

export interface GemstoneActions {
  registerGemstone: (gemstone: Omit<Gemstone, 'id' | 'verificationStatus' | 'oracleAttestations' | 'mineToMarket' | 'currentOwner'>) => Promise<void>;
  addMineToMarketStep: (gemstoneId: string, step: SupplyChainStep) => Promise<void>;
  verifyGemstone: (gemstoneId: string, verificationType: string) => Promise<void>;
  purchaseGemstone: (gemstoneId: string) => Promise<void>;
  refreshGemstones: () => Promise<void>;
}

const GemstoneContext = createContext<{ state: GemstoneState; actions: GemstoneActions } | undefined>(undefined);

const getLocalStorageKey = (address: string) => `gemstone_products_${address}`;

export const GemstoneProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GemstoneState>({
    gemstones: [],
    userGemstones: [],
    verifiedGemstones: [],
    isLoading: true,
  });

  const { toast } = useToast();
  const { walletState } = useWallet();

  const refreshGemstones = useCallback(async () => {
    if (!walletState.walletAddress) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const storedGemstones = localStorage.getItem(getLocalStorageKey(walletState.walletAddress));
      const allGems: Gemstone[] = storedGemstones ? JSON.parse(storedGemstones) : [];

      const verifiedGemstones = allGems.filter(g => g.verificationStatus === 'verified');
      const userGemstones = allGems.filter(g => walletState.walletAddress && g.currentOwner.toLowerCase() === walletState.walletAddress.toLowerCase());

      setState({
        gemstones: allGems,
        userGemstones,
        verifiedGemstones,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch gemstones:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletState.walletAddress]);

  useEffect(() => {
    if (walletState.isConnected) {
      refreshGemstones();
    }
  }, [walletState.isConnected, refreshGemstones]);

  const registerGemstone = useCallback(async (gemstoneData: any) => {
    if (!walletState.walletAddress) {
      toast({ variant: 'destructive', title: 'Wallet not connected' });
      return;
    }
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const newGemstone: Gemstone = {
        ...gemstoneData,
        id: Date.now().toString(),
        verificationStatus: 'pending',
        oracleAttestations: 0,
        currentOwner: walletState.walletAddress,
        mineToMarket: [{
          step: 'mining',
          timestamp: new Date().toISOString(),
          location: gemstoneData.origin,
          handler: 'Registered Miner', // Placeholder
          verificationHash: `QmGem${Date.now()}`
        }]
      };

      setState(prev => {
        const updatedGemstones = [...prev.gemstones, newGemstone];
        if (walletState.walletAddress) {
          localStorage.setItem(getLocalStorageKey(walletState.walletAddress), JSON.stringify(updatedGemstones));
        }
        return {
          ...prev,
          gemstones: updatedGemstones,
          userGemstones: [...prev.userGemstones, newGemstone],
          isLoading: false,
        };
      });

      toast({
        title: 'Gemstone Registered',
        description: 'Your gemstone has been listed for verification.',
      });
    } catch (error) {
      console.error('Failed to register gemstone:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast, walletState.walletAddress]);

  // Placeholder functions for other actions
  const addMineToMarketStep = useCallback(async (gemstoneId: string, step: SupplyChainStep) => {
    toast({ title: 'Action not implemented', description: 'Adding supply chain steps is a future feature.' });
  }, [toast]);
  const verifyGemstone = useCallback(async (gemstoneId: string, verificationType: string) => {
    toast({ title: 'Action not implemented', description: 'Gemstone verification is a future feature.' });
  }, [toast]);
  const purchaseGemstone = useCallback(async (gemstoneId: string) => {
    toast({ title: 'Action not implemented', description: 'Gemstone purchasing is a future feature.' });
  }, [toast]);

  return (
    <GemstoneContext.Provider
      value={{
        state,
        actions: {
          registerGemstone,
          addMineToMarketStep,
          verifyGemstone,
          purchaseGemstone,
          refreshGemstones,
        },
      }}
    >
      {children}
    </GemstoneContext.Provider>
  );
};

export const useGemstones = () => {
  const context = useContext(GemstoneContext);
  if (context === undefined) {
    throw new Error('useGemstones must be used within a GemstoneProvider');
  }
  return context;
};
