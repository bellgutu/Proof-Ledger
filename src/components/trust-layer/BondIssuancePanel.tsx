
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TrendingUp, Loader2 } from 'lucide-react';
import { type Address } from 'viem';
import { useWallet } from '@/contexts/wallet-context';

export const BondIssuancePanel = () => {
    const { actions } = useTrustLayer();
    const { walletState } = useWallet();
    const [isIssuing, setIsIssuing] = useState(false);
    const [investor, setInvestor] = useState('');
    const [amount, setAmount] = useState('');
    const [interest, setInterest] = useState('500'); // 5.00%
    const [duration, setDuration] = useState('30'); // 30 days

    const handleIssue = async () => {
        if (!investor || !amount || !interest || !duration) return;
        setIsIssuing(true);
        try {
            // Using WETH as collateral for simplicity in this demo
            const wethAddress = walletState.marketData['WETH']?.address as Address;
            if (!wethAddress) {
                console.error("WETH address not found");
                return;
            }
            await actions.issueTranche(investor as Address, amount, parseInt(interest), parseInt(duration) * 86400, wethAddress, amount);
        } finally {
            setIsIssuing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <TrendingUp /> Issue New Bond Tranche
                </CardTitle>
                <CardDescription>
                    As a privileged issuer, create a new yield-bearing bond for an investor. This simulates the administrative side of RWA tokenization.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="investor-address">Investor Address</Label>
                        <Input id="investor-address" placeholder="0x..." value={investor} onChange={(e) => setInvestor(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="bond-amount">Amount (USDC)</Label>
                        <Input id="bond-amount" type="number" placeholder="10000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="interest-rate">Interest (Basis Points)</Label>
                        <Input id="interest-rate" type="number" placeholder="500 for 5%" value={interest} onChange={(e) => setInterest(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="duration">Duration (Days)</Label>
                        <Input id="duration" type="number" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                </div>
                <Button onClick={handleIssue} disabled={isIssuing} className="w-full">
                    {isIssuing && <Loader2 className="mr-2 animate-spin" />}
                    Issue Bond
                </Button>
            </CardContent>
        </Card>
    );
};
