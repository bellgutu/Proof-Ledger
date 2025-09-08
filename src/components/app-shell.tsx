

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, LineChart, TrendingUp, HandCoins, Plug, BrainCircuit, FileText, SearchCode, BarChartHorizontalBig, Droplets, Wallet, Send } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useLogger } from '@/hooks/use-logger';
import { useWallet } from '@/contexts/wallet-context';
import type { ChainAsset } from '@/contexts/wallet-context';
import { TokenActionDialog } from '@/components/shared/token-action-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants }from '@/components/ui/button';
import { DebugWallet } from './shared/debug-wallet';


export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();
  const { logEvent } = useLogger();
  const { walletState } = useWallet();

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendAsset, setSendAsset] = useState<ChainAsset | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);
  
  const getActivePage = () => {
     const segments = pathname.split('/').filter(Boolean);
     if (pathname === '/') return 'markets';
     if(segments[0] === 'markets' && segments[1]){
      return 'markets';
    }
    return segments[0] || 'markets';
  };
  
  const activePage = getActivePage();

  useEffect(() => {
    if (activePage) {
      logEvent('page_view', { page: activePage });
    }
  }, [activePage, logEvent]);

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSendClick = () => {
    const ethBalance = walletState.balances['ETH'] || 0;
    const ethDecimals = walletState.decimals['ETH'] || 18;
    const ethAsset: ChainAsset = {
      symbol: 'ETH',
      balance: ethBalance,
      name: 'Ethereum',
      decimals: ethDecimals,
    }
    setSendAsset(ethAsset);
    setIsSendOpen(true);
  }

  const navItems = [
    { id: 'markets', label: 'Markets', icon: <LineChart size={20} />, path: '/' },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={20} />, path: '/portfolio' },
    { id: 'trading', label: 'Trading', icon: <TrendingUp size={20} />, path: '/trading' },
    { id: 'liquidity', label: 'Liquidity Pro', icon: <Droplets size={20} />, path: '/liquidity' },
    { id: 'finance', label: 'DeFi', icon: <HandCoins size={20} />, path: '/finance' },
    { id: 'intelligence', label: 'Intelligence', icon: <BrainCircuit size={20} />, path: '/intelligence' },
    { id: 'tools', label: 'Web3 Tools', icon: <Plug size={20} />, path: '/tools' },
    { id: 'assistant', label: 'AI Assistant', icon: <FileText size={20} />, path: '/assistant' },
  ];

  return (
    <>
    <div className="flex flex-col min-h-screen lg:flex-row bg-secondary/40">
      <aside className="bg-card text-card-foreground w-full lg:w-64 p-4 flex-shrink-0 lg:h-screen lg:sticky lg:top-0 border-b lg:border-r">
        <div className="flex items-center justify-between mb-4 lg:mb-8">
          <Logo />
          <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
        <nav className="flex flex-col h-[calc(100%-80px)]">
          <ul className="flex flex-row lg:flex-col lg:space-y-2 overflow-x-auto lg:overflow-x-visible space-x-2 lg:space-x-0 flex-grow">
            {navItems.map(item => (
              <li key={item.id} className="flex-shrink-0">
                 <Link
                    href={item.path}
                    className={cn(
                        buttonVariants({ variant: activePage === item.id ? 'secondary' : 'ghost' }),
                        "w-full flex items-center justify-start text-left text-base font-semibold py-6"
                    )}
                 >
                    <div className="mr-3">{item.icon}</div>
                    <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
           <div className="mt-auto">
                <Button onClick={handleSendClick} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground animate-pulse-strong">
                    <Send className="mr-2"/> Send / Transfer
                </Button>
            </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
            <DebugWallet />
            <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
    
      {sendAsset && (
        <TokenActionDialog 
          isOpen={isSendOpen}
          setIsOpen={setIsSendOpen}
          asset={sendAsset}
        />
      )}
    </>
  );
}
