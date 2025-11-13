
"use client";

import React from 'react';
import Link from 'next/link';
import { Sun, Moon, LayoutDashboard, ShieldCheck, FileText, BarChart, Settings, Building, GanttChartSquare, Landmark, TrendingUp, Handshake, CheckSquare, Database } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const navGroups = [
  {
    label: "Asset Verification",
    icon: ShieldCheck,
    items: [
      { label: "Real Estate", href: "/verification/real-estate", icon: Building },
      { label: "Commodities", href: "/verification/commodities", icon: GanttChartSquare },
      { label: "Luxury Goods", href: "/verification/luxury-goods", icon: Landmark }
    ]
  },
  {
    label: "Compliance",
    icon: Handshake,
    items: [
      { label: "KYC/AML Checks", href: "/compliance/kyc-aml", icon: CheckSquare },
      { label: "Audit Trails", href: "/compliance/audit-trails", icon: GanttChartSquare },
      { label: "Regulatory Reports", href: "/compliance/reports", icon: FileText }
    ]
  },
  {
    label: "Analytics",
    icon: BarChart,
    items: [
      { label: "Cost Savings", href: "/analytics/cost-savings", icon: TrendingUp },
      { label: "Fraud Detection", href: "/analytics/fraud-detection", icon: Landmark },
      { label: "Performance", href: "/analytics/performance", icon: LayoutDashboard }
    ]
  },
  {
    label: "Data Management",
    icon: Database,
    items: [
        { label: "Oracle Data", href: "/management/oracle-data", icon: FileText },
        { label: "Settings", href: "/management/settings", icon: Settings },
    ]
  }
];

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

  const getOpenAccordionItems = () => {
    const activeGroup = navGroups.find(group => 
      group.items.some(item => pathname.startsWith(item.href))
    );
    return activeGroup ? [activeGroup.label] : [];
  };
  
  return (
    <div className="flex flex-col min-h-screen lg:flex-row bg-secondary/40">
      <aside className="bg-card text-card-foreground w-full lg:w-72 p-4 flex-shrink-0 lg:h-screen lg:sticky lg:top-0 border-b lg:border-r">
        <div className="flex items-center justify-between mb-4 lg:mb-8">
          <Logo />
           <div className='flex items-center gap-2'>
              <div className="lg:hidden flex items-center gap-2">
                <w3m-network-button />
                <w3m-connect-button />
              </div>
              <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </div>
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

            <Accordion type="multiple" defaultValue={getOpenAccordionItems()} className="w-full">
              {navGroups.map((group) => (
                <AccordionItem value={group.label} key={group.label} className="border-none">
                  <AccordionTrigger className="text-base font-semibold py-3 hover:no-underline [&[data-state=open]>svg]:text-accent">
                    <div className="flex items-center">
                      <div className="mr-3"><group.icon size={20} /></div>
                      <span>{group.label}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4">
                    <div className="flex flex-col space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                           className={cn(
                                buttonVariants({ variant: pathname.startsWith(item.href) ? 'secondary' : 'ghost' }),
                                "w-full flex items-center justify-start text-left text-base font-normal py-5"
                            )}
                        >
                          <div className="mr-3"><item.icon size={18}/></div>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          
          <div className="mt-auto flex flex-col space-y-2 pt-8 border-t">
            <p className="text-xs text-muted-foreground text-center">Enterprise Verification Platform v1.0</p>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
         <header className="hidden lg:flex items-center justify-end h-16 px-8 border-b bg-card gap-4">
            <w3m-network-button />
            <w3m-connect-button />
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
