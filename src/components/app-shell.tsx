
"use client";

import React from 'react';
import Link from 'next/link';
import { Sun, Moon, LayoutDashboard, Settings, Ship, ShieldCheck, CheckCircle, GanttChartSquare, DatabaseZap, Building, Diamond, Wheat } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
    },
    { 
      href: '/asset-verification', 
      label: 'Asset Verification', 
      icon: CheckCircle,
      subLinks: [
        { href: '/asset-verification/real-estate', label: 'Real Estate', icon: Building },
        { href: '/asset-verification/luxury-goods', label: 'Luxury & Gemstones', icon: Diamond },
        { href: '/asset-verification/commodities', label: 'Commodities', icon: Wheat },
      ]
    },
    { 
      href: '/shipping', 
      label: 'Shipping', 
      icon: Ship,
    },
    { 
      href: '/insurance', 
      label: 'Insurance', 
      icon: ShieldCheck,
    },
    { 
      href: '/compliance', 
      label: 'Compliance', 
      icon: GanttChartSquare,
    },
    {
      href: '/oracle-providers',
      label: 'Oracle Providers',
      icon: DatabaseZap,
    }
  ];

  const getActiveAccordionItem = () => {
    const activeParent = navLinks.find(link => link.subLinks && pathname.startsWith(link.href));
    return activeParent ? activeParent.href : undefined;
  }

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
          <div className="flex flex-col gap-1">
            <Accordion type="single" collapsible defaultValue={getActiveAccordionItem()} className="w-full">
              {navLinks.map((link) => (
                link.subLinks ? (
                  <AccordionItem value={link.href} key={link.href} className="border-b-0">
                    <AccordionTrigger 
                      className={cn(
                        buttonVariants({ variant: 'ghost' }),
                        "w-full flex items-center justify-between text-left text-base font-semibold py-6",
                        pathname.startsWith(link.href) && "bg-secondary"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="mr-3"><link.icon size={20}/></div>
                        <span>{link.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-6 space-y-1">
                      {link.subLinks.map(subLink => (
                        <Link
                          key={subLink.href}
                          href={subLink.href}
                          className={cn(
                            buttonVariants({ variant: pathname === subLink.href ? 'secondary' : 'ghost' }),
                            "w-full flex items-center justify-start text-left text-base font-normal py-5"
                          )}
                        >
                          <div className="mr-3"><subLink.icon size={18}/></div>
                          <span>{subLink.label}</span>
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ) : (
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
                )
              ))}
            </Accordion>
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
