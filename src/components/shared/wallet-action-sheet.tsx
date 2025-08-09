
"use client"

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send, ArrowDown, QrCode, Copy, Loader2, Fuel, History } from 'lucide-react';
import { getTokenLogo } from '@/lib/tokenLogos';
import { getGasFee } from '@/services/blockchain-service';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '../ui/scroll-area';

const SendSchema = z.object({
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid Ethereum address."),
  token: z.string().min(1, "Please select a token."),
  amount: z.coerce.number().positive("Amount must be positive."),
});
type SendInput = z.infer<typeof SendSchema>;

export function WalletActionSheet({ children }: { children: React.ReactNode }) {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, marketData, walletAddress, transactions } = walletState;
  const { sendTokens } = walletActions;
  const { toast } = useToast();
  
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [txDetails, setTxDetails] = useState<SendInput | null>(null);
  const [gasFee, setGasFee] = useState<string>('');
  
  const availableTokens = Object.keys(balances).filter(token => balances[token] > 0);

  const sendForm = useForm<SendInput>({
    resolver: zodResolver(SendSchema),
    defaultValues: { recipient: '', token: '', amount: 0 },
  });

  const selectedToken = sendForm.watch('token');
  const selectedTokenPrice = marketData[selectedToken]?.price || 0;
  const amountUSD = useMemo(() => {
    const amount = sendForm.watch('amount');
    return (amount * selectedTokenPrice).toLocaleString('en-us', {style: 'currency', currency: 'USD'});
  }, [sendForm, selectedTokenPrice]);

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
    if (values.amount > (balances[values.token] || 0)) {
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
      const result = await sendTokens(txDetails.recipient, txDetails.token, txDetails.amount);
      if (result.success) {
        toast({ title: 'Transaction Sent!', description: `You sent ${txDetails.amount} ${txDetails.token}. Tx: ${result.txHash.slice(0,10)}...` });
        sendForm.reset();
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
  
  const handleCopyAddress = () => {
    if(!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    toast({ title: 'Address Copied!'});
  }

  const TokenSelectItem = ({ token }: { token: string }) => (
    <SelectItem value={token}>
      <div className="flex items-center">
        <Image src={getTokenLogo(token)} alt={token} width={20} height={20} className="mr-2" />
        {token}
      </div>
    </SelectItem>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full md:w-[450px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Wallet Actions</SheetTitle>
          <SheetDescription>Send assets, receive funds, and view your transaction history.</SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-hidden">
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
                 <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={sendForm.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isConnected}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableTokens.map(token => <TokenSelectItem key={token} token={token} />)}
                              </SelectContent>
                            </Select>
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
                                 <Input type="number" placeholder="0.0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} disabled={!isConnected} />
                               </div>
                            </FormControl>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>~{amountUSD}</span>
                                {selectedToken && <button type="button" onClick={() => sendForm.setValue('amount', balances[selectedToken] || 0)}>Max</button>}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                <Button type="submit" disabled={!isConnected || sending} className="w-full">
                  {sending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                  Review Transaction
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="receive" className="mt-6 text-center space-y-4">
              <SheetDescription>Share your address to receive assets.</SheetDescription>
              <div className="p-4 bg-background rounded-md border flex flex-col items-center justify-center">
                  <QrCode size={128} className="mb-4 text-foreground p-2 bg-white rounded-md"/>
                  <p className="font-mono text-sm break-all">{walletAddress || "Connect your wallet first"}</p>
                  <Button variant="ghost" size="sm" onClick={handleCopyAddress} disabled={!isConnected}>
                      <Copy className="mr-2"/> Copy Address
                  </Button>
              </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 flex-grow overflow-hidden">
             <ScrollArea className="h-full pr-4">
                  {transactions.length > 0 ? (
                      <div className="space-y-4">
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
          </TabsContent>
        </Tabs>
        </div>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Transaction</AlertDialogTitle>
                <AlertDialogDescription>Please review the details below before confirming.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex justify-between items-center p-3 rounded-md bg-muted">
                    <span className="font-bold text-3xl">{txDetails?.amount.toLocaleString()} {txDetails?.token}</span>
                    <Image src={getTokenLogo(txDetails?.token || '')} alt={txDetails?.token || ''} width={32} height={32}/>
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
      </SheetContent>
    </Sheet>
  );
}
