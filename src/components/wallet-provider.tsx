
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { formatUnits } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { Diamond, Wheat, Building, AlertTriangle } from 'lucide-react';
import { 
  useAccount, 
  useDisconnect, 
  useBalance,
  useNetwork,
  useSwitchNetwork,
  WagmiConfig
} from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { wagmiConfig } from '@/config/web3.server';

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
  connectWallet: () => Promise<void>;
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
      custody: { current: 'Owner', location: '123 Main St, Anytown', history: [{custodian: 'City Registry', date: '01/01/2023'}]}
    },
    luxury: {
      name: `Watch Serial: ${tokenId}`,
      assetType: 'Luxury Good',
      icon: <Diamond key="luxury" className="h-8 w-8 text-purple-400" />,
      custody: { current: 'Secure Vault', location: 'Geneva, CH', history: [{custodian: 'Manufacturer', date: '02/15/2023'}]}
    },
    commodity: {
      name: `Batch ID: ${tokenId}`,
      assetType: 'Commodity',
      icon: <Wheat key="commodity" className="h-8 w-8 text-amber-400" />,
      custody: { current: 'In-Transit', location: 'Pacific Ocean', history: [{custodian: 'Port of Shanghai', date: '03/20/2024'}]}
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
      "Verification": "Blockchain Verified"
    },
    provenance: [{
      status: "Digital Twin Minted",
      date: new Date().toLocaleDateString(),
      verifier: formatAddress('0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'),
      icon: AlertTriangle,
    }],
    insurance: {
      status: "Active",
      policyId: `POL-${tokenId.substring(0,4)}`,
      provider: "Digital Asset Insurance Inc.",
      coverage: "$250,000",
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
  const { toast } = useToast();

  // Wagmi hooks
  const { open: openModal } = useWeb3Modal();
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { chain, chains: supportedChains } = useNetwork();
  const { disconnect } = useDisconnect();
  const { switchNetworkAsync } = useSwitchNetwork();

  // Fetch native balance
  const { data: nativeBalance, refetch: refetchNativeBalance, isLoading: isNativeLoading } = useBalance({
    address: address,
    watch: true,
    enabled: !!address,
  });

  // Fetch USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance, isLoading: isUsdcLoading } = useBalance({
    address: address,
    token: chain?.id ? getUSDCAddress(chain.id) as `0x${string}` : undefined,
    watch: true,
    enabled: !!address && !!chain?.id,
  });

  const isBalanceLoading = isNativeLoading || isUsdcLoading;

  // ================ Balance Management ================
  const refreshBalances = useCallback(async () => {
    if (!address) return;
    try {
      await Promise.all([
        refetchNativeBalance(),
        refetchUsdcBalance()
      ]);
      toast({
        title: "Balances Updated",
      });
    } catch (err) {
      console.error("Failed to refresh balances:", err);
      setError("Failed to refresh balances");
      toast({
        title: "Balance Error",
        variant: "destructive"
      });
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

  const clearAllAlerts = useCallback(() => setSystemAlerts([]), []);

  // ================ Asset Management ================
  const fetchUserAssets = useCallback(async (userAddress: `0x${string}`) => {
    if (!userAddress) return;
    try {
      // Mock implementation
      setMyAssets([
        createAsset('12345', 'real_estate', 'Verified'),
        createAsset('LX-987', 'luxury', 'In-Transit'),
        createAsset('AG-WHT-01', 'commodity', 'Re-verification Required'),
      ]);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      addAlert({
        source: "ASSET FETCH ERROR",
        message: "Could not load your digital assets",
        impact: "MEDIUM"
      });
    }
  }, [addAlert]);

  // ================ Wallet Connection Management ================
  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      await openModal();
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
    }
  }, [openModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setMyAssets([]);
    setError(null);
  }, [disconnect]);

  const switchNetworkHandler = useCallback(async (chainId: number) => {
    try {
      if (switchNetworkAsync) await switchNetworkAsync(chainId);
    } catch (err: any) {
      console.error("Network switch error:", err);
    }
  }, [switchNetworkAsync]);

  // ================ Effects ================
  useEffect(() => {
    if (address) {
      fetchUserAssets(address);
    } else {
      setMyAssets([]);
    }
  }, [address, fetchUserAssets]);

  // ================ Context Value ================
  const contextValue: WalletContextType = useMemo(() => ({
    isConnected,
    account: address,
    chainId: chain?.id,
    connectorId: activeConnector?.id,
    systemAlerts,
    myAssets,
    balances: {
      native: nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null,
      usdc: usdcBalance ? formatUnits(usdcBalance.value, usdcBalance.decimals) : null,
    },
    isLoading: false,
    isBalanceLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork: switchNetworkHandler,
    refreshBalances,
    markAlertAsRead,
    clearAllAlerts,
    supportedChains,
    currentChain: chain ? { id: chain.id, name: chain.name } : null
  }), [
    isConnected, address, chain, activeConnector, systemAlerts, myAssets,
    nativeBalance, usdcBalance, isBalanceLoading, error, connectWallet,
    disconnectWallet, switchNetworkHandler, refreshBalances, markAlertAsRead,
    clearAllAlerts, supportedChains
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
    const ethPrice = 3500; // Mock price
    const nativeValue = parseFloat(balances.native || '0');
    const usdcValue = parseFloat(balances.usdc || '0');
    return {
      eth: balances.native ? `${nativeValue.toFixed(4)} ETH` : '0.0000 ETH',
      usdc: balances.usdc ? `$${usdcValue.toFixed(2)}` : '$0.00',
    };
  }, [balances]);

  return {
    balances: formattedBalances,
    rawBalances: balances,
    isLoading: isBalanceLoading,
    refreshBalances
  };
}
