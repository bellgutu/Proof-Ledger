
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex flex-col min-h-screen lg:flex-row bg-secondary/40">
      <aside className="bg-card text-card-foreground w-full lg:w-72 p-4 flex-shrink-0 lg:h-screen lg:sticky lg:top-0 border-b lg:border-r">
        <div className="flex items-center justify-between mb-4 lg:mb-8">
          <Logo />
          <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
        <nav className="flex flex-col h-[calc(100%-80px)]">
            <Link
                href="/"
                className={cn(
                    buttonVariants({ variant: pathname === '/' ? 'secondary' : 'ghost' }),
                    "w-full flex items-center justify-start text-left text-base font-semibold py-6"
                )}
                >
                <div className="mr-3"><LayoutDashboard size={20}/></div>
                <span>Dashboard</span>
            </Link>
            <Link
                href="/verification"
                className={cn(
                    buttonVariants({ variant: pathname.startsWith('/verification') ? 'secondary' : 'ghost' }),
                    "w-full flex items-center justify-start text-left text-base font-semibold py-6"
                )}
                >
                <div className="mr-3"><ShieldCheck size={20}/></div>
                <span>Verification</span>
            </Link>
          
          <div className="mt-auto flex flex-col space-y-2 pt-8 border-t">
              <p className="text-xs text-muted-foreground text-center">Enterprise Verification Platform v1.0</p>
          </div>
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
