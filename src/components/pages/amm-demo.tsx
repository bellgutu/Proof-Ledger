
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAmmDemo } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle, XCircle, Bot, Cpu, Droplets, History, Settings, RefreshCw, PlusCircle, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useSwitchChain } from 'wagmi';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import type { DemoPool, DemoTransaction, MockTokenSymbol } from '@/contexts/amm-demo-context';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

function WalletPanel() {
    const { state, actions } = useAmmDemo();
    const { isConnected, address, ethBalance, tokenBalances, isProcessing } = state;
    const { chain } = useAccount();
    const { switchChain } = useSwitchChain();
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
                                <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} />{chain?.name || 'Sepolia'}</span>
                            ) : (
                                <Button size="sm" variant="destructive" onClick={() => switchChain?.({ chainId: 11155111 })}>
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
                                        <Button size="sm" variant="outline" onClick={() => actions.getFaucetTokens(symbol)} disabled={isProcessing(`Faucet_${symbol}`)}>
                                            {isProcessing(`Faucet_${symbol}`) ? <Loader2 className="animate-spin" /> : "Faucet"}
                                        </Button>
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

function TransactionHistoryPanel() {
    const { state } = useAmmDemo();
    const { transactions } = state;
    
    const getStatusBadge = (status: DemoTransaction['status']) => {
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

function AiOraclePanel() {
    const { state, actions } = useAmmDemo();
    const [selectedPool, setSelectedPool] = useState<string>('');
    const [fee, setFee] = useState<number>(0.3);
    const [confidence, setConfidence] = useState<number>(85);

    const handleSubmit = () => {
        if (!selectedPool) return;
        actions.submitFeePrediction(selectedPool as `0x${string}`, fee, confidence);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Bot /> AI Oracle Interface</CardTitle>
                <CardDescription>Submit AI predictions to influence pool parameters like fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Pool</Label>
                    <Select onValueChange={setSelectedPool} value={selectedPool}>
                        <SelectTrigger><SelectValue placeholder="Select a pool" /></SelectTrigger>
                        <SelectContent>
                            {state.pools.map(p => <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Predicted Fee: {fee.toFixed(2)}%</Label>
                    <Slider value={[fee]} onValueChange={([val]) => setFee(val)} max={1} step={0.01} />
                </div>
                <div className="space-y-2">
                    <Label>Confidence: {confidence}%</Label>
                    <Slider value={[confidence]} onValueChange={([val]) => setConfidence(val)} max={100} step={1} />
                </div>
                <Button onClick={handleSubmit} disabled={!selectedPool || !state.isConnected || state.isProcessing(`Prediction_${selectedPool}`)} className="w-full">
                    {state.isProcessing(`Prediction_${selectedPool}`) ? <Loader2 className="animate-spin" /> : 'Submit Prediction'}
                </Button>
            </CardContent>
        </Card>
    );
};

function PoolManagementPanel() {
     const { state, actions } = useAmmDemo();
     const [tokenA, setTokenA] = useState('');
     const [tokenB, setTokenB] = useState('');

     const handleCreatePool = () => {
        if (!tokenA || !tokenB || tokenA === tokenB) return;
        actions.createPool(tokenA as MockTokenSymbol, tokenB as MockTokenSymbol);
     }
     
     const tokenOptions = useMemo(() => Object.keys(state.tokenBalances), [state.tokenBalances]);

     return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><PlusCircle /> Create New Pool</CardTitle>
                    <CardDescription>Bootstrap a new AI-AMM pool.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Select onValueChange={setTokenA} value={tokenA}>
                            <SelectTrigger><SelectValue placeholder="Token A"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={setTokenB} value={tokenB}>
                            <SelectTrigger><SelectValue placeholder="Token B"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreatePool} disabled={!tokenA || !tokenB || !state.isConnected || state.isProcessing(`CreatePool_${tokenA}/${tokenB}`)} className="w-full">
                        {state.isProcessing(`CreatePool_${tokenA}/${tokenB}`) ? <Loader2 className="animate-spin" /> : 'Create Pool'}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Droplets /> Existing Pools</CardTitle>
                    <CardDescription>View and manage liquidity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-60">
                        {state.pools.map(pool => (
                            <div key={pool.address} className="p-2 border rounded-md mb-2">
                                <p className="font-bold">{pool.name}</p>
                                <p className="text-xs text-muted-foreground">{pool.address}</p>
                            </div>
                        ))}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

function LiquidityPanel() {
    const { state, actions } = useAmmDemo();
    const { pools, tokenBalances, isProcessing } = state;
    const [selectedPool, setSelectedPool] = useState<DemoPool | null>(null);
    const [amountA, setAmountA] = useState('');
    const [amountB, setAmountB] = useState('');

    const handleAddLiquidity = () => {
        if (!selectedPool || !amountA || !amountB) return;
        actions.addLiquidity(selectedPool.address, amountA, amountB);
    };

    const tokenA = useMemo(() => selectedPool?.name.split('/')[0] as MockTokenSymbol | undefined, [selectedPool]);
    const tokenB = useMemo(() => selectedPool?.name.split('/')[1] as MockTokenSymbol | undefined, [selectedPool]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Droplets/> Add Liquidity</CardTitle>
                <CardDescription>Provide tokens to a pool to earn fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Pool</Label>
                    <Select onValueChange={(addr) => setSelectedPool(pools.find(p => p.address === addr) || null)} >
                        <SelectTrigger><SelectValue placeholder="Select a pool" /></SelectTrigger>
                        <SelectContent>{pools.map(p => <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                {selectedPool && tokenA && tokenB && (
                    <>
                        <div className="space-y-2">
                            <Label>Amount {tokenA}</Label>
                            <Input type="number" value={amountA} onChange={e => setAmountA(e.target.value)} placeholder={`0.0 ${tokenA}`} />
                            <p className="text-xs text-muted-foreground">Balance: {tokenBalances[tokenA]}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount {tokenB}</Label>
                            <Input type="number" value={amountB} onChange={e => setAmountB(e.target.value)} placeholder={`0.0 ${tokenB}`} />
                             <p className="text-xs text-muted-foreground">Balance: {tokenBalances[tokenB]}</p>
                        </div>
                        <Button onClick={handleAddLiquidity} disabled={isProcessing(`AddLiquidity_${selectedPool.address}`)} className="w-full">
                           {isProcessing(`AddLiquidity_${selectedPool.address}`) ? <Loader2 className="animate-spin" /> : 'Add Liquidity'}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function SwapPanel() {
    const { state, actions } = useAmmDemo();
    const { pools, tokenBalances, isProcessing } = state;
    const [fromToken, setFromToken] = useState('');
    const [toToken, setToToken] = useState('');
    const [amount, setAmount] = useState('');

    const tokenOptions = useMemo(() => Object.keys(tokenBalances) as MockTokenSymbol[], [tokenBalances]);

    const handleSwap = () => {
        if (!fromToken || !toToken || !amount) return;
        actions.swap(fromToken as MockTokenSymbol, toToken as MockTokenSymbol, amount);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><ArrowRightLeft /> Token Swap</CardTitle>
                <CardDescription>Swap tokens through the AI-AMM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>From</Label>
                    <div className="flex items-center gap-2">
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.0" />
                         <Select onValueChange={setFromToken} value={fromToken}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Token"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>To</Label>
                    <div className="flex items-center gap-2">
                         <Input type="number" readOnly placeholder="0.0 (estimated)" />
                         <Select onValueChange={setToToken} value={toToken}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Token"/></SelectTrigger>
                            <SelectContent>{tokenOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleSwap} disabled={!fromToken || !toToken || !amount || !state.isConnected || isProcessing(`Swap_${fromToken}_${toToken}`)} className="w-full">
                    {isProcessing(`Swap_${fromToken}_${toToken}`) ? <Loader2 className="animate-spin" /> : 'Swap'}
                </Button>
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
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="dashboard">
                        <span className="flex items-center">
                            <Wallet className="mr-2"/>
                            <span>Dashboard</span>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="pools">
                         <span className="flex items-center">
                            <PlusCircle className="mr-2"/>
                            <span>Pools</span>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="liquidity">
                        <span className="flex items-center">
                            <Droplets className="mr-2"/>
                            <span>Liquidity</span>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="swap">
                        <span className="flex items-center">
                            <RefreshCw className="mr-2"/>
                            <span>Swap</span>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="oracle">
                        <span className="flex items-center">
                            <Bot className="mr-2"/>
                            <span>AI Oracle</span>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <span className="flex items-center">
                            <History className="mr-2"/>
                            <span>History</span>
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                    <WalletPanel />
                </TabsContent>
                <TabsContent value="pools" className="mt-6">
                    <PoolManagementPanel />
                </TabsContent>
                <TabsContent value="liquidity" className="mt-6">
                    <LiquidityPanel />
                </TabsContent>
                 <TabsContent value="swap" className="mt-6">
                    <SwapPanel />
                </TabsContent>
                <TabsContent value="oracle" className="mt-6">
                    <AiOraclePanel />
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                    <TransactionHistoryPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
