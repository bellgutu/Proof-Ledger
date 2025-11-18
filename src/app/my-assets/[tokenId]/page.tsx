
"use client"
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, Diamond, Wheat, MapPin, Shield, CheckCircle, Clock, FileText, Landmark, Hand, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


// Mock data - in a real app, this would be fetched based on the tokenId
const mockAssets: { [key: string]: any } = {
  "1001": {
    tokenId: "1001",
    name: "Rolex Submariner 126610LV",
    assetType: "Luxury Good",
    status: "Verified",
    icon: <Diamond className="h-10 w-10 text-primary" />,
    overview: {
        "Serial No.": "YZ123456",
        "Model No.": "126610LV",
        "Movement Caliber": "Cal. 3235",
        "Minted On": new Date().toLocaleDateString(),
    },
    provenance: [
        { status: "Digital Twin Minted", date: "2023-05-10", verifier: "ProofLedger Genesis" },
        { status: "Initial Verification", date: "2023-05-11", verifier: "WatchSpec" },
    ],
    insurance: {
        status: "Active",
        policyId: "POL-LX-1001",
        provider: "Lloyd's of London",
        coverage: "$25,000",
        nextPremiumDue: "2024-12-01",
    },
    custody: {
        current: "Owner's Vault",
        location: "New York, NY",
        history: [{ custodian: "Rolex SA", date: "2023-01-15" }, { custodian: "Certified Watches Inc.", date: "2023-05-09" }],
    }
  },
   "2001": {
    tokenId: "2001",
    name: "Lot B7, Hard Red Wheat",
    assetType: "Commodity",
    status: "In-Transit",
    icon: <Wheat className="h-10 w-10 text-primary" />,
    overview: {
        "Batch ID": "BATCH-001B",
        "Weight": "15.0 MT",
        "Origin": "Kansas, USA",
        "Minted On": new Date().toLocaleDateString(),
    },
    provenance: [
        { status: "Digital Twin Minted", date: "2024-07-20", verifier: "AgriSource" },
        { status: "CoA Verified", date: "2024-07-21", verifier: "SGS Labs" },
        { status: "Loaded (FOB)", date: "2024-07-22", verifier: "Port of Houston Agent" },
    ],
    insurance: {
        status: "Active",
        policyId: "POL-CM-2001",
        provider: "Agri-Sure",
        coverage: "$8,000",
        nextPremiumDue: "N/A (Single-Trip)",
    },
    custody: {
        current: "Global Shipping Co.",
        location: "Pacific Ocean",
        history: [{ custodian: "AgriSource", date: "2024-07-20" }, { custodian: "Port of Houston", date: "2024-07-22" }],
    }
  },
   "3001": {
    tokenId: "3001",
    name: "456 Oak Street, Anytown",
    assetType: "Real Estate",
    status: "Verified",
    icon: <Building className="h-10 w-10 text-primary" />,
     overview: {
        "Parcel ID": "APN-456-78-90",
        "Property Type": "Single Family Residence",
        "Appraised Value": "$1,200,000",
        "Minted On": new Date().toLocaleDateString(),
    },
    provenance: [
        { status: "Digital Twin Minted", date: "2023-11-01", verifier: "TitleCo" },
        { status: "Appraisal Verified", date: "2023-11-02", verifier: "ValueAssessors" },
    ],
    insurance: {
        status: "Active",
        policyId: "POL-RE-3001",
        provider: "State Farm",
        coverage: "$1,000,000",
        nextPremiumDue: "2025-01-15",
    },
    custody: {
        current: "John & Jane Doe",
        location: "Anytown, USA",
        history: [{ custodian: "Developer Corp", date: "2023-10-30" }],
    }
  },
};

const TimelineItem = ({ isLast, children }: { isLast?: boolean; children: React.ReactNode }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
             <div className={cn(
                "flex-shrink-0 h-4 w-4 rounded-full",
                "bg-primary ring-4 ring-primary/20"
            )} />
            {!isLast && <div className="w-px flex-grow bg-border my-2" />}
        </div>
        <div className="flex-1 pb-8">
            {children}
        </div>
    </div>
);


export default function AssetDetailPage() {
    const params = useParams();
    const { toast } = useToast();
    const tokenId = params.tokenId as string;
    // Fallback to a default asset if the tokenId is not in our mock data
    const asset = mockAssets[tokenId] || mockAssets[Object.keys(mockAssets)[0]];


    const handleTransferCustody = () => {
        toast({
            title: "Custody Transfer Initiated",
            description: "A request has been sent to the new custodian for approval. This will require a multi-sig transaction.",
        });
    };

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
                                    <TimelineItem key={index} isLast={index === asset.provenance.length - 1}>
                                        <p className="font-semibold">{item.status}</p>
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

    