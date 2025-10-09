
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, UserPlus, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const OracleNetworkPanel = () => {
    const { state, actions } = useTrustLayer();
    const { trustOracleData, isLoading, userData } = state;
    
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [price, setPrice] = useState('');
    const [confidence, setConfidence] = useState('95');

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            await actions.registerOracleProvider();
        } finally {
            setIsRegistering(false);
        }
    };

    const handleSubmit = async () => {
        if (!price || !confidence) return;
        setIsSubmitting(true);
        try {
            await actions.submitOracleData(price, parseInt(confidence));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Bot /> AI Oracle Network
                </CardTitle>
                 <CardDescription>
                    The decentralized network of AI providers who stake capital to submit data.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {isLoading ? (
                    <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Active Providers</p>
                        <p className="text-3xl font-bold">{trustOracleData.activeProviders}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Minimum Stake</p>
                        <p className="text-3xl font-bold">{trustOracleData.minStake} ETH</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Min. Submissions</p>
                        <p className="text-3xl font-bold">{trustOracleData.minSubmissions}</p>
                    </div>
                </div>
                )}

                {userData.isOracleProvider ? (
                    <div className="p-4 border rounded-lg space-y-4">
                        <h4 className="font-semibold">Submit Oracle Data</h4>
                        <div className="flex gap-4">
                            <Input type="number" placeholder="Price (e.g., 4150.75)" value={price} onChange={e => setPrice(e.target.value)} />
                            <Input type="number" placeholder="Confidence (0-100)" value={confidence} onChange={e => setConfidence(e.target.value)} />
                        </div>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2" />}
                            Submit Prediction
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleRegister} disabled={isRegistering || isLoading} className="w-full">
                        {isRegistering ? <Loader2 className="mr-2 animate-spin" /> : <UserPlus className="mr-2" />}
                        Register as a Provider ({trustOracleData.minStake} ETH Stake)
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};
