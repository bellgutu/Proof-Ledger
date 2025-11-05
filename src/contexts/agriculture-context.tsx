
"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './wallet-context';

export interface AgriculturalProduct {
  id: string;
  productType: 'coffee' | 'cocoa' | 'tea' | 'fruits' | 'grains' | 'vegetables' | 'spices';
  origin: string; // Farm location
  farmer: string;
  harvestDate: string;
  quantity: string;
  qualityScore: number;
  certifications: string[]; // Organic, FairTrade, Rainforest Alliance, etc.
  supplyChain: SupplyChainStep[];
  currentOwner: string;
  price: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  oracleAttestations: number;
}

export interface SupplyChainStep {
  step: 'harvesting' | 'processing' | 'storage' | 'transport' | 'export' | 'retail';
  timestamp: string;
  location: string;
  handler: string;
  temperature?: string; // For perishables
  humidity?: string;
  verificationHash: string; // IPFS hash of step verification
}

export interface AgricultureState {
  products: AgriculturalProduct[];
  userProducts: AgriculturalProduct[];
  verifiedProducts: AgriculturalProduct[];
  isLoading: boolean;
}

export interface AgricultureActions {
  registerProduct: (product: Omit<AgriculturalProduct, 'id' | 'verificationStatus' | 'oracleAttestations' | 'supplyChain' | 'currentOwner'>) => Promise<void>;
  addSupplyChainStep: (productId: string, step: Omit<SupplyChainStep, 'verificationHash'>) => Promise<void>;
  verifyProduct: (productId: string, verificationType: string) => Promise<void>;
  purchaseProduct: (productId: string, quantity: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const AgricultureContext = createContext<{ state: AgricultureState; actions: AgricultureActions } | undefined>(undefined);

const getLocalStorageKey = (address: string) => `agri_products_${address}`;

export const AgricultureProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AgricultureState>({
    products: [],
    userProducts: [],
    verifiedProducts: [],
    isLoading: true,
  });
  const { toast } = useToast();
  const { walletState } = useWallet();

  const refreshProducts = useCallback(async () => {
    if (!walletState.walletAddress) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const storedProducts = localStorage.getItem(getLocalStorageKey(walletState.walletAddress));
      const allProps: AgriculturalProduct[] = storedProducts ? JSON.parse(storedProducts) : [];
      
      const verifiedProducts = allProps.filter(p => p.verificationStatus === 'verified');
      const userProducts = allProps.filter(p => walletState.walletAddress && p.currentOwner.toLowerCase() === walletState.walletAddress.toLowerCase());

      setState({
        products: allProps,
        userProducts,
        verifiedProducts,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch agricultural products:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletState.walletAddress]);

  useEffect(() => {
    if(walletState.isConnected) {
        refreshProducts();
    }
  }, [walletState.isConnected]);

  const registerProduct = useCallback(async (productData: any) => {
    if (!walletState.walletAddress) {
      toast({ variant: 'destructive', title: 'Wallet not connected' });
      return;
    }
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const newProduct: AgriculturalProduct = {
        ...productData,
        id: Date.now().toString(),
        verificationStatus: 'pending',
        oracleAttestations: 0,
        currentOwner: walletState.walletAddress,
        supplyChain: [{
          step: 'harvesting',
          timestamp: new Date().toISOString(),
          location: productData.origin,
          handler: productData.farmer,
          verificationHash: `Qm${Date.now()}`
        }]
      };

      setState(prev => {
        const updatedProducts = [...prev.products, newProduct];
        if(walletState.walletAddress) {
          localStorage.setItem(getLocalStorageKey(walletState.walletAddress), JSON.stringify(updatedProducts));
        }
        return {
          ...prev,
          products: updatedProducts,
          userProducts: [...prev.userProducts, newProduct],
          isLoading: false,
        }
      });

      toast({
        title: 'Product Registered',
        description: 'Your agricultural product has been listed for verification.',
      });
    } catch (error) {
      console.error('Failed to register product:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast, walletState.walletAddress]);

  const addSupplyChainStep = useCallback(async (productId: string, stepData: any) => {
    // This is a placeholder for a real implementation
    toast({
      title: 'Supply Chain Updated (Simulated)',
      description: `New step '${stepData.step}' added to product journey for product ID ${productId}.`,
    });
  }, [toast]);

  const verifyProduct = useCallback(async (productId: string, verificationType: string) => {
    // This is a placeholder for a real implementation
    toast({
      title: 'Product Verified (Simulated)',
      description: `${verificationType} verification recorded for product ID ${productId}.`,
    });
  }, [toast]);

  const purchaseProduct = useCallback(async (productId: string, quantity: string) => {
    // This is a placeholder for a real implementation
    toast({
      title: 'Purchase Successful (Simulated)',
      description: `You bought ${quantity} of the product with ID ${productId}.`,
    });
  }, [toast]);

  return (
    <AgricultureContext.Provider
      value={{
        state,
        actions: {
          registerProduct,
          addSupplyChainStep,
          verifyProduct,
          purchaseProduct,
          refreshProducts,
        },
      }}
    >
      {children}
    </AgricultureContext.Provider>
  );
};

export const useAgriculture = () => {
  const context = useContext(AgricultureContext);
  if (context === undefined) {
    throw new Error('useAgriculture must be used within a AgricultureProvider');
  }
  return context;
};
