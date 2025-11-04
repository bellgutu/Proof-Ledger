
"use client";
import React, { useState } from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, UserPlus, Loader2, Send, Database, CheckCircle, AlertTriangle, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const ProviderStatusPanel = () => {
    const { state, actions } = useTrustLayer();
    const { userOracleStatus, isLoading } = state;
    const [isUnregistering, setIsUnregistering] = useState(false);

    const handleUnregister = async () => {
        setIsUnregistering(true);
        try {
            await actions.unregisterAndWithdraw();
        } finally {
            setIsUnregistering(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 border rounded-lg"><Loader2 className="animate-spin" /></div>;
    }
    
    if (!userOracleStatus.isProvider) {
        return null; // Don't show this panel if the user isn't a provider
    }

    return (
        <div className="p-4 border rounded-lg space-y-4 bg-background">
            <h4 className="font-semibold text-lg text-primary">Your Oracle Status</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-bold flex items-center gap-2 ${userOracleStatus.isActive ? 'text-green-500' : 'text-yellow-500'}`}>
                        {userOracleStatus.isActive ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                        {userOracleStatus.isActive ? 'Active' : 'Inactive'}
                    </p>
                </div>
                 <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Your Stake</p>
                    <p className="font-bold">{userOracleStatus.stake} ETH</p>
                </div>
            </div>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        <UserMinus className="mr-2" /> Unregister & Withdraw Stake
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove you as a data provider and return your staked ETH. You will no longer be able to submit observations or earn rewards. This action is irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnregister} disabled={isUnregistering}>
                            {isUnregistering ? <Loader2 className="animate-spin"/> : "Confirm & Unregister"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export const OracleNetworkPanel = () => {
    const { state, actions } = useTrustLayer();
    const { trustOracleData, isLoading, userOracleStatus } = state;
    
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [price, setPrice] = useState('');
    const [confidence, setConfidence] = useState('95');

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            await actions.registerAsProvider();
        } finally {
            setIsRegistering(false);
        }
    };

    const handleSubmit = async () => {
        if (!price || !confidence) return;
        setIsSubmitting(true);
        try {
            await actions.submitObservation(price);
        } finally {
            setIsSubmitting(false);
            setPrice('');
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Bot /> Trust Oracle Network
                    </CardTitle>
                    <CardDescription>
                        A decentralized network of providers who stake capital to submit data, ensuring market integrity and accurate pricing.
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

                    {userOracleStatus.isProvider ? (
                        <div className="p-4 border rounded-lg space-y-4 bg-background">
                            <h4 className="font-semibold">Submit Oracle Data</h4>
                            <div className="flex gap-4">
                                <Input type="number" placeholder="Price (e.g., 4150.75)" value={price} onChange={e => setPrice(e.target.value)} />
                                <Input type="number" placeholder="Confidence (0-100)" value={confidence} onChange={e => setConfidence(e.target.value)} disabled />
                            </div>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2" />}
                                Submit Observation
                            </Button>
                        </div>
                    ) : (
                        !isLoading && (
                            <Button onClick={handleRegister} disabled={isRegistering || isLoading} className="w-full">
                                {isRegistering ? <Loader2 className="mr-2 animate-spin" /> : <UserPlus className="mr-2" />}
                                Become a Data Provider ({trustOracleData.minStake} ETH Stake)
                            </Button>
                        )
                    )}
                </CardContent>
            </Card>

            <ProviderStatusPanel />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Database /> Registered Providers</CardTitle>
                    <CardDescription>A list of all staked oracle providers in the network.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Provider Address</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Stake</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={3} className="h-12 text-center">Loading...</TableCell></TableRow>
                                    ))
                                ) : trustOracleData.providers.length > 0 ? (
                                    trustOracleData.providers.map(p => (
                                        <TableRow key={p.address}>
                                            <TableCell className="font-mono text-xs">{p.address}</TableCell>
                                            <TableCell>
                                                <span className={`flex items-center gap-1 text-xs ${p.active ? 'text-green-500' : 'text-yellow-500'}`}>
                                                    {p.active ? <CheckCircle size={14} /> : <AlertTriangle size={14}/>}
                                                    {p.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{parseFloat(p.stake).toFixed(4)} ETH</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No oracle providers registered.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};
