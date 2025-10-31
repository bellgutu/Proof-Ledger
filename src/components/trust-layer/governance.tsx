
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { OracleNetworkPanel } from './OracleNetworkPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { GitPullRequestArrow, Loader2, ListTree } from 'lucide-react';
import { type Address } from 'viem';

const AssetPairPanel = () => {
    const { state, actions } = useTrustLayer();
    const [tokenA, setTokenA] = useState('');
    const [tokenB, setTokenB] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddPair = async () => {
        if (!tokenA || !tokenB) return;
        setIsAdding(true);
        try {
            await actions.addAssetPair(tokenA as Address, tokenB as Address);
        } finally {
            setIsAdding(false);
            setTokenA('');
            setTokenB('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <ListTree /> Oracle Market Authorization
                </CardTitle>
                <CardDescription>
                    Manage which asset pairs the AI Oracle network is authorized to monitor and provide data for.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-background border rounded-lg">
                    <h4 className="font-semibold mb-2">Monitored Pairs ({state.trustOracleData.activePairIds.length})</h4>
                    <p className="text-xs text-muted-foreground">
                        {state.trustOracleData.activePairIds.length > 0
                            ? `Currently tracking pairs with IDs: ${state.trustOracleData.activePairIds.join(', ')}`
                            : "No asset pairs are currently being monitored."
                        }
                    </p>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold">Authorize New Pair</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input placeholder="Token A Address" value={tokenA} onChange={e => setTokenA(e.target.value)} />
                        <Input placeholder="Token B Address" value={tokenB} onChange={e => setTokenB(e.target.value)} />
                    </div>
                    <Button onClick={handleAddPair} disabled={isAdding || !tokenA || !tokenB} className="w-full">
                        {isAdding ? <Loader2 className="mr-2 animate-spin" /> : <GitPullRequestArrow className="mr-2" />}
                        Add Asset Pair
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


export const Governance = () => {
    return (
        <div className="space-y-6">
            <OracleNetworkPanel />
            <AssetPairPanel />
        </div>
    );
};

    