
"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Vote, FilePlus, CircleDollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Governance = () => {
    const { state } = useTrustLayer();
    const { openGovernorData, isLoading } = state;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Landmark /> Governance Overview
                    </CardTitle>
                    <CardDescription>Key metrics for the OpenGovernor DAO.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                    ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Proposals</p>
                            <p className="text-2xl font-bold">{openGovernorData.activeProposals}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Proposals</p>
                            <p className="text-2xl font-bold">{openGovernorData.proposalCount}</p>
                        </div>
                         <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Treasury Value</p>
                            <p className="text-2xl font-bold">${parseFloat(openGovernorData.treasuryValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
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
