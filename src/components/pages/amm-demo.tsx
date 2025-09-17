
"use client";

import React from 'react';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle, XCircle, Bot, Cpu, Droplets, History, Settings } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useSwitchNetwork } from 'wagmi';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

// --- MOCK TOKEN ADDRESSES (for display/linking) ---
const MOCK_USDT_ADDRESS = '0xC9569792794d40C612C6E4cd97b767EeE4708f24' as const;
const MOCK_USDC_ADDRESS = '0xc4733C1fbdB1Ccd9d2Da26743F21fd3Fe12ECD37' as const;
const MOCK_WETH_ADDRESS = '0x3318056463e5bb26FB66e071999a058bdb35F34f' as const;

const WalletPanel = () => {
    const { state, actions } = useAmmDemo();
    const { isConnected, address, ethBalance, tokenBalances } = state;
    const { chain } = useAccount();
    const { switchNetwork } = useSwitchNetwork();
    const { open } = useWeb3Modal();

    const isSepolia = chain?.id === 11155111;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Wallet />Wallet & Network</CardTitle>
                <CardDescription>Connect to Sepolia testnet and manage your mock tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isConnected ? (
                    <Button onClick={() => open()} className="w-full">Connect Wallet</Button>
                ) : (
                    <div className="p-3 bg-background rounded-lg border space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} />Connected</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Address</span>
                            <span className="font-mono text-xs">{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Network</span>
                            {isSepolia ? (
                                <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} />{chain?.name}</span>
                            ) : (
                                <Button size="sm" variant="destructive" onClick={() => switchNetwork?.(11155111)}>
                                    <XCircle size={16} className="mr-2"/>
                                    Switch to Sepolia
                                </Button>
                            )}
                        </div>
                    </div>
                )}
                 {isConnected && isSepolia && (
                    <div className="space-y-3 pt-4">
                        <h4 className="font-semibold">Token Balances</h4>
                        <div className="space-y-2">
                           {(['USDT', 'USDC', 'WETH'] as const).map(symbol => (
                               <div key={symbol} className="flex justify-between items-center p-2 bg-background rounded-md border">
                                   <div className="flex items-center gap-3">
                                       <Image src={getTokenLogo(symbol)} alt={symbol} width={24} height={24} />
                                       <span className="font-bold">{symbol}</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                        <span className="font-mono">{parseFloat(tokenBalances[symbol]).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                        <Button size="sm" variant="outline" onClick={() => actions.getFaucetTokens(symbol)}>Faucet</Button>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const TransactionHistoryPanel = () => {
    const { state } = useAmmDemo();
    const { transactions } = state;
    
    const getStatusBadge = (status: 'Completed' | 'Pending' | 'Failed') => {
        switch (status) {
        case 'Completed': return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Completed</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
        case 'Failed': return <Badge variant="destructive">Failed</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><History /> Transaction History</CardTitle>
                <CardDescription>A log of your actions within this demo.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <p className="font-medium">{tx.type}</p>
                                        <p className="text-xs text-muted-foreground truncate">{tx.details}</p>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                    <TableCell className="text-right text-xs">{formatDistanceToNow(tx.timestamp, { addSuffix: true })}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No transactions yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

const AiOraclePanel = () => {
    const { actions } = useAmmDemo();

    // In a real app, this would come from the contract/context
    const pools = [
        { name: "USDT/USDC Pool", address: "0x..." },
        { name: "WETH/USDT Pool", address: "0x..." }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Bot /> AI Oracle Interface</CardTitle>
                <CardDescription>Submit AI predictions to influence pool parameters like fees.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">Feature coming soon.</p>
            </CardContent>
        </Card>
    );
};

const PoolManagementPanel = () => {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Droplets /> Pool Management</CardTitle>
                <CardDescription>Create new pools and manage liquidity in the AI-AMM.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                 <p className="text-muted-foreground text-sm">Feature coming soon.</p>
            </CardContent>
        </Card>
    );
}

export default function InnovativeAMMDemo() {
    return (
        <div className="container mx-auto p-0 space-y-8">
             <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Innovative AMM Demo</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    A technical showcase of the AI-driven Automated Market Maker system, using isolated mock contracts on the Sepolia testnet.
                </p>
            </div>
            
            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard"><Wallet />Dashboard</TabsTrigger>
                    <TabsTrigger value="oracle"><Bot />AI Oracle</TabsTrigger>
                    <TabsTrigger value="pools"><Droplets />Pools</TabsTrigger>
                    <TabsTrigger value="history"><History />History</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                    <WalletPanel />
                </TabsContent>
                <TabsContent value="oracle" className="mt-6">
                    <AiOraclePanel />
                </TabsContent>
                <TabsContent value="pools" className="mt-6">
                    <PoolManagementPanel />
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                    <TransactionHistoryPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
