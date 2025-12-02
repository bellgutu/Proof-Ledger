
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
  WagmiConfig,
} from 'wagmi';
import { config } from '@/config/web3';
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


// ================ Contract ABIs ================
const USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a9c';
const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

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
  connectorId: string | undefined;
  systemAlerts: SystemAlert[];
  myAssets: Asset[];
  balances: {
    native: string | null;
    usdc: string | null;
    [key: string]: string | null;
  };
  isLoading: boolean;
  isBalanceLoading: boolean;
  error: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalances: () => Promise<void>;
  markAlertAsRead: (alertId: string) => void;
  clearAllAlerts: () => void;
  supportedChains: any[];
  currentChain: { id: number; name: string } | null;
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
  { 
    id: '2', 
    source: "ORACLE", 
    message: "GIA Grading Oracle latency > 5s", 
    impact: "MEDIUM", 
    time: new Date(Date.now() - 60000).toISOString(), 
    read: false 
  },
  { 
    id: '3', 
    source: "CONTRACT ALERT", 
    message: "Shipment SH-734-556 triggered Parametric Claim", 
    impact: "HIGH", 
    time: new Date(Date.now() - 300000).toISOString(), 
    read: false 
  },
];

// ================ Helper Functions ================
const getUSDCAddress = (chainId: number): string => {
  switch (chainId) {
    case 1: return USDC_MAINNET;
    case 11155111: return USDC_SEPOLIA;
    default: return USDC_SEPOLIA;
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
function WalletProvider({ children }: { children: ReactNode }) {
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(initialAlerts);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Fetch native balance
  const { 
    data: nativeBalance, 
    refetch: refetchNativeBalance, 
    isLoading: isNativeLoading 
  } = useBalance({
    address: address,
  });

  // Fetch USDC balance
  const { 
    data: usdcBalance, 
    refetch: refetchUsdcBalance, 
    isLoading: isUsdcLoading 
  } = useBalance({
    address: address,
    token: chainId ? getUSDCAddress(chainId) as `0x${string}` : undefined,
    query: {
      enabled: !!address && !!chainId,
    }
  });

  const isBalanceLoading = isNativeLoading || isUsdcLoading;

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

  // ================ Asset Management ================
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
  }, [addAlert]);

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
      await switchChain({ chainId: targetChainId });
      
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
  }, [isConnected, address, addAlert, refreshBalances]);

  useEffect(() => {
    if (chain) {
      addAlert({
        source: "NETWORK",
        message: `Connected to ${chain.name}`,
        impact: "LOW"
      });
      
      if (address) {
        refreshBalances();
      }
    }
  }, [chain, address, addAlert, refreshBalances]);

  // Auto-refresh balances
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      refreshBalances();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [address, refreshBalances]);

  // ================ Context Value ================
  const contextValue: WalletContextType = useMemo(() => ({
    isConnected,
    account: address,
    chainId: chainId,
    connectorId: 'rainbowkit', // RainbowKit manages connectors
    systemAlerts,
    myAssets,
    balances: {
      native: nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null,
      usdc: usdcBalance ? formatUnits(usdcBalance.value, usdcBalance.decimals) : null,
    },
    isLoading,
    isBalanceLoading,
    error,
    connectWallet: () => {}, // Handled by RainbowKit's ConnectButton
    disconnectWallet,
    switchNetwork: switchNetworkHandler,
    refreshBalances,
    markAlertAsRead,
    clearAllAlerts,
    supportedChains: config.chains.map((c: any) => ({
      id: c.id,
      name: c.name,
      nativeCurrency: c.nativeCurrency
    })),
    currentChain: chain ? { id: chain.id, name: chain.name } : null
  }), [
    isConnected,
    address,
    chainId,
    systemAlerts,
    myAssets,
    nativeBalance,
    usdcBalance,
    isLoading,
    isBalanceLoading,
    error,
    disconnectWallet,
    switchNetworkHandler,
    refreshBalances,
    markAlertAsRead,
    clearAllAlerts,
    chain
  ]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// ================ Wrapper Component ================
export function Web3ProviderWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WagmiConfig config={config}>
        <QueryClientProvider client={new QueryClient()}>
            <RainbowKitProvider>
                <WalletProvider>
                    {children}
                </WalletProvider>
            </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiConfig>
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
  const { balances, isBalanceLoading, refreshBalances } = useWallet();
  
  const formattedBalances = useMemo(() => {
    const ethPrice = 3500;
    const nativeValue = parseFloat(balances.native || '0');
    const usdcValue = parseFloat(balances.usdc || '0');
    const totalValue = (nativeValue * ethPrice) + usdcValue;
    
    return {
      eth: balances.native ? `${nativeValue.toFixed(4)} ETH` : '0.0000 ETH',
      usdc: balances.usdc ? `$${usdcValue.toFixed(2)} USDC` : '$0.00 USDC',
      totalUSD: `$${totalValue.toFixed(2)}`,
      nativeValue,
      usdcValue,
      totalValue
    };
  }, [balances]);

  return {
    balances: formattedBalances,
    rawBalances: balances,
    isLoading: isBalanceLoading,
    refreshBalances
  };
}
