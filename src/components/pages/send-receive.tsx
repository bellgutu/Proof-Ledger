
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletHeader } from '@/components/shared/wallet-header';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send, ArrowDown, QrCode, Copy, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';

const SendSchema = z.object({
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid Ethereum address."),
  token: z.string().min(1, "Please select a token."),
  amount: z.coerce.number().positive("Amount must be positive."),
});
type SendInput = z.infer<typeof SendSchema>;

export default function SendReceivePage() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, walletAddress } = walletState;
  const { updateBalance, addTransaction } = walletActions;
  const { toast } = useToast();
  
  const [sending, setSending] = useState(false);

  const sendForm = useForm<SendInput>({
    resolver: zodResolver(SendSchema),
    defaultValues: {
      recipient: '',
      token: '',
      amount: 0,
    },
  });
  
  const availableTokens = Object.keys(balances).filter(token => balances[token] > 0);

  const handleSend = (values: SendInput) => {
    if (values.amount > (balances[values.token] || 0)) {
        toast({ variant: 'destructive', title: 'Insufficient balance' });
        return;
    }
    
    setSending(true);
    setTimeout(() => {
        updateBalance(values.token, -values.amount);
        addTransaction({
            type: 'Send',
            details: `Sent ${values.amount} ${values.token} to ${values.recipient.slice(0, 6)}...${values.recipient.slice(-4)}`
        });
        toast({ title: 'Transaction Sent!', description: `You sent ${values.amount} ${values.token}.` });
        sendForm.reset();
        setSending(false);
    }, 1500);
  };
  
  const handleCopyAddress = () => {
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
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Send className="mr-3" /> Send & Receive
          </CardTitle>
          <CardDescription>Transfer assets to other wallets or receive them.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send"><Send className="mr-2" />Send</TabsTrigger>
              <TabsTrigger value="receive"><ArrowDown className="mr-2" />Receive</TabsTrigger>
            </TabsList>
            
            <TabsContent value="send" className="mt-6">
              <Form {...sendForm}>
                <form onSubmit={sendForm.handleSubmit(handleSend)} className="space-y-6">
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
                                 <Input type="number" placeholder="0.0" {...field} disabled={!isConnected} />
                                 {field.value > 0 && <p className="text-xs text-muted-foreground mt-1">Balance: {(balances[sendForm.getValues('token')] || 0).toLocaleString()}</p>}
                               </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>

                  <Button type="submit" disabled={!isConnected || sending} className="w-full">
                    {sending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                    Send Assets
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="receive" className="mt-6 text-center space-y-4">
                <CardDescription>Share your address to receive assets.</CardDescription>
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
    </div>
  );
}
