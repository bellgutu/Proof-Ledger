
"use client"
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileArchive, FileText } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

export const BondManagementCard = () => {
    const { state } = useTrustLayer();
    const { proofBondData } = state;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileArchive className="h-5 w-5" />
                    ProofBond Management
                </CardTitle>
                <CardDescription>
                    Your issued and held bond positions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-4">
                        {proofBondData.userBonds.length > 0 ? (
                            proofBondData.userBonds.map(bond => (
                                <div key={bond.id} className="p-3 border rounded-lg bg-background">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold flex items-center gap-2"><FileText size={16}/> Bond #{bond.id}</p>
                                        <Button size="sm" variant="outline" disabled>Redeem</Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-1">
                                        <span>Amount:</span><span className="font-mono text-right">{bond.amount} USDC</span>
                                        <span>Yield:</span><span className="font-mono text-right">{bond.yield}%</span>
                                        <span>Maturity:</span><span className="font-mono text-right">{new Date(bond.maturity * 1000).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>You do not hold any ProofBonds.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
