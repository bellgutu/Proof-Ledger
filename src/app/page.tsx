"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon, LineChart, TrendingUp, HandCoins, Plug, BrainCircuit, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { WalletProvider } from '@/contexts/wallet-context';
import MarketsPage from '@/components/pages/markets';
import TradingPage from '@/components/pages/trading';
import FinancePage from '@/components/pages/finance';
import AnalyzerPage from '@/components/pages/analyzer';
import ToolsPage from '@/components/pages/tools';
import AssistantPage from '@/components/pages/assistant';
import CoinDetail from '@/components/pages/coin-detail';

type Page = 'markets' | 'trading' | 'finance' | 'analyzer' | 'tools' | 'assistant' | 'coin-detail';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('markets');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);
  
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const newPage = segments[0] || 'markets';
    if(segments[0] === 'markets' && segments[1]){
      setCurrentPage('coin-detail');
    } else {
      setCurrentPage((newPage as Page) || 'markets');
    }
  }, [pathname]);

  const navigate = (page: Page) => {
    router.push(page === 'markets' ? '/' : `/${page}`);
  };

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const renderPage = () => {
    const segments = pathname.split('/').filter(Boolean);
    if(segments[0] === 'markets' && segments[1]){
      return <CoinDetail symbol={segments[1]} />;
    }
    
    switch (segments[0]) {
      case 'trading':
        return <TradingPage />;
      case 'finance':
        return <FinancePage />;
      case 'analyzer':
        return <AnalyzerPage />;
      case 'tools':
        return <ToolsPage />;
      case 'assistant':
        return <AssistantPage />;
      case 'markets':
      default:
        return <MarketsPage />;
    }
  };
  
  const getActivePage = () => {
     const segments = pathname.split('/').filter(Boolean);
     if(segments[0] === 'markets' && segments[1]){
      return 'markets';
    }
    return segments[0] || 'markets';
  }

  const navItems = [
    { id: 'markets', label: 'Markets', icon: <LineChart size={20} /> },
    { id: 'trading', label: 'Trading', icon: <TrendingUp size={20} /> },
    { id: 'finance', label: 'DeFi', icon: <HandCoins size={20} /> },
    { id: 'analyzer', label: 'Analyzer', icon: <FileText size={20} /> },
    { id: 'tools', label: 'Web3 Tools', icon: <Plug size={20} /> },
    { id: 'assistant', label: 'AI Assistant', icon: <BrainCircuit size={20} /> },
  ];
  
  const activePage = getActivePage();

  return (
    <WalletProvider>
      <div className="flex flex-col min-h-screen lg:flex-row">
        <aside className="bg-card text-card-foreground w-full lg:w-64 p-4 flex-shrink-0 lg:h-screen lg:sticky lg:top-0 border-r border-border/60">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-extrabold text-primary">Apex Navigator</h1>
            <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
          <nav>
            <ul className="space-y-2">
              {navItems.map(item => (
                <li key={item.id}>
                  <Button
                    variant={activePage === item.id ? 'default' : 'ghost'}
                    onClick={() => navigate(item.id as Page)}
                    className="w-full flex items-center justify-start text-left text-base font-semibold py-6"
                  >
                    <div className="mr-3">{item.icon}</div>
                    <span>{item.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </WalletProvider>
  );
}
