
"use client";

import React from 'react';
import Link from 'next/link';
import { Sun, Moon, LayoutDashboard, Settings, Ship, ShieldCheck, HardHat, GanttChartSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  const pathname = usePathname();

  React.useEffect(() => {
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
  
  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/shipping', label: 'Shipping', icon: Ship },
    { href: '/insurance', label: 'Insurance', icon: ShieldCheck },
    { href: '/quality', label: 'Quality', icon: HardHat },
    { href: '/compliance', label: 'Compliance', icon: GanttChartSquare },
  ];

  return (
    <div className="flex flex-col min-h-screen lg:flex-row bg-secondary/40">
      <aside className="bg-card text-card-foreground w-full lg:w-72 p-4 flex-shrink-0 lg:h-screen lg:sticky lg:top-0 border-b lg:border-r">
        <div className="flex items-center justify-between mb-4 lg:mb-8">
          <Logo />
           <div className='flex items-center gap-2'>
              <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </div>
        </div>
        <nav className="flex flex-col h-[calc(100%-80px)]">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: pathname === link.href ? 'secondary' : 'ghost' }),
                  "w-full flex items-center justify-start text-left text-base font-semibold py-6"
                )}
              >
                <div className="mr-3"><link.icon size={20}/></div>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-auto flex flex-col space-y-2 pt-8 border-t">
             <Link
                href="#"
                className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    "w-full flex items-center justify-start text-left text-base font-normal py-5"
                )}
                >
                <div className="mr-3"><Settings size={18}/></div>
                <span>Settings</span>
            </Link>
            <p className="text-xs text-muted-foreground text-center !mt-8">Enterprise Verification Platform v1.0</p>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
         <header className="hidden lg:flex items-center justify-end h-16 px-8 border-b bg-card gap-4">
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
