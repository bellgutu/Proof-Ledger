
"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Vote, FilePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OracleNetworkPanel } from './OracleNetworkPanel';
import { useWallet } from '@/contexts/wallet-context';

export const Governance = () => {
    const { state } = useTrustLayer();
    const { walletState } = useWallet();
    const { openGovernorData, isLoading } = state;

    return (
        <div className="space-y-6">
            <OracleNetworkPanel />
        </div>
    );
};
