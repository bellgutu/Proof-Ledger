
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitCommit, Users, Bot, FileCheck, Loader2, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';

export const MarketIntegrity = () => {
    const { state, actions } = useTrustLayer();
    const { trustOracleData, isLoading } = state;
    const [isRegistering, setIsRegistering] = useState(false);

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            await actions.registerOracleProvider();
        } catch (e) {
            // Error is handled in the context's executeTransaction
            console.error("Registration failed on component level:", e);
        } finally {
            setIsRegistering(false);
        }
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Bot /> AI Oracle Network
                    </CardTitle>
                     <CardDescription>
                        The health and security of the decentralized oracle network providing AI predictions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                    ) : (
                    <>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Users /> Active Oracle Providers</p>
                            <p className="text-3xl font-bold">{trustOracleData.activeProviders}</p>
                            <p className="text-xs text-muted-foreground mt-1">Staked providers submitting real-time data.</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Minimum Stake</p>
                            <p className="text-3xl font-bold">{trustOracleData.minStake} ETH</p>
                             <p className="text-xs text-muted-foreground mt-1">Ensures financial commitment and discourages malicious behavior.</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Minimum Submissions for Consensus</p>
                            <p className="text-3xl font-bold">{trustOracleData.minSubmissions}</p>
                            <p className="text-xs text-muted-foreground mt-1">Guarantees data redundancy and accuracy.</p>
                        </div>
                         <Button onClick={handleRegister} disabled={isRegistering} className="w-full">
                            {isRegistering ? (
                                <Loader2 className="mr-2 animate-spin" />
                            ) : (
                                <UserPlus className="mr-2" />
                            )}
                            Register as a Provider ({trustOracleData.minStake} ETH Stake)
                        </Button>
                    </>
                    )}
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <FileCheck /> Asset Verification
                    </CardTitle>
                    <CardDescription>
                        Real-time data on the backing and verification of tokenized real-world assets (RWAs).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-16 text-muted-foreground">
                        <p>Asset verification dashboard coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
