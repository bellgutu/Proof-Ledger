
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, FileArchive, TrendingUp, Loader2, ReceiptText, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BondIssuancePanel } from './BondIssuancePanel';
import { TreasuryStrategiesPanel } from './TreasuryStrategiesPanel';
import { useWallet } from '@/contexts/wallet-context';

export const YieldInsights = () => {
    const { state, actions } = useTrustLayer();
    const { walletState } = useWallet();
    const { proofBondData, isLoading } = state;
    const [isRedeeming, setIsRedeeming] = useState<number | null>(null);
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);

    const handleRedeem = async (bondId: number) => {
        setIsRedeeming(bondId);
        try {
            await actions.redeemBond(bondId);
        } finally {
            setIsRedeeming(null);
        }
    };

    const handlePurchase = async () => {
        if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) return;
        setIsPurchasing(true);
        try {
            await actions.purchaseBond(purchaseAmount);
        } finally {
            setIsPurchasing(false);
            setPurchaseAmount('');
        }
    };
    
    return (
        <div className="space-y-6">
            <TreasuryStrategiesPanel />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <FileArchive /> ProofBond Market
                    </CardTitle>
                    <CardDescription>
                        Purchase or manage yield-bearing bonds backed by real-world assets.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Bond Size</p>
                            <p className="text-2xl font-bold">{parseFloat(proofBondData.trancheSize).toLocaleString()} PBND</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Value Locked</p>
                            <p className="text-2xl font-bold">${parseFloat(proofBondData.tvl).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Bonds</p>
                            <p className="text-2xl font-bold">{proofBondData.activeBonds}</p>
                        </div>
                    </div>
                    )}
                    <div className="p-4 border rounded-lg space-y-2">
                        <h4 className="font-semibold">Purchase ProofBonds</h4>
                        <p className="text-xs text-muted-foreground">Purchase protocol bonds with USDC. These bonds represent a claim on future protocol revenue and help capitalize the treasury.</p>
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                placeholder="Amount in USDC"
                                value={purchaseAmount}
                                onChange={e => setPurchaseAmount(e.target.value)}
                                disabled={!walletState.isConnected}
                            />
                            <Button onClick={handlePurchase} disabled={isLoading || !purchaseAmount || isPurchasing || !walletState.isConnected}>
                                {isPurchasing ? <Loader2 className="animate-spin"/> : "Purchase"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <BondIssuancePanel />

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
                    ) : !walletState.isConnected ? (
                        <div className="text-center p-8 text-muted-foreground">Connect your wallet to see your bonds.</div>
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
