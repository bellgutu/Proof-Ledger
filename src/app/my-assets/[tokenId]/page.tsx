
"use client"
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Hand, ShieldAlert, GitCommit, FileText, Anchor } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useWallet } from '@/components/wallet-provider';

const TimelineItem = ({ isLast, children, icon: Icon }: { isLast?: boolean; children: React.ReactNode; icon: React.ElementType }) => (
    <div className="flex gap-6">
        <div className="flex flex-col items-center">
             <div className={cn(
                "flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center",
                "bg-primary/10 text-primary"
            )}>
                <Icon size={24} />
            </div>
            {!isLast && <div className="w-px flex-grow bg-border my-2" />}
        </div>
        <div className="flex-1 pb-10 pt-2.5">
            {children}
        </div>
    </div>
);


export default function AssetDetailPage() {
    const params = useParams();
    const { toast } = useToast();
    const { myAssets } = useWallet();
    const tokenId = params.tokenId as string;
    
    const asset = myAssets.find(a => a.tokenId === tokenId);

    const handleTransferCustody = () => {
        toast({
            title: "Custody Transfer Initiated",
            description: "A request has been sent to the new custodian for approval. This will require a multi-sig transaction.",
        });
    };

    if (!asset) {
        return (
            <div className="container mx-auto p-0">
                <Card>
                    <CardHeader>
                        <CardTitle>Asset Not Found</CardTitle>
                        <CardDescription>This asset could not be found in your connected wallet. It may belong to another account or the token ID may be incorrect.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Link href="/my-assets">
                            <Button>Back to My Assets</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getStatusClass = (status: string, prefix: 'bg' | 'text' | 'border') => {
        switch(status) {
            case "Verified": return `${prefix}-green-400`;
            case "In-Transit": return `${prefix}-blue-400`;
            case "Re-verification Required": return `${prefix}-yellow-400`;
            default: return `${prefix}-muted-foreground`;
        }
    }

    return (
        <div className="container mx-auto p-0 space-y-8">
             <div className="text-left space-y-2">
                <div className="flex items-center gap-4">
                    {asset.icon}
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-primary">
                        {asset.name}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl">
                        {asset.assetType} Digital Twin - Token ID: {asset.tokenId}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Asset Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Current Status</p>
                                    <Badge className={cn("mt-1", 
                                        asset.status === 'Verified' ? 'bg-green-600/20 text-green-300 border-green-500/30' :
                                        asset.status === 'In-Transit' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' :
                                        'bg-yellow-600/20 text-yellow-300 border-yellow-500/30'
                                    )}>{asset.status}</Badge>
                                </div>
                                {Object.entries(asset.overview).map(([key, value]) => (
                                     <div className="space-y-1" key={key}>
                                        <p className="text-muted-foreground">{key}</p>
                                        <p className="font-medium">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Provenance & Verification History</CardTitle>
                            <CardDescription>An immutable audit trail of the asset's lifecycle on the blockchain.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div>
                                {asset.provenance.map((item: any, index: number) => (
                                    <TimelineItem key={index} isLast={index === asset.provenance.length - 1} icon={item.icon === ethers.ZeroAddress ? GitCommit : item.icon}>
                                        <p className="font-semibold text-base">{item.status}</p>
                                        <p className="text-sm text-muted-foreground">Date: {item.date}</p>
                                        <p className="text-sm text-muted-foreground">Verifier: {item.verifier}</p>
                                    </TimelineItem>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Hand size={18}/> Custody</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Current Custodian</Label>
                                <p className="font-semibold text-lg">{asset.custody.current}</p>
                            </div>
                             <div>
                                <Label>Last Known Location</Label>
                                <p className="font-semibold">{asset.custody.location}</p>
                            </div>
                            <Separator />
                            <h4 className="font-semibold text-sm">Chain of Custody</h4>
                            <div className="space-y-2 text-sm">
                                {asset.custody.history.map((item: any, index: number) => (
                                    <p key={index}><span className="text-muted-foreground">{item.date}:</span> {item.custodian}</p>
                                ))}
                            </div>
                            <Button className="w-full" onClick={handleTransferCustody}><Hand className="mr-2 h-4 w-4" /> Transfer Custody</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldAlert size={18}/> Insurance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Insurance Status</Label>
                                <p className={cn("font-semibold text-lg", asset.insurance.status === 'Active' ? 'text-green-400' : 'text-yellow-400')}>
                                    {asset.insurance.status}
                                </p>
                            </div>
                             <div>
                                <Label>Policy ID</Label>
                                <p className="font-mono text-xs">{asset.insurance.policyId}</p>
                            </div>
                             <div>
                                <Label>Coverage</Label>
                                <p className="font-semibold">{asset.insurance.coverage}</p>
                            </div>
                            <Link href="/insurance" passHref className="w-full">
                                <Button variant="secondary" className="w-full">
                                    Manage Policy
                                </Button>
                            </Link>
                             <Link href="/insurance" passHref className="w-full">
                                <Button className="w-full">
                                    File a Claim
                                </Button>
                             </Link>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
