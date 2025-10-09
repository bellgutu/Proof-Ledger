

"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, FileArchive, TrendingUp, Loader2, ReceiptText, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const YieldInsights = () => {
    const { state, actions } = useTrustLayer();
    const { safeVaultData, proofBondData, isLoading } = state;
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState<number | null>(null);

    const handlePurchase = async () => {
        if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) return;
        setIsPurchasing(true);
        try {
            await actions.purchaseBond(purchaseAmount);
            setPurchaseAmount('');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRedeem = async (bondId: number) => {
        setIsRedeeming(bondId);
        try {
            await actions.redeemBond(bondId);
        } finally {
            setIsRedeeming(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <PiggyBank /> SafeVault Performance
                        </CardTitle>
                        <CardDescription>
                            Insights into the secure vault holding assets for yield generation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                        ) : (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Value Locked</p>
                                <p className="text-3xl font-bold">${safeVaultData.totalAssets}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <FileArchive /> ProofBond Market
                        </CardTitle>
                        <CardDescription>
                            Metrics on yield-bearing bonds backed by real-world assets.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                        ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Value Locked</p>
                                <p className="text-2xl font-bold">${proofBondData.tvl}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Active Bonds</p>
                                <p className="text-2xl font-bold">{proofBondData.activeBonds}</p>
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <TrendingUp /> Purchase ProofBonds
                    </CardTitle>
                    <CardDescription>
                        Purchase a yield-bearing bond, backed by real-world assets.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-end">
                        <div className="flex-grow">
                            <label htmlFor="purchase-amount" className="text-sm font-medium">Amount (USDC)</label>
                            <Input 
                                id="purchase-amount"
                                type="number" 
                                placeholder="e.g., 1000"
                                value={purchaseAmount}
                                onChange={(e) => setPurchaseAmount(e.target.value)}
                            />
                        </div>
                        <Button onClick={handlePurchase} disabled={isPurchasing || !purchaseAmount}>
                            {isPurchasing && <Loader2 className="mr-2 animate-spin" />}
                            Purchase Bond
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <ReceiptText /> Your Bonds
                    </CardTitle>
                    <CardDescription>
                        View and manage your purchased ProofBonds.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center p-8 text-muted-foreground">Loading your bonds...</div>
                    ) : proofBondData.userBonds.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">You do not hold any bonds.</div>
                    ) : (
                        <div className="space-y-4">
                            {proofBondData.userBonds.map(bond => (
                                <div key={bond.id} className="p-4 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">Bond #{bond.id}</p>
                                        <p className="text-sm text-muted-foreground">Amount: {bond.amount} USDC</p>
                                        <p className="text-sm text-muted-foreground">Matures: {new Date(bond.maturity * 1000).toLocaleDateString()}</p>
                                    </div>
                                    <Button onClick={() => handleRedeem(bond.id)} disabled={isRedeeming === bond.id || new Date() < new Date(bond.maturity * 1000)}>
                                        {isRedeeming === bond.id ? <Loader2 className="mr-2 animate-spin" /> : 'Redeem'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

