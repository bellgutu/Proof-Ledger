
"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { DollarSign, BarChart2, Zap, Key, Copy, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';


const paymentLedgerData = [
    { id: 'ATTEST-0012', requestor: 'EnterpriseVerifi', fee: '1.00', status: 'Paid', date: '2023-10-27' },
    { id: 'ATTEST-0011', requestor: 'EnterpriseVerifi', fee: '1.00', status: 'Paid', date: '2023-10-27' },
    { id: 'ATTEST-0010', requestor: 'EnterpriseVerifi', fee: '1.00', status: 'Pending', date: '2023-10-26' },
    { id: 'ATTEST-0009', requestor: 'EnterpriseVerifi', fee: '1.00', status: 'Paid', date: '2023-10-25' },
];

type CertificationType = 'real_estate' | 'gemstone' | 'commodity_coa' | 'shipping_event' | 'sensor_data';

export default function OracleProvidersPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [certificationType, setCertificationType] = useState<CertificationType | ''>('');
    const { toast } = useToast();

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

    const copyApiKey = () => {
        navigator.clipboard.writeText('ep_live_xxxxxxxxxxxxxxxxxxxxxxxx');
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
          Verification Partner Portal
        </h1>
        <p className="text-lg text-muted-foreground max-wxl">
          A secure, enterprise-grade interface for our trusted data partners. Monetize your data, monitor performance, and provide critical verification for real-world assets.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue Earned (MTD)</CardTitle>
                    <DollarSign size={20} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">$4,823.00</div>
                    <p className="text-xs text-muted-foreground pt-1">+15.2% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">API Requests Served (MTD)</CardTitle>
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
        </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-1 space-y-8">
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
                    <CardTitle>Verified Data Submission API</CardTitle>
                    <CardDescription>Integrate your systems with our platform for automated, real-time data feeds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                        <Label>Your API Key</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly type="password" value="ep_live_xxxxxxxxxxxxxxxxxxxxxxxx" className="font-mono" />
                            <Button variant="outline" size="icon" onClick={copyApiKey}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                   </div>
                    <div className="space-y-2">
                        <Label>API Endpoint</Label>
                        <Input readOnly value="https://api.enterpriseverifi.com/v1/attest" className="font-mono" />
                   </div>
                </CardContent>
                <CardFooter>
                    <Button variant="secondary" className="w-full">View API Documentation</Button>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-2">
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
                                <TableHead>Requestor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Fee Earned ($)</TableHead>
                                <TableHead className="text-right">Payment Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentLedgerData.map((data) => (
                                <TableRow key={data.id}>
                                    <TableCell className="font-mono text-xs">{data.id}</TableCell>
                                    <TableCell>{data.requestor}</TableCell>
                                    <TableCell>{data.date}</TableCell>
                                    <TableCell className="font-mono text-right text-green-400">${data.fee}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant={data.status === 'Paid' ? 'default' : 'secondary'}
                                            className={cn(data.status === 'Paid' && 'bg-green-600/20 text-green-300 border-green-500/30')}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full mr-2",
                                                data.status === 'Paid' && 'bg-green-400',
                                                data.status === 'Pending' && 'bg-yellow-400',
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

    