
"use client";
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { DollarSign, BarChart2, Zap, Star, Copy, PlusCircle, GitBranch, UserCheck, Banknote, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { contracts } from '@/config/contracts';


const paymentLedgerData = [
    { id: 'ATTEST-0012', requestor: 'ProofLedger', fee: '1.00', bonus: '0.25', status: 'Paid', date: '2023-10-27' },
    { id: 'ATTEST-0011', requestor: 'ProofLedger', fee: '1.00', bonus: '0.00', status: 'Paid', date: '2023-10-27' },
    { id: 'ATTEST-0010', requestor: 'ProofLedger', fee: '1.00', bonus: '0.00', status: 'Pending', date: '2023-10-26' },
    { id: 'ATTEST-0009', requestor: 'ProofLedger', fee: '1.00', bonus: '-3.00', status: 'Paid (Slashed)', date: '2023-10-25' },
];

type CertificationType = 'real_estate' | 'gemstone' | 'commodity_coa' | 'shipping_event' | 'sensor_data';
type IntegrationName = "ADOBE" | "DOCUTECH";

const OnboardingStep = ({ step, title, description, children, completed, isActive }: { step: number, title: string, description: React.ReactNode, children: React.ReactNode, completed?: boolean, isActive?: boolean }) => {
    return (
        <div className="flex items-start gap-4 group">
            <div className="flex flex-col items-center h-full">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-bold transition-colors",
                    completed ? "bg-primary text-primary-foreground border-primary" : 
                    isActive ? "border-primary" : "bg-transparent border-border group-hover:border-primary/50"
                )}>
                    {completed ? <UserCheck size={20} /> : step}
                </div>
                {step < 3 && <div className="mt-2 h-full w-px bg-border" />}
            </div>
            <div className={cn("flex-1 space-y-2 pt-1.5 pb-8", !isActive && !completed && "opacity-50")}>
                <h4 className="font-semibold">{title}</h4>
                <div className="text-sm text-muted-foreground space-y-2">{description}</div>
                <div className="pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};


export function OracleProvidersConsole() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [certificationType, setCertificationType] = useState<CertificationType | ''>('');
    const [integrationName, setIntegrationName] = useState<IntegrationName | ''>('');
    const [stakeAmount, setStakeAmount] = useState('0.5');
    const [isRegistered, setIsRegistered] = useState(false);

    const { toast } = useToast();
    const { writeContractAsync } = useWriteContract();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            toast({
                title: 'Submission Successful',
                description: 'Your verified data has been received and is being attested.',
                variant: 'default'
            })
        }, 1500);
    }

    const handleRegisterOracle = async () => {
        if (!stakeAmount || parseFloat(stakeAmount) < 0.5) {
            toast({ title: "Staking Error", description: "Minimum stake is 0.5 ETH.", variant: "destructive"});
            return;
        }

        try {
            toast({ title: "Processing Transaction", description: "Please confirm in your wallet." });
            const tx = await writeContractAsync({
                abi: contracts.trustOracle.abi,
                address: contracts.trustOracle.address,
                functionName: 'registerOracle',
                args: ['ipfs://YourMetadataURI'], // Placeholder for metadata
                value: ethers.parseEther(stakeAmount)
            });
            toast({ title: "Registration Successful", description: `Transaction sent: ${tx}` });
            setIsRegistered(true);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Registration Failed", description: error.shortMessage || error.message, variant: "destructive" });
        }
    };

    const handleCreateIntegration = async () => {
        if (!integrationName) {
            toast({
                title: "Error",
                description: "Please select an integration name.",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch('/api/proof/integrations', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: integrationName }),
            });

            if (!response.ok) {
                throw new Error("Failed to create integration.");
            }
            const data = await response.json();
            toast({
                title: "Integration Created",
                description: (
                    <pre className="mt-2 w-full rounded-md bg-secondary p-4">
                        <code className="text-foreground">{JSON.stringify(data, null, 2)}</code>
                    </pre>
                ),
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not create integration.",
                variant: "destructive"
            });
        }
    };

    const copyApiKey = () => {
        navigator.clipboard.writeText('pl_live_xxxxxxxxxxxxxxxxxxxxxxxx');
        toast({ title: 'API Key Copied' });
    }

    const renderForm = () => {
        switch (certificationType) {
            case 'real_estate':
                return (
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="parcelId">Parcel/APN ID</Label>
                            <Input id="parcelId" placeholder="e.g., 012-345-678" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerWallet">Legal Owner Wallet</Label>
                            <Input id="ownerWallet" placeholder="0x..." />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="encumbranceStatus" />
                            <Label htmlFor="encumbranceStatus">Has Encumbrance (Liens/Mortgages)?</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="geoHash">Property Geo-Hash</Label>
                            <Input id="geoHash" placeholder="Cryptographic hash of coordinates" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="titleDeedHash">Title Deed Hash (SHA-256)</Label>
                            <Input id="titleDeedHash" placeholder="Immutable hash of the PDF document" />
                        </div>
                    </div>
                );
            case 'gemstone':
                return (
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="certId">Certificate ID (GIA/Lab)</Label>
                            <Input id="certId" placeholder="e.g., GIA-12345678" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="caratWeight">Carat Weight</Label>
                            <Input id="caratWeight" type="number" placeholder="e.g., 1.52" />
                        </div>
                         <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="cut">Cut</Label>
                                <Input id="cut" placeholder="Excellent" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color">Color</Label>
                                <Input id="color" placeholder="F" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clarity">Clarity</Label>
                                <Input id="clarity" placeholder="VS1" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageHash">360° Image Hash</Label>
                            <Input id="imageHash" placeholder="Hash of high-resolution imagery" />
                        </div>
                    </div>
                );
            case 'commodity_coa':
                 return (
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="batchId">Batch/Lot ID</Label>
                            <Input id="batchId" placeholder="e.g., COFFEE-B7-2024" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="moisture">Moisture Content (%)</Label>
                            <Input id="moisture" type="number" placeholder="e.g., 11.5" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="protein">Protein Content (%)</Label>
                            <Input id="protein" type="number" placeholder="e.g., 12.8" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="contaminantStatus" />
                            <Label htmlFor="contaminantStatus">Contamination Detected?</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coaHash">CoA Document Hash</Label>
                            <Input id="coaHash" placeholder="Immutable hash of the lab certificate" />
                        </div>
                    </div>
                );
             case 'shipping_event':
                return (
                    <div className="space-y-4 pt-4">
                         <div className="space-y-2">
                            <Label htmlFor="shipmentId">Shipment Contract ID</Label>
                            <Input id="shipmentId" placeholder="e.g., SH-734-556" />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="milestone">Milestone Name</Label>
                             <Select>
                                <SelectTrigger id="milestone">
                                    <SelectValue placeholder="Select milestone..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="loaded">Loaded</SelectItem>
                                    <SelectItem value="customs_cleared">Customs Cleared</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="eventGeo">Event Geo-Location</Label>
                            <Input id="eventGeo" placeholder="e.g., 34.0522, -118.2437" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="inspectorWallet">Inspector Wallet ID</Label>
                            <Input id="inspectorWallet" placeholder="0x..." />
                        </div>
                    </div>
                );
            case 'sensor_data':
                 return (
                    <div className="space-y-4 pt-4">
                         <div className="space-y-2">
                            <Label htmlFor="assetTokenId">Asset Token ID</Label>
                            <Input id="assetTokenId" placeholder="e.g., ASSET-LUX-101" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="metricName">Metric Name</Label>
                                <Input id="metricName" value="Temperature" readOnly />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="metricValue">Metric Value</Label>
                                <Input id="metricValue" type="number" placeholder="e.g., 10.5" />
                            </div>
                        </div>
                    </div>
                );
            default:
                return <p className="text-sm text-muted-foreground text-center py-8">Select a certification type to begin.</p>;
        }
    }

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Oracle Partner Console
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          A secure, enterprise-grade interface for our trusted data partners. Monetize your data, monitor performance, and provide critical verification for real-world assets.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue (MTD)</CardTitle>
                    <DollarSign size={20} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">$4,823.00</div>
                    <p className="text-xs text-muted-foreground pt-1">+15.2% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">API Requests (MTD)</CardTitle>
                    <BarChart2 size={20} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">4,823</div>
                    <p className="text-xs text-muted-foreground pt-1">Avg. 160 requests/day</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">SLA Performance</CardTitle>
                    <Zap size={20} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-400">99.98%</div>
                    <p className="text-xs text-muted-foreground pt-1">Latency: 45ms (avg)</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
                    <Star size={20} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-blue-400">Tier 1</div>
                    <p className="text-xs text-muted-foreground pt-1">98.7% Accuracy</p>
                </CardContent>
            </Card>
        </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Oracle Network Onboarding</CardTitle>
                    <CardDescription>Follow these steps to become a trusted data provider on the Proof Ledger network.</CardDescription>
                </CardHeader>
                <CardContent>
                    <OnboardingStep 
                        step={1} 
                        title="Complete KYC/AML Verification" 
                        description="Verify your identity and business details via our compliance partner."
                        completed={true}
                        isActive={!isRegistered}
                    >
                        <Link href="/compliance" className="w-full">
                            <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto" asChild>
                                <div>View Compliance Hub <ArrowRight className="ml-2 h-4 w-4" /></div>
                            </Button>
                        </Link>
                    </OnboardingStep>
                    <OnboardingStep 
                        step={2} 
                        title="Stake ETH to Register" 
                        description={
                            <>
                                <p>Lock a minimum of 0.5 ETH to gain attestation rights. Your stake is slashable for providing incorrect data.</p>
                                <div className="mt-2 flex items-start gap-2 text-xs p-2 bg-secondary/50 rounded-md border">
                                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-semibold">Slashing Rules:</span> A minimum of <span className="font-mono">0.155 ETH</span> will be slashed for false data. Three strikes will trigger a partnership re-evaluation.
                                    </div>
                                </div>
                            </>
                        }
                        completed={isRegistered}
                        isActive={!isRegistered}
                    >
                         <div className="flex flex-col sm:flex-row items-center gap-2">
                            <Input 
                                type="number" 
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="w-full sm:w-24"
                                placeholder="0.5"
                                disabled={isRegistered}
                            />
                            <Button onClick={handleRegisterOracle} className="w-full sm:w-auto" disabled={isRegistered}>
                                Register as Oracle
                            </Button>
                        </div>
                    </OnboardingStep>
                     <OnboardingStep 
                        step={3} 
                        title="Start Submitting Data" 
                        description="Use the console or API to start providing verifications and earning rewards."
                        isActive={isRegistered}
                    >
                         <Button variant="secondary" size="sm" className="mt-2 w-full sm:w-auto" disabled={!isRegistered}>
                            View API Documentation <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </OnboardingStep>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>API & Integrations</CardTitle>
                    <CardDescription>Manage keys and automated system connections.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                        <Label>Your API Key</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly type="password" value="pl_live_xxxxxxxxxxxxxxxxxxxxxxxx" className="font-mono" />
                            <Button variant="outline" size="icon" onClick={copyApiKey}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                   </div>
                    <div className="space-y-2">
                        <Label>API Endpoint</Label>
                        <Input readOnly value="https://api.proofledger.app/v1/attest" className="font-mono" />
                   </div>
                   <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="integrationName">New Integration Name</Label>
                      <Select onValueChange={(value: IntegrationName) => setIntegrationName(value)}>
                          <SelectTrigger id="integrationName">
                              <SelectValue placeholder="Select integration..." />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="ADOBE">ADOBE</SelectItem>
                              <SelectItem value="DOCUTECH">DOCUTECH</SelectItem>
                          </SelectContent>
                      </Select>
                   </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button variant="outline" className="w-full" onClick={handleCreateIntegration} disabled={!integrationName}>
                        <GitBranch className="mr-2 h-4 w-4" /> Create New Integration
                    </Button>
                    <Button variant="secondary" className="w-full">View API Documentation</Button>
                </CardFooter>
            </Card>
        </div>
        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Manual Submission Console</CardTitle>
                    <CardDescription>For human-centric workflows like inspector reports or expert appraisals.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dataType">Certification Type</Label>
                             <Select onValueChange={(value: CertificationType) => setCertificationType(value)}>
                                <SelectTrigger id="dataType">
                                    <SelectValue placeholder="Select certification type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="real_estate">Real Estate Title</SelectItem>
                                    <SelectItem value="gemstone">Gemstone Grading</SelectItem>
                                    <SelectItem value="commodity_coa">Commodity CoA</SelectItem>
                                    <SelectItem value="shipping_event">Shipping Milestone</SelectItem>
                                    <SelectItem value="sensor_data">Insurance/Sensor Data</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="border-t border-border -mx-6 px-6">
                            {renderForm()}
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full" disabled={isSubmitting || !certificationType}>
                            {isSubmitting ? 'Submitting...' : 'Submit & Attest Data'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Payment & Audit Ledger</CardTitle>
                    <CardDescription>A record of all data attestations and the revenue you've earned.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Verification ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Requestor</TableHead>
                                <TableHead className="text-right">Base Fee</TableHead>
                                <TableHead className="text-right">Bonus/Penalty</TableHead>
                                <TableHead className="text-right">Payment Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentLedgerData.map((data) => (
                                <TableRow key={data.id}>
                                    <TableCell className="font-mono text-xs">{data.id}</TableCell>
                                    <TableCell>{data.date}</TableCell>
                                    <TableCell>{data.requestor}</TableCell>
                                    <TableCell className="font-mono text-right">${data.fee}</TableCell>
                                    <TableCell className={cn(
                                        "font-mono text-right",
                                        parseFloat(data.bonus) > 0 && "text-green-400",
                                        parseFloat(data.bonus) < 0 && "text-red-400"
                                    )}>${data.bonus}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant={data.status === 'Paid' ? 'default' : data.status === 'Pending' ? 'secondary' : 'destructive'}
                                            className={cn(
                                                data.status === 'Paid' && 'bg-green-600/20 text-green-300 border-green-500/30',
                                                data.status === 'Paid (Slashed)' && 'bg-red-600/20 text-red-300 border-red-500/30'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full mr-2",
                                                data.status === 'Paid' && 'bg-green-400',
                                                data.status === 'Pending' && 'bg-yellow-400',
                                                data.status === 'Paid (Slashed)' && 'bg-red-400',
                                            )}></div>
                                            {data.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="justify-end">
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> View Full History</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
