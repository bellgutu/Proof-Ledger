
"use client";

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { List, GitBranch, ShieldCheck, FileSearch, Search, Loader2, Bot, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { useWallet } from '@/contexts/wallet-context';

import { getWatchlistBriefing, type WatchlistBriefing } from '@/ai/flows/watchlist-flow';
import { getBridgeTransactionDetails } from '@/ai/flows/bridge-narrator-flow';
import { auditContract } from '@/ai/flows/contract-auditor-flow';
import { auditToken } from '@/ai/flows/token-auditor-flow';
import { marked } from 'marked';

// Schemas
const AddToWatchlistSchema = z.object({
  symbol: z.string().min(2, "Please select a token."),
});
type AddToWatchlistInput = z.infer<typeof AddToWatchlistSchema>;

const BridgeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive."),
  token: z.string().min(2, "Please select a token."),
  fromChain: z.string().min(2, "Please select a source chain."),
  toChain: z.string().min(2, "Please select a destination chain."),
});
type BridgeInput = z.infer<typeof BridgeSchema>;

const AuditorSchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid address."),
});
type AuditorInput = z.infer<typeof AuditorSchema>;

// Chains & Tokens for Bridge
const supportedChains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BNB Chain'];
const bridgeableTokens = ['ETH', 'USDC', 'USDT'];

