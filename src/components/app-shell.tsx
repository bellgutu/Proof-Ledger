
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Building, CheckShield, BarChart2, Settings, Home, Sprout, Gem } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem = ({ href, label, icon }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: isActive ? 'secondary' : 'ghost' }),
        "w-full flex items-center justify-start text-left text-base font-semibold py-6 pl-10"
      )}
    >
      <div className="mr-3">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

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

  const getActiveGroup = () => {
    if (pathname.startsWith('/verification')) return 'asset-verification';
    if (pathname.startsWith('/compliance')) return 'compliance';
    if (pathname.startsWith('/analytics')) return 'analytics';
    return '';
  }

  const enterpriseNav = [
    {
      group: "asset-verification",
      label: "Asset Verification",
      icon: <CheckShield size={20} />,
      items: [
        { href: '/verification/real-estate', label: 'Real Estate', icon: <Home size={18} /> },
        { href: '/verification/commodities', label: 'Commodities', icon: <Sprout size={18} /> },
        { href: '/verification/luxury-goods', label: 'Luxury Goods', icon: <Gem size={18} /> },
      ]
    },
    {
      group: "compliance",
      label: "Compliance",
      icon: <Building size={20} />,
      items: [
         // Placeholder pages for now
        { href: '/compliance', label: 'KYC/AML Checks', icon: <CheckShield size={18} /> },
        { href: '/compliance', label: 'Audit Trails', icon: <CheckShield size={18} /> },
        { href: '/compliance', label: 'Regulatory Reports', icon: <CheckShield size={18} /> },
      ]
    },
    {
      group: "analytics",
      label: "Analytics",
      icon: <BarChart2 size={20} />,
      items: [
        // Placeholder pages for now
        { href: '/analytics', label: 'Cost Savings', icon: <BarChart2 size={18} /> },
        { href: '/analytics', label: 'Fraud Detection', icon: <BarChart2 size={18} /> },
        { href: '/analytics', label: 'Performance', icon: <BarChart2 size={18} /> },
      ]
    }
  ];

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
          <Accordion type="single" collapsible defaultValue={getActiveGroup()} className="w-full">
            {enterpriseNav.map(group => (
              <AccordionItem value={group.group} key={group.group}>
                <AccordionTrigger className="text-lg font-bold hover:no-underline px-3">
                  <div className="flex items-center gap-3">
                    {group.icon} {group.label}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 py-2">
                    {group.items.map(item => (
                      <li key={item.href}><NavItem {...item} /></li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-auto flex flex-col space-y-2 pt-8 border-t">
              <Link
                href="/settings"
                className={cn(
                    buttonVariants({ variant: pathname === '/settings' ? 'secondary' : 'ghost' }),
                    "w-full flex items-center justify-start text-left text-base font-semibold py-6"
                )}
                >
                <div className="mr-3"><Settings size={20}/></div>
                <span>Enterprise Settings</span>
            </Link>
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
