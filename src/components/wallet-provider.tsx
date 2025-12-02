
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
  useConnectors,
  useConnect
} from 'wagmi';
import { wagmiConfig } from '@/config/web3';
import { createWeb3Modal } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'


const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dfb93c6682129035a09c4c7b5e4905a8'

const metadata = {
  name: 'Enterprise Asset Platform',
  description: 'Digital Asset Management Platform',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

createWeb3Modal({
  wagmiConfig,
  projectId,
  chains: wagmiConfig.chains,
  ethereumClient: {} as any,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 40
  }
})

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
  connectWallet: (connectorId?: string) => Promise<void>;
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
    default: return USDC_SEPOLIA; // Fallback to Sepolia
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
          { custodian: 'City Registry', date: '01/01/2023' },
          { custodian: 'Previous Owner', date: '06/15/2022' }
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
          { custodian: 'Manufacturer', date: '02/15/2023' },
          { custodian: 'Retailer', date: '03/01/2023' }
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
          { custodian: 'Port of Shanghai', date: '03/20/2024' },
          { custodian: 'Shipping Line', date: '03/21/2024' }
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
      "Asset ID": `ASSET-${tokenId}`,
      "Minted On": new Date().toLocaleDateString(),
      "Asset Type": specificDetails.assetType,
      "Verification": status === 'Verified' ? "Blockchain Verified" : "Pending Verification",
      "Current Value": "$250,000"
    },
    provenance: [{
      status: "Digital Twin Minted",
      date: new Date().toLocaleDateString(),
      verifier: "Blockchain Oracle Network",
      icon: AlertTriangle,
    }],
    insurance: {
      status: status === 'Verified' ? "Active" : "Pending",
      policyId: `POL-${tokenId.substring(0, 4).toUpperCase()}`,
      provider: "Digital Asset Insurance Inc.",
      coverage: status === 'Verified' ? "$250,000" : "$0",
      nextPremiumDue: status === 'Verified' ? "04/30/2025" : "N/A"
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

  // Wagmi hooks - UPDATED for Wagmi v2
  const { address, isConnected, connector: activeConnector } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { connectors } = useConnectors();
  const { connect } = useConnect();

  const chain = wagmiConfig.chains.find(c => c.id === chainId);

  // Get supported chains from wagmi config
  const supportedChains = wagmiConfig.chains;

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
    
    // Show toast for high/critical alerts
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
      // In production, this would fetch from your smart contracts or API
      // Mock implementation for demonstration
      const mockAssets: Asset[] = [
        createAsset('RE-2024-001', 'real_estate', 'Verified'),
        createAsset('LX-987-WATCH', 'luxury', 'In-Transit'),
        createAsset('AG-WHT-01-2024', 'commodity', 'Verified'),
        createAsset('RE-2024-002', 'real_estate', 'Re-verification Required'),
        createAsset('LX-123-JEWELRY', 'luxury', 'Verified'),
      ];
      
      setMyAssets(mockAssets);
      
      addAlert({
        source: "ASSETS LOADED",
        message: `Successfully loaded ${mockAssets.length} digital assets`,
        impact: "LOW"
      });
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      setError("Failed to load assets");
      addAlert({
        source: "ASSET FETCH ERROR",
        message: "Could not load your digital assets. Please try again.",
        impact: "MEDIUM"
      });
    } finally {
      setIsLoading(false);
    }
  }, [addAlert]);

  // ================ Wallet Connection Management ================
  const connectWallet = useCallback(async (connectorId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (connectorId) {
        // Connect to specific connector
        const connector = connectors.find(c => c.id === connectorId || c.name === connectorId);
        if (!connector) {
          throw new Error(`Connector ${connectorId} not found`);
        }
        await connect({ connector });
      } else {
        // Let user choose (you might want to implement a modal here)
        // For now, use the first available connector
        const firstConnector = connectors[0];
        if (firstConnector) {
          await connect({ connector: firstConnector });
        } else {
          throw new Error("No wallet connectors available");
        }
      }

      toast({
        title: "Wallet Connected",
        description: `Successfully connected to wallet`,
      });

    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
      toast({
        title: "Connection Failed",
        description: err.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [connectors, connect, toast]);

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
      
      const chainName = supportedChains.find(c => c.id === targetChainId)?.name || 'Unknown Network';
      toast({
        title: "Network Switched",
        description: `Connected to ${chainName}`
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
  }, [switchChain, supportedChains, toast]);

  // ================ Effects ================
  // Fetch assets when account changes
  useEffect(() => {
    if (address) {
      fetchUserAssets(address);
    } else {
      setMyAssets([]);
    }
  }, [address, fetchUserAssets]);

  // Monitor connection status
  useEffect(() => {
    if (isConnected && address) {
      addAlert({
        source: "WALLET CONNECTED",
        message: `Connected to ${formatAddress(address)}`,
        impact: "LOW"
      });
      
      // Initial balance fetch
      refreshBalances();
    }
  }, [isConnected, address, addAlert, refreshBalances]);

  // Monitor network changes
  useEffect(() => {
    if (chain) {
      addAlert({
        source: "NETWORK",
        message: `Connected to ${chain.name}`,
        impact: "LOW"
      });
      
      // Refresh balances on network change
      if (address) {
        refreshBalances();
      }
    }
  }, [chain, address, addAlert, refreshBalances]);

  // Auto-refresh balances every 30 seconds
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      refreshBalances();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [address, refreshBalances]);

  // ================ Context Value ================
  const contextValue: WalletContextType = useMemo(() => ({
    isConnected,
    account: address,
    chainId: chainId,
    connectorId: activeConnector?.id,
    systemAlerts,
    myAssets,
    balances: {
      native: nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null,
      usdc: usdcBalance ? formatUnits(usdcBalance.value, usdcBalance.decimals) : null,
    },
    isLoading,
    isBalanceLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork: switchNetworkHandler,
    refreshBalances,
    markAlertAsRead,
    clearAllAlerts,
    supportedChains: supportedChains.map(c => ({
      id: c.id,
      name: c.name,
      nativeCurrency: c.nativeCurrency
    })),
    currentChain: chain ? { id: chain.id, name: chain.name } : null
  }), [
    isConnected,
    address,
    chainId,
    activeConnector,
    systemAlerts,
    myAssets,
    nativeBalance,
    usdcBalance,
    isLoading,
    isBalanceLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetworkHandler,
    refreshBalances,
    markAlertAsRead,
    clearAllAlerts,
    supportedChains,
    chain
  ]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// ================ Wrapper Component for Wagmi ================
export function Web3ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <WalletProvider>
        {children}
      </WalletProvider>
      <Web3Modal projectId={projectId} ethereumClient={{} as any} />
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

// ================ Helper Hook for Balance Display ================
export function useWalletBalances() {
  const { balances, isBalanceLoading, refreshBalances } = useWallet();
  
  const formattedBalances = useMemo(() => {
    const ethPrice = 3500; // Mock ETH price - replace with actual price feed
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
