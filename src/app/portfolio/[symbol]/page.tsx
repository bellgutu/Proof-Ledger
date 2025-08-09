
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send, ArrowDown, QrCode, Copy, Loader2, ArrowLeft, Fuel } from 'lucide-react';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { getGasFee } from '@/services/blockchain-service';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SendSchema = z.object({
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid Ethereum address."),
  amount: z.coerce.number().positive("Amount must be positive."),
});
type SendInput = z.infer<typeof SendSchema>;

export default function TokenActionPage({ params }: { params: { symbol: string } }) {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, marketData, walletAddress } = walletState;
  const { sendTokens } = walletActions;
  const { toast } = useToast();
  
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [txDetails, setTxDetails] = useState<SendInput | null>(null);
  const [gasFee, setGasFee] = useState<string>('');

  const pathname = usePathname();
  const symbol = pathname.split('/').pop()?.toUpperCase() || '';

  const tokenName = marketData[symbol]?.name || 'Token';
  const tokenBalance = balances[symbol] || 0;
  const tokenPrice = marketData[symbol]?.price || 0;

  const sendForm = useForm<SendInput>({
    resolver: zodResolver(SendSchema),
    defaultValues: { recipient: '', amount: 0, },
  });

  const amountUSD = useMemo(() => {
    const amount = sendForm.watch('amount');
    return (amount * tokenPrice).toLocaleString('en-us', {style: 'currency', currency: 'USD'});
  }, [sendForm, tokenPrice])

  useEffect(() => {
    const fetchGas = async () => {
      const fee = await getGasFee();
      const feeUSD = fee * (marketData['ETH']?.price || 0);
      setGasFee(`${fee.toFixed(6)} ETH (~$${feeUSD.toFixed(2)})`);
    };
    fetchGas();
  }, [marketData]);

  const handleSendSubmit = (values: SendInput) => {
    if (values.amount > tokenBalance) {
        toast({ variant: 'destructive', title: 'Insufficient balance' });
        return;
    }
    setTxDetails(values);
    setShowConfirm(true);
  };

  const executeSend = async () => {
    if (!txDetails) return;
    setShowConfirm(false);
    setSending(true);

    try {
      const result = await sendTokens(txDetails.recipient, symbol, txDetails.amount);
      if (result.success) {
        toast({ title: 'Transaction Sent!', description: `You sent ${txDetails.amount} ${symbol}. Tx: ${result.txHash.slice(0,10)}...` });
        sendForm.reset();
      } else {
        throw new Error('Transaction failed on-chain.');
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Transaction Failed', description: 'Something went wrong while sending your transaction.'});
    } finally {
      setSending(false);
    }
  };
  
  const handleCopyAddress = () => {
    if(!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    toast({ title: 'Address Copied!'});
  }

  if(!symbol) {
    return null;
  }

  return (
    <div className="container mx-auto p-0 space-y-4">
       <div>
        <Link href="/portfolio" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Portfolio
        </Link>
        <div className="flex items-center gap-4">
           <Image src={getTokenLogo(symbol)} alt={tokenName} width={40} height={40}/>
           <div>
            <h1 className="text-3xl font-bold">{tokenName} ({symbol})</h1>
            <p className="text-muted-foreground">Balance: {tokenBalance.toLocaleString()} {symbol}</p>
           </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send"><Send className="mr-2" />Send</TabsTrigger>
              <TabsTrigger value="receive"><ArrowDown className="mr-2" />Receive</TabsTrigger>
            </TabsList>
            
            <TabsContent value="send" className="mt-6">
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
                            <Input type="number" placeholder="0.0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} disabled={!isConnected} />
                        </FormControl>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>~{amountUSD}</span>
                            <button type="button" onClick={() => sendForm.setValue('amount', tokenBalance)}>Max</button>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={!isConnected || sending} className="w-full">
                    {sending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                    Send {symbol}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="receive" className="mt-6 text-center space-y-4">
                <CardDescription>Share your address to receive {symbol}.</CardDescription>
                <div className="p-4 bg-background rounded-md border flex flex-col items-center justify-center">
                    <QrCode size={128} className="mb-4 text-foreground p-2 bg-white rounded-md"/>
                    <p className="font-mono text-sm break-all">{walletAddress || "Connect your wallet first"}</p>
                    <Button variant="ghost" size="sm" onClick={handleCopyAddress} disabled={!isConnected}>
                        <Copy className="mr-2"/> Copy Address
                    </Button>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transaction</AlertDialogTitle>
            <AlertDialogDescription>Please review the details below before confirming.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center p-3 rounded-md bg-muted">
                <span className="font-bold text-3xl">{txDetails?.amount.toLocaleString()} {symbol}</span>
                <Image src={getTokenLogo(symbol)} alt={symbol} width={32} height={32}/>
            </div>
             <div className="text-sm space-y-2">
                <p className="flex justify-between"><span>To:</span> <span className="font-mono truncate">{txDetails?.recipient}</span></p>
                <p className="flex justify-between items-center">
                    <span><Fuel className="inline mr-2"/>Est. Gas Fee:</span> 
                    <span className="font-mono">{gasFee}</span>
                </p>
             </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeSend}>Confirm & Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
