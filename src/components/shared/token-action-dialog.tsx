
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send, ArrowDown, QrCode, Copy, Loader2, Fuel, History, Wallet, ArrowDownCircle, Check, ShieldCheck } from 'lucide-react';
import { getTokenLogo } from '@/lib/tokenLogos';
import { getGasFee } from '@/services/blockchain-service';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { ChainAsset } from '@/contexts/wallet-context';
import { useRouter } from 'next/navigation';

const SendSchema = z.object({
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid Ethereum address."),
  amount: z.coerce.number().positive("Amount must be positive."),
});
type SendInput = z.infer<typeof SendSchema>;

interface TokenActionDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    asset: ChainAsset;
}

export function TokenActionDialog({ isOpen, setIsOpen, asset }: TokenActionDialogProps) {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, marketData, walletAddress } = walletState;
  const { sendTokens } = walletActions;
  const { toast } = useToast();
  const router = useRouter();
  
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [txDetails, setTxDetails] = useState<SendInput | null>(null);
  const [gasFee, setGasFee] = useState<string>('');
  
  const [copied, setCopied] = useState<string | null>(null);

  const sendForm = useForm<SendInput>({
    resolver: zodResolver(SendSchema),
    defaultValues: { recipient: '', amount: '' as any },
  });

  const assetPrice = marketData[asset.symbol]?.price || 0;
  
  const amountUSD = useMemo(() => {
    const amount = sendForm.watch('amount');
    return ((Number(amount) || 0) * assetPrice).toLocaleString('en-us', {style: 'currency', currency: 'USD'});
  }, [sendForm, assetPrice, asset.symbol]);
  
  const fetchGas = async () => {
    if(!isConnected) return;
    try {
      const fee = await getGasFee();
      const feeUSD = fee * (marketData['ETH']?.price || 0);
      setGasFee(`${fee.toFixed(6)} ETH (~$${feeUSD.toFixed(2)})`);
    } catch (e) {
        console.error("Failed to fetch gas fee", e);
        setGasFee("Unavailable");
    }
  };

  const handleSendSubmit = async (values: SendInput) => {
    if (values.amount > (balances[asset.symbol] || 0)) {
        toast({ variant: 'destructive', title: 'Insufficient balance' });
        return;
    }
    await fetchGas();
    setTxDetails(values);
    setShowConfirm(true);
  };

  const executeSend = async () => {
    if (!txDetails || !walletAddress) return;
    
    setShowConfirm(false);
    setSending(true);

    try {
      const result = await sendTokens(txDetails.recipient, asset.symbol, txDetails.amount);
      if (result.success) {
        toast({ title: 'Transaction Submitted!', description: `Your transaction is being processed. Tx: ${result.txHash.slice(0,10)}...` });
        sendForm.reset();
        setIsOpen(false);
      } else {
        throw new Error('Transaction failed on-chain.');
      }
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Transaction Failed', description: e.message || 'Something went wrong while sending your transaction.'});
    } finally {
      setSending(false);
    }
  };
  
  const handleCopy = (text: string, field: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast({ title: `${field} copied!`});
    setTimeout(() => setCopied(null), 2000);
  };
  
  useEffect(() => {
    if (!isOpen) {
        sendForm.reset({ recipient: '', amount: '' as any });
    }
  }, [isOpen, sendForm]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full md:w-[450px] flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle className="flex items-center gap-3">
             <Image src={getTokenLogo(asset.symbol)} alt={asset.symbol} width={32} height={32}/>
             {asset.name} ({asset.symbol})
          </SheetTitle>
          <SheetDescription>Send, receive, or view history for this asset.</SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-hidden px-6 pb-6">
        <Tabs defaultValue="send" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="send"><Send />Send</TabsTrigger>
            <TabsTrigger value="receive"><ArrowDown />Receive</TabsTrigger>
            <TabsTrigger value="history"><History />History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send" className="mt-6 flex-grow">
            <Form {...sendForm}>
              <form onSubmit={sendForm.handleSubmit(handleSendSubmit)} className="space-y-6">
                <FormField
                  control={sendForm.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} disabled={!isConnected} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               <FormField
                control={sendForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                        <div>
                            <Input type="number" placeholder="0.0" {...field} onChange={field.onChange} disabled={!isConnected} />
                        </div>
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>~{amountUSD}</span>
                        <button type="button" onClick={() => sendForm.setValue('amount', balances[asset.symbol] || 0)}>Max: {(balances[asset.symbol] || 0).toLocaleString('en-US', { maximumFractionDigits: 6 })}</button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
                />
                <Button type="submit" disabled={!isConnected || sending} className="w-full">
                  {sending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                  Review Transaction
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="receive" className="mt-6 text-center space-y-4">
              <SheetDescription>Share your address to receive {asset.symbol}.</SheetDescription>
              <div className="p-4 bg-background rounded-md border flex flex-col items-center justify-center">
                  <QrCode size={128} className="mb-4 text-foreground p-2 bg-white rounded-md"/>
                  <p className="font-mono text-sm break-all">{walletAddress || "Connect your wallet first"}</p>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(walletAddress, 'Your address')}>
                      <Copy className="mr-2"/> Copy Address
                  </Button>
              </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 flex-grow overflow-hidden flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground text-sm">Token-specific history is coming soon.</p>
                <Button variant="link" onClick={() => {
                    setIsOpen(false);
                    router.push('/portfolio/history');
                }}>View Full History</Button>
          </TabsContent>
        </Tabs>
        </div>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center text-2xl">Confirm Transaction</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        You are about to send {asset.symbol}. Please review the details carefully.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <Image src={getTokenLogo(asset.symbol || '')} alt={asset.symbol || ''} width={48} height={48} className="rounded-full"/>
                        <p className="text-4xl font-bold">
                          {txDetails?.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.symbol}
                        </p>
                        <p className="text-muted-foreground">
                            ~{( (txDetails?.amount || 0) * assetPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                            <span className="text-xs text-muted-foreground font-semibold">FROM</span>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wallet size={16}/> <span>Your Wallet</span>
                                </div>
                                <span className="font-mono text-xs">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
                            </div>
                        </div>

                        <div className="flex justify-center text-muted-foreground">
                            <ArrowDownCircle size={24} className="animate-pulse"/>
                        </div>

                        <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                            <span className="text-xs text-muted-foreground font-semibold">TO</span>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16}/> <span>Recipient</span>
                                </div>
                                 <button onClick={() => handleCopy(txDetails?.recipient || '', 'Recipient')} className="flex items-center gap-1 font-mono text-xs hover:text-primary">
                                    {txDetails?.recipient.slice(0, 6)}...{txDetails?.recipient.slice(-4)}
                                    {copied === 'Recipient' ? <Check size={12}/> : <Copy size={12}/>}
                                 </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm p-3 border rounded-md">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Fuel size={16}/> Est. Gas Fee
                        </div>
                        <span className="font-mono">{gasFee}</span>
                    </div>
                </div>

                <AlertDialogFooter className="grid grid-cols-2 gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={executeSend} className="animate-pulse-strong">Confirm & Send</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
