
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { ethers, type Log, formatUnits } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { AppContracts } from '@/config/contracts';
import { Diamond, Wheat, Building, AlertTriangle } from 'lucide-react';
import { 
  createConfig, 
  mainnet, 
  sepolia, 
  useAccount, 
  useDisconnect, 
  useBalance,
  useNetwork,
  useSwitchNetwork,
  WagmiConfig
} from 'wagmi';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';

// ================ WAGMI & Web3Modal Configuration ================
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
if (!projectId) {
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.");
}

// Define chains you want to support
const chains = [sepolia, mainnet];
const metadata = {
  name: 'Proof Ledger',
  description: 'Enterprise Grade Digital Asset Platform',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create wagmi config
const wagmiConfig = defaultWagmiConfig({ 
  chains, 
  projectId, 
  metadata 
});

// Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 40
  }
});

// ================ Contract ABIs ================
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

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
  status: 'Pending' | 'Verified' | 'Suspended' | 'Insured';
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
  connector: string | null;
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
  addCustomToken: (address: string, symbol: string, decimals: number) => void;
  markAlertAsRead: (alertId: string) => void;
  clearAllAlerts: () => void;
  supportedChains: { id: number; name: string; nativeCurrency: { symbol: string } }[];
  currentChain: { id: number; name: string } | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initial alerts
