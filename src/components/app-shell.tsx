
"use client";

import React from 'react';
import Link from 'next/link';
import { Sun, Moon, LayoutDashboard, Settings, Ship, ShieldCheck, CheckCircle, GanttChartSquare, DatabaseZap, Building, Diamond, Wheat, Menu, X, Library, FileText, UserPlus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ConnectButton } from './connect-button';

const navLinks = [
  { 
    href: '/', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
  },
  {
    href: '/my-assets',
    label: 'My Assets',
    icon: Library,
  },
  { 
    label: 'Asset Verification', 
    icon: CheckCircle,
    subLinks: [
      { href: '/asset-verification/real-estate', label: 'Real Estate', icon: Building },
      { href: '/asset-verification/luxury-goods', label: 'Luxury & Gemstones', icon: Diamond },
      { href: '/asset-verification/commodities', label: 'Commodities', icon: Wheat },
    ],
    href: '/asset-verification'
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
    label: 'Oracle Partner Console',
    icon: DatabaseZap,
  },
  {
    href: '/documentation',
    label: 'Documentation',
    icon: FileText,
  }
];

const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => {
  const pathname = usePathname();
  const getActiveAccordionItem = () => {
    const activeParent = navLinks.find(link => link.subLinks && pathname.startsWith(link.href));
    return activeParent ? activeParent.href : undefined;
  };

  const NavLinkWrapper = isMobile ? SheetClose : React.Fragment;

  return (
    <div className="flex flex-col gap-1">
      <Accordion type="single" collapsible defaultValue={getActiveAccordionItem()} className="w-full">
        {navLinks.map((link) => (
          link.subLinks ? (
            <AccordionItem value={link.href} key={link.href} className="border-b-0">
              <AccordionTrigger 
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  "w-full flex items-center justify-between text-left text-base font-semibold py-6 hover:no-underline",
                  pathname.startsWith(link.href) && "bg-secondary"
                )}
              >
                <div className="flex items-center">
                  <div className="mr-3"><link.icon size={20}/></div>
                  <span>{link.label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-6 space-y-1">
                <NavLinkWrapper {...(isMobile ? { asChild: true } : {})}>
                  <Link
                    href={link.href}
                    className={cn(
                      buttonVariants({ variant: pathname === link.href ? 'secondary' : 'ghost' }),
                      "w-full flex items-center justify-start text-left text-base font-normal py-5"
                    )}
                  >
                    <div className="mr-3 w-4"></div>
                    <span>Hub Overview</span>
                  </Link>
                </NavLinkWrapper>
                {link.subLinks.map(subLink => (
                  <NavLinkWrapper key={subLink.href} {...(isMobile ? { asChild: true } : {})}>
                    <Link
                      href={subLink.href}
                      className={cn(
                        buttonVariants({ variant: pathname === subLink.href ? 'secondary' : 'ghost' }),
                        "w-full flex items-center justify-start text-left text-base font-normal py-5"
                      )}
                    >
                      <div className="mr-3"><subLink.icon size={18}/></div>
                      <span>{subLink.label}</span>
                    </Link>
                  </NavLinkWrapper>
                ))}
              </AccordionContent>
            </AccordionItem>
          ) : (
             <NavLinkWrapper key={link.href} {...(isMobile ? { asChild: true } : {})}>
              <Link
                href={link.href}
                className={cn(
                  buttonVariants({ variant: pathname === link.href ? 'secondary' : 'ghost' }),
                  "w-full flex items-center justify-start text-left text-base font-semibold py-6"
                )}
              >
                <div className="mr-3"><link.icon size={20}/></div>
                <span>{link.label}</span>
              </Link>
            </NavLinkWrapper>
          )
        ))}
      </Accordion>
    </div>
  );
};


export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

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

  return (
    <div className="flex flex-col min-h-screen lg:flex-row bg-secondary/40">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block bg-card text-card-foreground w-72 flex-shrink-0 h-screen sticky top-0 border-r">
        <div className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <Logo />
            </div>
            <nav className="flex-grow">
              <NavContent />
            </nav>
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
                <div className="text-xs text-muted-foreground text-center !mt-8">
                  <p>Proof Ledger v1.0</p>
                  <p className="mt-2">Developed by: Abel Gutu</p>
                  <p>abelgutu@gmail.com</p>
                </div>
            </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
         <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b bg-card gap-4 sticky top-0 z-40">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <aside className="bg-card text-card-foreground flex-shrink-0 h-screen sticky top-0">
                        <div className="p-4 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                              <Logo />
                            </div>
                            <nav className="flex-grow">
                              <NavContent isMobile={true} />
                            </nav>
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
                                <div className="text-xs text-muted-foreground text-center !mt-8">
                                  <p>Proof Ledger v1.0</p>
                                  <p className="mt-2">Developed by: Abel Gutu</p>
                                  <p>abelgutu@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </SheetContent>
            </Sheet>
            <div className='flex items-center gap-2'>
              <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
              <ConnectButton />
            </div>
        </header>
        <header className="hidden lg:flex items-center justify-end h-16 px-8 gap-4 sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b">
            <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <Link href="/signup" passHref>
                <Button variant="ghost">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                </Button>
            </Link>
            <ConnectButton />
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
