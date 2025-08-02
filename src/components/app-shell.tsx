"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon, LineChart, TrendingUp, HandCoins, Plug, BrainCircuit, FileText } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

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
  
  const getActivePage = () => {
     const segments = pathname.split('/').filter(Boolean);
     if (pathname === '/') return 'markets';
     if(segments[0] === 'markets' && segments[1]){
      return 'markets';
    }
    return segments[0] || 'markets';
  }

  const navItems = [
    { id: 'markets', label: 'Markets', icon: <LineChart size={20} />, path: '/' },
    { id: 'trading', label: 'Trading', icon: <TrendingUp size={20} />, path: '/trading' },
    { id: 'finance', label: 'DeFi', icon: <HandCoins size={20} />, path: '/finance' },
    { id: 'analyzer', label: 'Analyzer', icon: <FileText size={20} />, path: '/analyzer' },
    { id: 'tools', label: 'Web3 Tools', icon: <Plug size={20} />, path: '/tools' },
    { id: 'assistant', label: 'AI Assistant', icon: <BrainCircuit size={20} />, path: '/assistant' },
  ];
  
  const activePage = getActivePage();

  return (
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