const initialAlerts: SystemAlert[] = [
  { 
    id: '1', 
    source: "SYSTEM HEALTH", 
    message: "All systems operational", 
    impact: "LOW", 
    time: new Date().toISOString(), 
    read: true 
  },
  { 
    id: '2', 
    source: "ORACLE MONITOR", 
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
  { 
    id: '4', 
    source: "COMPLIANCE", 
    message: "New high-risk partner pending KYC approval", 
    impact: "MEDIUM", 
    time: new Date(Date.now() - 7200000).toISOString(), 
    read: false 
  },
];

// Custom token registry
const CUSTOM_TOKENS_KEY = 'custom_tokens';
interface CustomToken {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
}

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

const createAssetFromEvent = (tokenId: string, assetType: number): Asset => {
  const assetTypes = [
    'Real Estate',
    'Luxury Good',
    'Commodity',
    'Artwork',
    'Collectible'
  ];
  
  const icons = [
    <Building key="realestate" className="h-8 w-8 text-blue-500" />,
    <Diamond key="luxury" className="h-8 w-8 text-purple-500" />,
    <Wheat key="commodity" className="h-8 w-8 text-amber-500" />,
    <Building key="art" className="h-8 w-8 text-pink-500" />,
    <Building key="collectible" className="h-8 w-8 text-green-500" />
  ];

  const type = assetTypes[assetType] || 'Unknown Asset';
  const icon = icons[assetType] || <Building className="h-8 w-8 text-gray-500" />;

  return {
    tokenId,
    name: `${type} #${tokenId}`,
    assetType: type,
    status: 'Verified',
    icon,
    overview: {
      "Token ID": tokenId,
      "Minted On": new Date().toLocaleDateString(),
      "Asset Type": type,
      "Verification": "Blockchain Verified"
    },
    provenance: [{
      status: "Digital Twin Minted",
      date: new Date().toLocaleDateString(),
      verifier: "Blockchain Oracle",
      icon: AlertTriangle
    }],
    insurance: {
      status: "Pending",
      policyId: "N/A",
      provider: "Digital Asset Insurance Inc.",
      coverage: "$0",
      nextPremiumDue: "N/A"
    },
    custody: {
      current: "Owner Wallet",
      location: "Blockchain",
      history: [{
        custodian: "Minting Contract",
        date: new Date().toLocaleDateString()
      }]
    },
    valueUSD: "0.00"
  };
};

// ================ Main Provider Component ================
export function WalletProvider({ children }: { children: ReactNode }) {
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(initialAlerts);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Wagmi hooks
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { chain, chains: supportedChains } = useNetwork();
  const { disconnect } = useDisconnect();
  const { switchNetworkAsync } = useSwitchNetwork();

  // Fetch native balance
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address: address,
    watch: true,
    enabled: !!address
  });

  // Fetch USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useBalance({
    address: address,
    token: chain?.id ? getUSDCAddress(chain.id) as `0x${string}` : undefined,
    watch: true,
    enabled: !!address && !!chain?.id
  });

  // ================ Balance Management ================
  const refreshBalances = useCallback(async () => {
    if (!address) return;
    
    setIsBalanceLoading(true);
    setError(null);
    
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
      setIsBalanceLoading(false);
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
  }, []);

  // ================ Asset Management ================
  const fetchUserAssets = useCallback(async (userAddress: `0x${string}`) => {
    if (!userAddress) return;
    
    try {
      // In production, this would fetch from your backend/contracts
      // Mock implementation for now
      const mockAssets: Asset[] = [
        createAssetFromEvent("12345", 1),
        createAssetFromEvent("67890", 2),
        createAssetFromEvent("24680", 3),
      ];
      
      setMyAssets(mockAssets);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      addAlert({
        source: "ASSET FETCH ERROR",
        message: "Could not load your digital assets",
        impact: "MEDIUM"
      });
    }
  }, [addAlert]);

  // ================ Token Management ================
  const addCustomToken = useCallback((address: string, symbol: string, decimals: number) => {
    if (!chain?.id) {
      toast({
        title: "Network Error",
        description: "Please connect to a network first",
        variant: "destructive"
      });
      return;
    }
    
    const newToken: CustomToken = {
      address,
      symbol,
      decimals,
      chainId: chain.id
    };
    
    setCustomTokens(prev => {
      const updated = [...prev, newToken];
      localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(updated));
      return updated;
    });
    
    toast({
      title: "Token Added",
      description: `${symbol} has been added to your wallet`
    });
  }, [chain?.id, toast]);

  // ================ Wallet Connection Management ================
  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      const modal = document.querySelector('w3m-modal') as any;
      if (modal) {
        modal.open();
      } else {
        throw new Error("Web3Modal is not initialized");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
      toast({
        title: "Connection Failed",
        description: err.message || "Please try again",
        variant: "destructive"
      });
    }
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

  const switchNetworkHandler = useCallback(async (chainId: number) => {
    try {
      if (switchNetworkAsync) {
        await switchNetworkAsync(chainId);
        toast({
          title: "Network Switched",
          description: `Connected to ${supportedChains.find(c => c.id === chainId)?.name || 'Unknown Network'}`
        });
      }
    } catch (err: any) {
      console.error("Network switch error:", err);
      toast({
        title: "Network Switch Failed",
        description: err.message || "Could not switch network",
        variant: "destructive"
      });
    }
  }, [switchNetworkAsync, supportedChains, toast]);

  // ================ Effects ================
  // Load custom tokens from localStorage
  useEffect(() => {
    const savedTokens = localStorage.getItem(CUSTOM_TOKENS_KEY);
    if (savedTokens) {
      try {
        setCustomTokens(JSON.parse(savedTokens));
      } catch (err) {
        console.error("Failed to load custom tokens:", err);
      }
    }
  }, []);

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
    }
  }, [isConnected, address, addAlert]);

  // Monitor network changes
  useEffect(() => {
    if (chain) {
      addAlert({
        source: "NETWORK CHANGE",
        message: `Switched to ${chain.name}`,
        impact: "LOW"
      });
      
      // Refresh balances on network change
      if (address) {
        refreshBalances();
      }
    }
  }, [chain, address, addAlert, refreshBalances]);

  // ================ Context Value ================
  const contextValue: WalletContextType = useMemo(() => ({
    isConnected,
    account: address,
    chainId: chain?.id,
    connector: activeConnector?.name || null,
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
    addCustomToken,
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
    chain,
    activeConnector,
    systemAlerts,
    myAssets,
    nativeBalance,
    usdcBalance,
    isBalanceLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetworkHandler,
    refreshBalances,
    addCustomToken,
    markAlertAsRead,
    clearAllAlerts,
    supportedChains
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
    return {
      eth: balances.native ? `${parseFloat(balances.native).toFixed(4)} ETH` : '0.0000 ETH',
      usdc: balances.usdc ? `$${parseFloat(balances.usdc).toFixed(2)}` : '$0.00',
      totalUSD: balances.native && balances.usdc
        ? `$${(parseFloat(balances.usdc) + (parseFloat(balances.native) * ethPrice)).toFixed(2)}`
        : balances.usdc
        ? `$${parseFloat(balances.usdc).toFixed(2)}`
        : '$0.00'
    };
  }, [balances]);

  return {
    balances: formattedBalances,
    rawBalances: balances,
    isLoading: isBalanceLoading,
    refreshBalances
  };
}
