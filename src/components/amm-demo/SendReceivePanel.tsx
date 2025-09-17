
"use client";
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useAmmDemo, type MockTokenSymbol } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTokenLogo, MOCK_TOKENS } from '@/lib/tokenLogos';
import { Send, ArrowDown, QrCode, Copy, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isValidAddress } from '@/lib/utils';
import { type Address } from 'viem';

export function SendReceivePanel() {
    const { state, actions } = useAmmDemo();
    const { isConnected, ethBalance, tokenBalances, address, isProcessing } = state;
    const { toast } = useToast();

    const [selectedToken, setSelectedToken] = useState<MockTokenSymbol | 'ETH'>('ETH');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [copied, setCopied] = useState(false);

    const balance = selectedToken === 'ETH' ? ethBalance : tokenBalances[selectedToken];

    const handleSend = () => {
        if (!isValidAddress(recipient)) {
            toast({ variant: 'destructive', title: "Invalid Recipient Address" });
            return;
        }
        if (parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)) {
            toast({ variant: 'destructive', title: "Invalid Amount" });
            return;
        }
        actions.send(selectedToken, recipient as Address, amount);
    };
    
    const handleSetMax = () => {
        setAmount(balance);
    };
    
    const handleCopy = () => {
        if(!address) return;
        navigator.clipboard.writeText(address);
        setCopied(true);
        toast({ title: "Address copied!"});
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send & Receive</CardTitle>
                <CardDescription>Transfer mock assets on the Sepolia testnet.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="send">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="send" className="flex items-center gap-2"><Send /> Send</TabsTrigger>
                        <TabsTrigger value="receive" className="flex items-center gap-2"><ArrowDown /> Receive</TabsTrigger>
                    </TabsList>
                    <TabsContent value="send" className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Token & Amount</Label>
                            <div className="flex gap-2">
                                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" disabled={!isConnected} />
                                <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v as MockTokenSymbol | 'ETH')} disabled={!isConnected}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ETH"><div className="flex items-center gap-2"><Image src={getTokenLogo('ETH')} alt="ETH" width={16} height={16}/>ETH</div></SelectItem>
                                        {Object.keys(MOCK_TOKENS).map(token => (
                                            <SelectItem key={token} value={token}>
                                                <div className="flex items-center gap-2"><Image src={getTokenLogo(token)} alt={token} width={16} height={16}/>{token}</div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Balance: {parseFloat(balance).toLocaleString()}</span>
                                <button onClick={handleSetMax} className="text-primary hover:underline" disabled={!isConnected}>MAX</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Recipient Address</Label>
                            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." disabled={!isConnected} />
                        </div>
                        <Button onClick={handleSend} className="w-full" disabled={!isConnected || isProcessing(`Send_${selectedToken}_${amount}`)}>
                             {isProcessing(`Send_${selectedToken}_${amount}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                            Send
                        </Button>
                    </TabsContent>
                    <TabsContent value="receive" className="pt-6 space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">Share your address to receive assets.</p>
                        <div className="p-4 bg-background rounded-md border flex flex-col items-center justify-center">
                            <QrCode size={128} className="mb-4 text-foreground p-2 bg-white rounded-md"/>
                            <p className="font-mono text-sm break-all">{address || "Connect your wallet first"}</p>
                            <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!address}>
                                {copied ? <Check className="mr-2"/> : <Copy className="mr-2"/>} 
                                {copied ? "Copied" : "Copy Address"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
