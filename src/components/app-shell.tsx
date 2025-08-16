
"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon, LineChart, TrendingUp, HandCoins, Plug, BrainCircuit, FileText, SearchCode, BarChartHorizontalBig, Droplets, Wallet, Send } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useLogger } from '@/hooks/use-logger';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { logEvent } = useLogger();

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

  const navigate = (path: string) => {
    router.push(path);
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
    <div className="flex flex-col min-h-screen lg:flex-row">
      <aside className="bg-card text-card-foreground w-full lg:w-64 p-4 flex-shrink-0 lg:h-screen lg:sticky lg:top-0 border-b lg:border-r border-border/60">
        <div className="flex items-center justify-between mb-4 lg:mb-8">
          <Logo />
          <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
        <nav>
          <ul className="flex flex-row lg:flex-col lg:space-y-2 overflow-x-auto lg:overflow-x-visible space-x-2 lg:space-x-0">
            {navItems.map(item => (
              <li key={item.id} className="flex-shrink-0">
                <Button
                  variant={activePage === item.id ? 'default' : 'ghost'}
                  onClick={() => navigate(item.path)}
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
          {children}
        </div>
      </main>
    </div>
  );
}