export default function IntelligencePage() {
  const { walletState } = useWallet();
  const [activeTab, setActiveTab] = useState('watchlist');

  // Watchlist State
  const [watchlist, setWatchlist] = useState<string[]>(['BTC', 'SOL']);
  const [briefings, setBriefings] = useState<Record<string, WatchlistBriefing>>({});
  const [isBriefingLoading, setIsBriefingLoading] = useState<Record<string, boolean>>({});

  // Bridge State
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeResult, setBridgeResult] = useState<{ title: string; description: string } | null>(null);

  // Auditor State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [auditTitle, setAuditTitle] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Forms
  const watchlistForm = useForm<AddToWatchlistInput>({ resolver: zodResolver(AddToWatchlistSchema), defaultValues: { symbol: "" } });
  const bridgeForm = useForm<BridgeInput>({ resolver: zodResolver(BridgeSchema), defaultValues: { amount: 0, token: "", fromChain: "", toChain: "" } });
  const contractAuditorForm = useForm<AuditorInput>({ resolver: zodResolver(AuditorSchema) });
  const tokenAuditorForm = useForm<AuditorInput>({ resolver: zodResolver(AuditorSchema) });

  const fetchBriefing = useCallback(async (symbol: string) => {
    setIsBriefingLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const result = await getWatchlistBriefing(symbol);
      setBriefings(prev => ({ ...prev, [symbol]: result }));
    } catch (e) {
      console.error(`Failed to fetch briefing for ${symbol}:`, e);
      setBriefings(prev => ({ ...prev, [symbol]: { symbol, briefing: "Failed to load AI briefing. Please try again." } }));
    } finally {
      setIsBriefingLoading(prev => ({ ...prev, [symbol]: false }));
    }
  }, []);
  
  const handleAddToWatchlist = (values: AddToWatchlistInput) => {
    const symbol = values.symbol.toUpperCase();
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
      fetchBriefing(symbol);
      watchlistForm.reset();
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setBriefings(prev => {
      const newBriefings = { ...prev };
      delete newBriefings[symbol];
      return newBriefings;
    });
  };

  const handleBridge = async (values: BridgeInput) => {
    setIsBridging(true);
    setBridgeResult(null);
    try {
        const result = await getBridgeTransactionDetails(values);
        setBridgeResult({
            title: 'Bridge Transaction Initiated',
            description: `${result.summary}\nSource Tx: ${result.sourceTxHash}\nDest Tx: ${result.destTxHash}`
        });
    } catch(e) {
        console.error("Bridging failed", e);
        setBridgeResult({
            title: 'Bridge Failed',
            description: "The AI transaction simulator failed. Please try again."
        });
    } finally {
        setIsBridging(false);
        setIsAlertOpen(true);
    }
  };

  const handleAudit = async (type: 'contract' | 'token', values: AuditorInput) => {
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const result = type === 'contract' ? await auditContract(values.address) : await auditToken(values.address);
      const htmlResult = await marked(result.analysis);
      setAuditResult(htmlResult);
      setAuditTitle(type === 'contract' ? 'Smart Contract Audit Result' : 'Token Audit Result');
    } catch (e) {
      setAuditResult(`<p class="text-destructive">Audit failed. Please try again.</p>`);
      setAuditTitle('Audit Error');
    } finally {
      setIsAuditing(false);
      setIsAlertOpen(true);
    }
  };

  const tokenOptions = Object.keys(walletState.marketData);

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="watchlist"><List className="mr-2"/>AI Watchlist</TabsTrigger>
          <TabsTrigger value="bridge"><GitBranch className="mr-2"/>Cross-Chain Bridge</TabsTrigger>
          <TabsTrigger value="auditors"><ShieldCheck className="mr-2"/>Auditors</TabsTrigger>
        </TabsList>
        
        {/* AI Watchlist Tab */}
        <TabsContent value="watchlist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Asset Watchlist</CardTitle>
              <CardDescription>Add assets to your watchlist to get personalized AI intelligence briefings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={watchlistForm.handleSubmit(handleAddToWatchlist)} className="flex items-center gap-2">
                     <Select onValueChange={(val) => watchlistForm.setValue('symbol', val)} value={watchlistForm.watch('symbol')}>
                        <SelectTrigger><SelectValue placeholder="Select a token" /></SelectTrigger>
                        <SelectContent>
                            {tokenOptions.map(token => <SelectItem key={token} value={token}>{token}</SelectItem>)}
                        </SelectContent>
                     </Select>
                    <Button type="submit"><PlusCircle className="mr-2"/> Add</Button>
                </form>
                <div className="space-y-4">
                    {watchlist.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Your watchlist is empty.</p>
                    ) : watchlist.map(symbol => (
                        <Card key={symbol} className="bg-background/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Image src={getTokenLogo(symbol)} alt={symbol} width={32} height={32}/>
                                    <CardTitle className="text-xl">{symbol}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => fetchBriefing(symbol)} disabled={isBriefingLoading[symbol]}>
                                        {isBriefingLoading[symbol] ? <Loader2 className="animate-spin"/> : <Search />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => removeFromWatchlist(symbol)}>
                                        <Trash2 className="text-destructive"/>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isBriefingLoading[symbol] ? <Skeleton className="h-16 w-full" /> : (
                                     <div className="flex items-start gap-3">
                                        <Bot className="text-primary mt-1 flex-shrink-0"/>
                                        <p className="text-sm text-muted-foreground">
                                            {briefings[symbol]?.briefing || "Click the search icon to generate an AI briefing."}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cross-Chain Bridge Tab */}
        <TabsContent value="bridge" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Cross-Chain Bridge</CardTitle>
                    <CardDescription>Securely transfer your assets between different blockchains.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={bridgeForm.handleSubmit(handleBridge)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label>From Chain</label>
                                <Select onValueChange={val => bridgeForm.setValue('fromChain', val)}>
                                    <SelectTrigger><SelectValue placeholder="Select Source"/></SelectTrigger>
                                    <SelectContent>{supportedChains.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>To Chain</label>
                                <Select onValueChange={val => bridgeForm.setValue('toChain', val)}>
                                    <SelectTrigger><SelectValue placeholder="Select Destination"/></SelectTrigger>
                                    <SelectContent>{supportedChains.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label>Token & Amount</label>
                            <div className="flex gap-2">
                                <Input type="number" placeholder="0.0" {...bridgeForm.register("amount")} />
                                <Select onValueChange={val => bridgeForm.setValue('token', val)}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Token"/></SelectTrigger>
                                    <SelectContent>{bridgeableTokens.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isBridging}>
                            {isBridging ? <Loader2 className="mr-2 animate-spin"/> : <ArrowRight className="mr-2" />}
                            Initiate Bridge
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Auditors Tab */}
        <TabsContent value="auditors" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><ShieldCheck className="mr-2 text-primary"/> Smart Contract Auditor</CardTitle>
                  <CardDescription>Enter a contract address for an AI security analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={contractAuditorForm.handleSubmit(data => handleAudit('contract', data))} className="space-y-4">
                        <Input placeholder="0x..." {...contractAuditorForm.register("address")} />
                        <Button type="submit" disabled={isAuditing} className="w-full">
                            {isAuditing ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
                            Audit Contract
                        </Button>
                   </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><FileSearch className="mr-2 text-primary"/> Token Auditor</CardTitle>
                  <CardDescription>Enter a token address to analyze for potential risks.</CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={tokenAuditorForm.handleSubmit(data => handleAudit('token', data))} className="space-y-4">
                        <Input placeholder="0x..." {...tokenAuditorForm.register("address")} />
                        <Button type="submit" disabled={isAuditing} className="w-full">
                           {isAuditing ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
                            Audit Token
                        </Button>
                   </form>
                </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        
      {/* Universal Alert Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{auditTitle || bridgeResult?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                         {auditResult ? (
                            <div className="prose prose-sm prose-invert max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: auditResult }} />
                         ) : (
                            <p className="whitespace-pre-wrap">{bridgeResult?.description}</p>
                         )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => { setIsAlertOpen(false); setAuditResult(null); setBridgeResult(null); } }>Close</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
