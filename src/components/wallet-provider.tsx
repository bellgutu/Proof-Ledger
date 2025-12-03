'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { formatUnits } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { Diamond, Wheat, Building, AlertTriangle } from 'lucide-react';
import { 
  useAccount, 
  useDisconnect, 
  useBalance,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { useContractEvent } from '@/hooks/useContractEvents';
import { useContractWrite, useMintAsset } from '@/hooks/useContractWrites';

// ================ Types ================
export interface SystemAlert {
  id: string;
  source: string;
  message: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  time: string;
  txHash?: string;
  read: boolean;
}

export interface Asset {
  tokenId: string;
  name: string;
  assetType: string;
  status: 'Pending' | 'Verified' | 'Suspended' | 'Insured' | 'In-Transit' | 'Re-verification Required';
  icon: React.ReactNode;
  overview: { [key: string]: string };
  provenance: { status: string; date: string; verifier: string; icon: React.ElementType }[];
  insurance: { status: string; policyId: string; provider: string; coverage: string; nextPremiumDue: string; };
  custody: { current: string; location: string; history: { custodian: string; date: string; }[] };
  valueUSD?: string;
}

interface WalletContextType {
  isConnected: boolean;
  account: `0x${string}` | undefined;
  chainId: number | undefined;
  systemAlerts: SystemAlert[];
  myAssets: Asset[];
  balances: {
    native: string | null;
    usdc: string | null;
  };
  isLoading: boolean;
  error: string | null;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalances: () => Promise<void>;
  markAlertAsRead: (alertId: string) => void;
  clearAllAlerts: () => void;
  // Contract interactions
  contractActions: {
    mintAsset: (assetType: number, assetData: any) => Promise<any>;
    fileClaim: (policyId: string, amount: bigint) => Promise<any>;
    verifyAsset: (tokenId: string) => Promise<any>;
  };
  
  // Contract data
  contractData: {
    userAssets: any[];
    insurancePolicies: any[];
    oracleStatus: any;
  };
  
  // Contract states
  isMinting: boolean;
  isClaiming: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initial alerts
const initialAlerts: SystemAlert[] = [
  { 
    id: '1', 
    source: "SYSTEM", 
    message: "Platform initialized successfully", 
    impact: "LOW", 
    time: new Date().toISOString(), 
    read: true 
  },
];

// USDC addresses
const USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a9c';
const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// ================ Helper Functions ================
const getUSDCAddress = (chainId: number): `0x${string}` | undefined => {
  switch (chainId) {
    case 1: return USDC_MAINNET as `0x${string}`;
    case 11155111: return USDC_SEPOLIA as `0x${string}`;
    default: return undefined;
  }
};

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const createAsset = (tokenId: string, type: 'real_estate' | 'luxury' | 'commodity', status: Asset['status']): Asset => {
  const details = {
    real_estate: {
      name: `Property ID: ${tokenId}`,
      assetType: 'Real Estate',
      icon: <Building key="realestate" className="h-8 w-8 text-blue-400" />,
      custody: { 
        current: 'Owner', 
        location: '123 Main St, Anytown', 
        history: [
          { custodian: 'City Registry', date: '01/01/2023' }
        ]
      }
    },
    luxury: {
      name: `Watch Serial: ${tokenId}`,
      assetType: 'Luxury Good',
      icon: <Diamond key="luxury" className="h-8 w-8 text-purple-400" />,
      custody: { 
        current: 'Secure Vault', 
        location: 'Geneva, CH', 
        history: [
          { custodian: 'Manufacturer', date: '02/15/2023' }
        ]
      }
    },
    commodity: {
      name: `Batch ID: ${tokenId}`,
      assetType: 'Commodity',
      icon: <Wheat key="commodity" className="h-8 w-8 text-amber-400" />,
      custody: { 
        current: 'In-Transit', 
        location: 'Pacific Ocean', 
        history: [
          { custodian: 'Port of Shanghai', date: '03/20/2024' }
        ]
      }
    }
  };

  const specificDetails = details[type];

  return {
    tokenId,
    name: specificDetails.name,
    assetType: specificDetails.assetType,
    status,
    icon: specificDetails.icon,
    overview: {
      "Token ID": tokenId,
      "Minted On": new Date().toLocaleDateString(),
      "Asset Type": specificDetails.assetType,
      "Verification": status === 'Verified' ? "Blockchain Verified" : "Pending"
    },
    provenance: [{
      status: "Digital Twin Minted",
      date: new Date().toLocaleDateString(),
      verifier: "Blockchain Oracle",
      icon: AlertTriangle,
    }],
    insurance: {
      status: status === 'Verified' ? "Active" : "Pending",
      policyId: `POL-${tokenId.substring(0, 4)}`,
      provider: "Digital Asset Insurance Inc.",
      coverage: status === 'Verified' ? "$250,000" : "$0",
      nextPremiumDue: "04/30/2025"
    },
    custody: specificDetails.custody,
    valueUSD: "250,000.00"
  };
};

// ================ Main Provider Component ================
export function WalletProvider({ children }: { children: ReactNode }) {
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(initialAlerts);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const { mint, isLoading: isMinting } = useMintAsset();
  const { executeWrite, isLoading: isClaiming } = useContractWrite();

  // Fetch native balance
  const { 
    data: nativeBalance, 
    refetch: refetchNativeBalance, 
    isLoading: isNativeLoading 
  } = useBalance({
    address,
  });

  // Fetch USDC balance
  const usdcAddress = chainId ? getUSDCAddress(chainId) : undefined;
  const { 
    data: usdcBalance, 
    refetch: refetchUsdcBalance, 
    isLoading: isUsdcLoading 
  } = useBalance({
    address,
    token: usdcAddress,
  });
  
  const fetchUserAssets = useCallback(async (userAddress: `0x${string}`) => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      // Mock implementation
      const mockAssets: Asset[] = [
        createAsset('12345', 'real_estate', 'Verified'),
        createAsset('LX-987', 'luxury', 'In-Transit'),
        createAsset('AG-WHT-01', 'commodity', 'Verified'),
      ];
      
      setMyAssets(mockAssets);
      
      addAlert({
        source: "ASSETS LOADED",
        message: `Loaded ${mockAssets.length} digital assets`,
        impact: "LOW"
      });
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      setError("Failed to load assets");
      addAlert({
        source: "ASSET ERROR",
        message: "Could not load digital assets",
        impact: "MEDIUM"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useContractEvent({
    contractName: 'ProofLedgerCore',
    eventName: 'DigitalTwinMinted',
    onEvent: (event: any) => {
      const [tokenId, assetId, assetType] = event.args;
      addAlert({
        source: 'CONTRACT EVENT',
        message: `Asset ${tokenId.toString()} minted`,
        impact: 'LOW',
      });
      
      if(address) fetchUserAssets(address);
    },
  });

  useContractEvent({
    contractName: 'InsuranceHub',
    eventName: 'ClaimFiled',
    onEvent: (event: any) => {
      const [claimId, policyId, claimant, amount] = event.args;
      addAlert({
        source: 'INSURANCE EVENT',
        message: `Claim ${claimId.toString()} filed for ${formatUnits(amount, 18)}`,
        impact: 'MEDIUM',
      });
    },
  });

  // ================ Balance Management ================
  const refreshBalances = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        refetchNativeBalance(),
        refetchUsdcBalance()
      ]);
      
      toast({
        title: "Balances Updated",
        description: "Successfully refreshed wallet balances",
      });
    } catch (err) {
      console.error("Failed to refresh balances:", err);
      setError("Failed to refresh balances");
      toast({
        title: "Balance Error",
        description: "Could not refresh balances",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchNativeBalance, refetchUsdcBalance, toast]);

  // ================ Alert Management ================
  const addAlert = useCallback((alert: Omit<SystemAlert, 'id' | 'time' | 'read'>) => {
    const newAlert: SystemAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: new Date().toISOString(),
      read: false
    };
    
    setSystemAlerts(prev => [newAlert, ...prev].slice(0, 20));
    
    if (alert.impact === 'HIGH' || alert.impact === 'CRITICAL') {
      toast({
        title: alert.source,
        description: alert.message,
        variant: alert.impact === 'CRITICAL' ? 'destructive' : 'default'
      });
    }
  }, [toast]);

  const markAlertAsRead = useCallback((alertId: string) => {
    setSystemAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  }, []);

  const clearAllAlerts = useCallback(() => {
    setSystemAlerts([]);
    toast({
      title: "Alerts Cleared",
      description: "All system alerts have been cleared"
    });
  }, [toast]);

  const disconnectWallet = useCallback(() => {
    try {
      disconnect();
      setMyAssets([]);
      setError(null);
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected wallet"
      });
    } catch (err) {
      console.error("Disconnection error:", err);
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect wallet",
        variant: "destructive"
      });
    }
  }, [disconnect, toast]);

  const switchNetworkHandler = useCallback(async (targetChainId: number) => {
    try {
      setIsLoading(true);
      if(switchChain) {
        await switchChain({ chainId: targetChainId });
      }
      
      toast({
        title: "Network Switched",
        description: "Successfully switched network"
      });
    } catch (err: any) {
      console.error("Network switch error:", err);
      toast({
        title: "Network Switch Failed",
        description: err.message || "Could not switch network",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [switchChain, toast]);

  // ================ Effects ================
  useEffect(() => {
    if (address) {
      fetchUserAssets(address);
    } else {
      setMyAssets([]);
    }
  }, [address, fetchUserAssets]);

  useEffect(() => {
    if (isConnected && address) {
      addAlert({
        source: "WALLET CONNECTED",
        message: `Connected to ${formatAddress(address)}`,
        impact: "LOW"
      });
      
      refreshBalances();
    }
  }, [isConnected, address]);

  // Auto-refresh balances
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      refreshBalances();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [address, refreshBalances]);
  
  const contractActions = useMemo(() => ({
    mintAsset: async (assetType: number, assetData: any) => {
      return mint(assetType, assetData);
    },
    fileClaim: async (policyId: string, amount: bigint) => {
      return executeWrite({
        contractName: 'InsuranceHub',
        functionName: 'fileClaim',
        args: [policyId, amount],
      });
    },
    verifyAsset: async (tokenId: string) => {
      return executeWrite({
        contractName: 'TrustOracle',
        functionName: 'verifyAsset',
        args: [tokenId],
      });
    },
  }), [mint, executeWrite]);

  // ================ Context Value ================
  const contextValue: WalletContextType = useMemo(() => ({
    isConnected,
    account: address,
    chainId,
    systemAlerts,
    myAssets,
    balances: {
      native: nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null,
      usdc: usdcBalance ? formatUnits(usdcBalance.value, usdcBalance.decimals) : null,
    },
    isLoading: isLoading || isNativeLoading || isUsdcLoading,
    error,
    disconnectWallet,
    switchNetwork: switchNetworkHandler,
    refreshBalances,
    markAlertAsRead,
    clearAllAlerts,
    contractActions,
    contractData: {
      userAssets: myAssets,
      insurancePolicies: [],
      oracleStatus: null,
    },
    isMinting,
    isClaiming,
  }), [
    isConnected,
    address,
    chainId,
    systemAlerts,
    myAssets,
    nativeBalance,
    usdcBalance,
    isLoading,
    isNativeLoading,
    isUsdcLoading,
    error,
    disconnectWallet,
    switchNetworkHandler,
    refreshBalances,
    markAlertAsRead,
    clearAllAlerts,
    contractActions,
    isMinting,
    isClaiming
  ]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// ================ Custom Hook ================
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// ================ Balance Hook ================
export function useWalletBalances() {
  const { balances, isLoading, refreshBalances } = useWallet();
  
  const formattedBalances = useMemo(() => {
    const ethPrice = 3500; // Mock price - replace with actual price feed
    const nativeValue = parseFloat(balances.native || '0');
    const usdcValue = parseFloat(balances.usdc || '0');
    const totalValue = (nativeValue * ethPrice) + usdcValue;
    
    return {
      eth: balances.native ? `${nativeValue.toFixed(4)} ETH` : '0.0000 ETH',
      usdc: balances.usdc ? `$${usdcValue.toFixed(2)} USDC` : '$0.00 USDC',
      totalUSD: `$${totalValue.toFixed(2)}`,
    };
  }, [balances]);

  return {
    balances: formattedBalances,
    rawBalances: balances,
    isLoading,
    refreshBalances
  };
}
