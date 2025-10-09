"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Vote, FilePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OracleNetworkPanel } from './OracleNetworkPanel';

export const Governance = () => {
    const { state } = useTrustLayer();
    const { openGovernorData, isLoading } = state;

    return (
        <div className="space-y-6">
            <OracleNetworkPanel />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Landmark /> OpenGovernor DAO
                    </CardTitle>
                    <CardDescription>Key metrics and actions for the protocol's governance.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {isLoading ? (
                        <div className="col-span-3 flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                    ) : (
                    <>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Proposals</p>
                            <p className="text-2xl font-bold">{openGovernorData.activeProposals}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Proposals</p>
                            <p className="text-2xl font-bold">{openGovernorData.proposalCount}</p>
                        </div>
                         <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Treasury Value</p>
                            <p className="text-2xl font-bold">${parseFloat(openGovernorData.treasuryValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                    </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Vote /> Active Proposals
                    </CardTitle>
                    <CardDescription>Review and vote on current proposals to shape the future of the protocol.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                     ) : openGovernorData.activeProposals > 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>Proposal voting interface coming soon.</p>
                        </div>
                     ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>There are no active proposals at the moment.</p>
                        </div>
                     )}
                     <Button className="w-full mt-4" disabled><FilePlus className="mr-2"/> Create New Proposal</Button>
                </CardContent>
            </Card>
        </div>
    );
};
