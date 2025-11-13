
"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

const mockOracleData = [
    { id: 'DP-001', type: 'Real Estate', provider: 'VeriProp', dataHash: '0x123...abc', status: 'Verified', timestamp: '2023-10-27 10:00' },
    { id: 'DP-002', type: 'Gemstone', provider: 'GemTrust', dataHash: '0x456...def', status: 'Pending', timestamp: '2023-10-27 10:05' },
    { id: 'DP-003', type: 'Commodity', provider: 'AgriChain', dataHash: '0x789...ghi', status: 'Verified', timestamp: '2023-10-26 15:30' },
    { id: 'DP-004', type: 'Shipping', provider: 'ShipSure', dataHash: '0xabc...123', status: 'Failed', timestamp: '2023-10-25 09:12' },
];

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'Verified':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'Pending':
            return <Clock className="h-5 w-5 text-yellow-500" />;
        case 'Failed':
            return <AlertCircle className="h-5 w-5 text-red-500" />;
        default:
            return null;
    }
};

export default function OracleProvidersPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            // Here you would typically show a success/error toast
        }, 1500);
    }
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Oracle Data Providers
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          A secure interface for trusted oracle providers to feed verification data into the platform. This data forms the immutable backbone for all asset verification processes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Submit Verification Data</CardTitle>
                    <CardDescription>Enter the details for the data point you are providing.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dataType">Data Type</Label>
                             <Select>
                                <SelectTrigger id="dataType">
                                    <SelectValue placeholder="Select data type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="real_estate">Real Estate</SelectItem>
                                    <SelectItem value="gemstone">Luxury & Gemstone</SelectItem>
                                    <SelectItem value="commodity">Commodity & Agricultural</SelectItem>
                                    <SelectItem value="shipping">Shipping & Logistics</SelectItem>
                                    <SelectItem value="insurance">Insurance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="providerId">Provider ID</Label>
                            <Input id="providerId" placeholder="e.g., VeriProp_001" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dataPayload">Data Payload (JSON)</Label>
                            <Textarea id="dataPayload" placeholder='{ "assetId": "PROP123", "inspectionPassed": true }' rows={6} />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit to Trust Oracle'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Data Submissions</CardTitle>
                    <CardDescription>A log of the most recent data fed by oracle providers.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Data Hash</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockOracleData.map((data) => (
                                <TableRow key={data.id}>
                                    <TableCell className="flex justify-center items-center"><StatusIcon status={data.status} /></TableCell>
                                    <TableCell className="font-medium">{data.id}</TableCell>
                                    <TableCell>{data.type}</TableCell>
                                    <TableCell>{data.provider}</TableCell>
                                    <TableCell className="font-mono text-xs">{data.dataHash}</TableCell>
                                    <TableCell>{data.timestamp}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    