
"use client";

import React from 'react';
import Image from 'next/image';
import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WalletHeader } from '@/components/shared/wallet-header';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Skeleton } from '../ui/skeleton';
import { Wallet as WalletIcon, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';

export default function PortfolioPage() {
  const { walletState } = useWallet();
  const { isConnected, isMarketDataLoaded, marketData, balances, transactions } = walletState;
  const router = useRouter();

  const assets = Object.entries(balances)
    .map(([symbol, balance]) => ({
      symbol,
      balance,
      name: marketData[symbol]?.name || symbol,
    }))
    .filter(asset => asset.balance > 0)
    .sort((a, b) => {
        const valueA = a.balance * (marketData[a.symbol]?.price || 0);
        const valueB = b.balance * (marketData[b.symbol]?.price || 0);
        return valueB - valueA;
    });

  const handleRowClick = (symbol: string) => {
    router.push(`/portfolio/${symbol.toLowerCase()}`);
  };

  const AssetRow = ({ asset }: { asset: { symbol: string, balance: number, name: string }}) => {
    const price = marketData[asset.symbol]?.price ?? 0;
    const value = asset.balance * price;

    return (
      <TableRow className="hover:bg-secondary/50 cursor-pointer" onClick={() => handleRowClick(asset.symbol)}>
        <TableCell>
          <div className="flex items-center gap-4">
            <Image src={getTokenLogo(asset.symbol)} alt={asset.name} width={32} height={32} />
            <div>
              <p className="font-bold">{asset.name}</p>
              <p className="text-muted-foreground">{asset.symbol}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right font-mono">
          {asset.balance.toLocaleString('en-US', { maximumFractionDigits: 6 })}
        </TableCell>
        <TableCell className="text-right font-mono">
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </TableCell>
        <TableCell className="text-right font-mono font-bold">
          ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </TableCell>
      </TableRow>
    );
  };
  
  const SkeletonRow = () => (
     <TableRow>
        <TableCell>
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        </TableCell>
         <TableCell><Skeleton className="h-6 w-full" /></TableCell>
         <TableCell><Skeleton className="h-6 w-full" /></TableCell>
         <TableCell><Skeleton className="h-6 w-full" /></TableCell>
      </TableRow>
  )

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <WalletIcon size={28} className="text-primary"/>
                    <span className="text-2xl">Asset Holdings</span>
                </CardTitle>
                <CardDescription>A detailed view of your wallet's assets. Click an asset to send or receive.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {!isConnected ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                                Connect your wallet to see your assets.
                            </TableCell>
                        </TableRow>
                    ) : !isMarketDataLoaded ? (
                        <>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </>
                    ) : assets.length > 0 ? (
                        assets.map(asset => <AssetRow key={asset.symbol} asset={asset} />)
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                                You have no assets in this wallet.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-primary"><History className="mr-2" /> Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[40rem]">
                    {transactions.length > 0 ? (
                        <div className="space-y-4 pr-4">
                            {transactions.slice().reverse().map(tx => (
                                <div key={tx.id} className="p-3 bg-background rounded-md border">
                                    <div className="flex justify-between items-center">
                                        <span className={`font-semibold text-sm ${tx.type === 'AI Rebalance' ? 'text-primary' : ''}`}>{tx.type}</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tx.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground text-xs mt-1">{typeof tx.details === 'string' ? <p className="truncate">{tx.details}</p> : tx.details}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center text-sm py-16">No transactions yet.</p>
                    )}
                </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
