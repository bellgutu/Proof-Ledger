

"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { FileSearch, Search, Loader2, GitBranch, ShieldCheck, ArrowRight, FileText } from 'lucide-react';

import { getBridgeTransactionDetails } from '@/ai/flows/bridge-narrator-flow';
import { auditContract } from '@/ai/flows/contract-auditor-flow';
import { auditToken } from '@/ai/flows/token-auditor-flow';
import { analyzeWhitePaper } from '@/ai/flows/whitepaper-analyzer-flow';
import { marked } from 'marked';
import { Skeleton } from '../ui/skeleton';

// Schemas
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

const AnalyzerInputSchema = z.object({
  whitePaperUrl: z.string().url({ message: "Please enter a valid URL." }),
});
type AnalyzerInput = z.infer<typeof AnalyzerInputSchema>;

// Chains & Tokens for Bridge
const supportedChains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BNB Chain'];
const bridgeableTokens = ['ETH', 'USDT'];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('bridge');

  // Universal State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results State
  const [bridgeResult, setBridgeResult] = useState<{ summary: string; sourceTxHash: string; destTxHash: string } | null>(null);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Alert Dialog State
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState<{title: string, description: React.ReactNode} | null>(null);

  // Forms
  const bridgeForm = useForm<BridgeInput>({ resolver: zodResolver(BridgeSchema), defaultValues: { amount: 0, token: "", fromChain: "", toChain: "" } });
  const contractAuditorForm = useForm<AuditorInput>({ resolver: zodResolver(AuditorSchema) });
  const tokenAuditorForm = useForm<AuditorInput>({ resolver: zodResolver(AuditorSchema) });
  const analyzerForm = useForm<AnalyzerInput>({ resolver: zodResolver(AnalyzerInputSchema), defaultValues: { whitePaperUrl: "" } });

  const handleBridge = async (values: BridgeInput) => {
    setIsLoading(true);
    setBridgeResult(null);
    setError(null);
    try {
        const result = await getBridgeTransactionDetails(values);
        setBridgeResult(result);
        setAlertContent({
            title: 'Bridge Transaction Simulated',
            description: <div className="text-sm text-left"><p>{result.summary}</p><p className="mt-2 text-xs font-mono">Src: {result.sourceTxHash}</p><p className="text-xs font-mono">Dest: {result.destTxHash}</p></div>
        });
        setIsAlertOpen(true);
    } catch(e: any) {
        setError(e.message || "The AI transaction simulator failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleAudit = async (type: 'contract' | 'token', values: AuditorInput) => {
    setIsLoading(true);
    setAuditResult(null);
    setError(null);
    try {
      const result = type === 'contract' ? await auditContract(values.address) : await auditToken(values.address);
      const htmlResult = await marked(result.analysis);
      setAuditResult(htmlResult);
      setAlertContent({
          title: type === 'contract' ? 'Smart Contract Audit Result' : 'Token Audit Result',
          description: <div className="prose prose-sm prose-invert max-w-none text-left max-h-[50vh] overflow-y-auto prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: htmlResult }} />
      });
      setIsAlertOpen(true);
    } catch (e: any) {
      setError(e.message || 'Audit failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  async function handleAnalyze(values: AnalyzerInput) {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await analyzeWhitePaper(values.whitePaperUrl);
      const htmlResult = await marked(result.analysis);
      setAnalysisResult(htmlResult);
    } catch (e: any) {
      setError(e.message || "Failed to analyze the white paper. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bridge"><GitBranch className="mr-2"/>Cross-Chain Bridge</TabsTrigger>
          <TabsTrigger value="auditors"><ShieldCheck className="mr-2"/>Auditors</TabsTrigger>
          <TabsTrigger value="analyzer"><FileText className="mr-2"/>Doc Analyzer</TabsTrigger>
        </TabsList>
        
        {/* Cross-Chain Bridge Tab */}
        <TabsContent value="bridge" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Cross-Chain Bridge Simulator</CardTitle>
                    <CardDescription>Simulate asset transfers between different blockchains with AI-generated transaction details.</CardDescription>
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
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <ArrowRight className="mr-2" />}
                            Initiate Bridge
                        </Button>
                    </form>
                    {error && <p className="text-destructive text-center mt-4">{error}</p>}
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
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
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
                        <Button type="submit" disabled={isLoading} className="w-full">
                           {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
                            Audit Token
                        </Button>
                   </form>
                </CardContent>
            </Card>
             {error && <p className="text-destructive text-center mt-4 lg:col-span-2">{error}</p>}
          </div>
        </TabsContent>

        {/* Analyzer Tab */}
        <TabsContent value="analyzer" className="mt-6">
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>AI White Paper Analyzer</CardTitle>
                        <CardDescription>Submit a URL to a white paper to get an AI-generated summary and analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={analyzerForm.handleSubmit(handleAnalyze)} className="space-y-4">
                            <Input placeholder="https://example.com/whitepaper.pdf" {...analyzerForm.register("whitePaperUrl")} />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
                                Analyze White Paper
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                {error && <p className="text-destructive text-center">{error}</p>}
                {isLoading && (
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                )}
                {analysisResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Analysis Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm prose-invert max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: analysisResult }} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </TabsContent>
      </Tabs>
        
      {/* Universal Alert Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{alertContent?.title}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                         <div className="pt-2">{alertContent?.description || ''}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setIsAlertOpen(false)}>Close</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
