
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WalletHeader } from '@/components/shared/wallet-header';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet as WalletIcon, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TokenActionDialog } from '@/components/shared/token-action-dialog';
import type { ChainAsset } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { ERC20_CONTRACTS } from '@/services/blockchain-service';
import { useAccount, useBalance } from 'wagmi';

function Erc20Balance({ symbol, name, address, onAssetClick }: { symbol: string, name: string, address: `0x${string}`, onAssetClick: (asset: ChainAsset) => void }) {
    const { address: accountAddress } = useAccount();
    const { data: balanceData, isLoading } = useBalance({ address: accountAddress, token: address });
    const { walletState } = useWallet();
    const { marketData } = walletState;
    const price = marketData[symbol]?.price ?? 0;
    
    if (!accountAddress || !balanceData || balanceData.value === 0n) return null;
    
    const balance = parseFloat(balanceData.formatted);
    const value = balance * price;
    
    const asset: ChainAsset = {
        symbol,
        name,
        balance,
        decimals: balanceData.decimals,
    };

    return (
        <TableRow onClick={() => onAssetClick(asset)} className="cursor-pointer">
            <TableCell>
                <div className="flex items-center gap-4">
                    <Image src={getTokenLogo(symbol)} alt={name} width={32} height={32} />
                    <div>
                        <p className="font-bold">{name}</p>
                        <p className="text-muted-foreground">{symbol}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right font-mono">
                {balance.toLocaleString('en-US', { maximumFractionDigits: 6 })}
            </TableCell>
            <TableCell className="text-right font-mono">
                ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </TableCell>
            <TableCell className="text-right font-mono font-bold">
                ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </TableCell>
        </TableRow>
    );
}

export default function PortfolioPage() {
    const { walletState } = useWallet();
    const { isConnected, isMarketDataLoaded, marketData } = walletState;
    const { address: accountAddress } = useAccount();
    const { data: nativeBalance } = useBalance({ address: accountAddress });
    const router = useRouter();

    const [selectedAsset, setSelectedAsset] = useState<ChainAsset | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAssetClick = (asset: ChainAsset) => {
        setSelectedAsset(asset);
        setIsDialogOpen(true);
    };

    const Erc20Tokens = Object.entries(ERC20_CONTRACTS).filter(([, details]) => details.address);

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
    );

    return (
        <div className="container mx-auto p-0 space-y-8">
            <WalletHeader />
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-3">
                            <WalletIcon size={28} className="text-primary"/>
                            <span className="text-2xl">Asset Holdings</span>
                        </CardTitle>
                        <CardDescription>A detailed view of your wallet's assets. Click an asset to interact.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/portfolio/history')}>
                        <History className="mr-2"/>
                        View History
                    </Button>
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
                            ) : (
                                <>
                                    {nativeBalance && (
                                        <TableRow onClick={() => handleAssetClick({ name: 'Ethereum', symbol: 'ETH', balance: parseFloat(nativeBalance.formatted), decimals: 18 })} className="cursor-pointer">
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <Image src={getTokenLogo('ETH')} alt="Ethereum" width={32} height={32} />
                                                    <div>
                                                        <p className="font-bold">Ethereum</p>
                                                        <p className="text-muted-foreground">ETH</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{parseFloat(nativeBalance.formatted).toLocaleString('en-US', { maximumFractionDigits: 6 })}</TableCell>
                                            <TableCell className="text-right font-mono">${marketData['ETH']?.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">${(parseFloat(nativeBalance.formatted) * (marketData['ETH']?.price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        </TableRow>
                                    )}
                                    {Erc20Tokens.map(([symbol, { name, address }]) => (
                                        <Erc20Balance 
                                            key={symbol} 
                                            symbol={symbol} 
                                            name={name} 
                                            address={address as `0x${string}`}
                                            onAssetClick={handleAssetClick}
                                        />
                                    ))}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedAsset && (
                <TokenActionDialog 
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    asset={selectedAsset}
                />
            )}
        </div>
    );
}
