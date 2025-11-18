
"use client";

import { useState, ChangeEvent, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileUp, MapPin, Building, ShieldAlert, Users, CheckCircle, ArrowRight, FileCheck, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';

type FileState = {
  titleDeed: File | null;
  appraisalReport: File | null;
  surveyMap: File | null;
};

// Custom component for file uploads to reduce repetition
const FileUploadButton = ({ id, label, required, file, onFileChange, onClear }: { id: keyof FileState, label: string, required: boolean, file: File | null, onFileChange: (e: ChangeEvent<HTMLInputElement>, fileType: keyof FileState) => void, onClear: (fileType: keyof FileState) => void }) => (
  <div>
    <Label className="flex items-center justify-between">
      {label}
      {required && <Badge variant="destructive">Required</Badge>}
    </Label>
    {file ? (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-2 text-sm bg-secondary p-2 rounded-md w-full">
            <FileCheck className="h-4 w-4 text-green-400" />
            <span className="truncate">{file.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onClear(id)}>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    ) : (
      <div className="relative mt-2">
        <Button variant="outline" className="w-full mt-2 h-11 text-base" asChild>
            <label htmlFor={id} className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4" /> Upload PDF/DWG
            </label>
        </Button>
        <Input 
          id={id} 
          type="file" 
          className="hidden"
          onChange={(e) => onFileChange(e, id)}
          accept=".pdf,.dwg"
        />
      </div>
    )}
  </div>
);


export default function RealEstatePage() {
    const { toast } = useToast();
    const [legalId, setLegalId] = useState('');
    const [appraisedValue, setAppraisedValue] = useState('');
    const [recipient, setRecipient] = useState('');

    const [files, setFiles] = useState<FileState>({
        titleDeed: null,
        appraisalReport: null,
        surveyMap: null,
    });

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: keyof FileState) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [fileType]: file }));
             toast({
                title: 'File Selected',
                description: `${file.name} is ready for processing.`,
            });
        }
    };
    
    const handleClearFile = (fileType: keyof FileState) => {
        setFiles(prev => ({ ...prev, [fileType]: null }));
    };

    const isMintingDisabled = useMemo(() => {
        return !legalId || !appraisedValue || !files.titleDeed || !files.appraisalReport || !files.surveyMap;
    }, [legalId, appraisedValue, files]);

    const handleMintAsset = async () => {
        if (isMintingDisabled) {
            toast({
                title: 'Missing Information',
                description: 'Please fill all required fields and upload all mandatory documents.',
                variant: 'destructive',
            });
            return;
        }

        // In a real app, you would hash the files and send to the smart contract.
        // For now, we simulate this process.
        toast({
            title: 'Ready to Mint!',
            description: "Asset data has been prepared for the smart contract.",
            action: (
                 <pre className="mt-2 w-[340px] rounded-md bg-background p-4">
                    <code className="text-foreground">{JSON.stringify({
                        legalId,
                        appraisedValue,
                        titleDeedHash: `0x...${files.titleDeed?.name.slice(0,4)}`,
                        appraisalReportHash: `0x...${files.appraisalReport?.name.slice(0,4)}`,
                        surveyMapHash: `0x...${files.surveyMap?.name.slice(0,4)}`,
                    }, null, 2)}</code>
                </pre>
            )
        });
    }

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <div className="flex items-center gap-4">
            <Building className="h-12 w-12 text-primary" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Real Estate Asset Verification
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                Establish the immutable, verified digital title and legal status of a property.
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>A. Title & Cadastral Data</CardTitle>
              <CardDescription>Enter the property's legal and geographic identifiers.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="legalId">Legal/Parcel ID</Label>
                  <Input id="legalId" placeholder="e.g., APN-012-345-67" value={legalId} onChange={(e) => setLegalId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geoCoords">Geo-Coordinates (Lat, Lng)</Label>
                  <Input id="geoCoords" placeholder="e.g., 34.0522, -118.2437" />
                </div>
                 <Badge variant="secondary" className="w-fit">
                    <MapPin className="h-4 w-4 mr-2"/>
                    Geo-Fencing Oracle: Pending Attestation
                </Badge>
              </div>
              <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden relative">
                 <Image src="https://picsum.photos/seed/property1/600/600" layout="fill" objectFit="cover" alt="Abstract image of a property" data-ai-hint="abstract property" className="opacity-70" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <MapPin className="h-8 w-8 text-primary animate-pulse-strong" />
                 </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>B. Valuation & Encumbrance</CardTitle>
              <CardDescription>Provide financial details and active liens on the property.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="appraisedValue">Current Appraised Value ($)</Label>
                <Input id="appraisedValue" type="number" placeholder="e.g., 1,200,000" value={appraisedValue} onChange={(e) => setAppraisedValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appraisalDate">Last Appraisal Date</Label>
                <Input id="appraisalDate" type="date" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="encumbrance">Encumbrance Status (Liens, Mortgages)</Label>
                <Input id="encumbrance" placeholder="e.g., Mortgage with Bank of Example" />
                 <Badge variant="outline" className="w-fit mt-2">
                    <ShieldAlert className="h-4 w-4 mr-2 text-yellow-400"/>
                    Financial Contract Status: Not Collateralized
                </Badge>
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
                <CardTitle>D. Ownership Management</CardTitle>
                <CardDescription>Securely transfer the verified digital title.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Wallet Address</Label>
                    <Input id="recipient" placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} />
                </div>
                 <Badge>
                    <Users className="h-4 w-4 mr-2"/>
                    Recipient KYC Level: Requires Tier 3
                </Badge>
            </CardContent>
            <CardFooter>
                 <Button className="w-full h-11 text-base lg:w-auto" disabled={!recipient}>
                    <ArrowRight className="mr-2 h-4 w-4" /> Initiate Multi-Sig Transfer
                </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>C. Document Uploads</CardTitle>
              <CardDescription>Upload mandatory legal documents for hashing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadButton id="titleDeed" label="Title Deed" required={true} file={files.titleDeed} onFileChange={handleFileChange} onClear={handleClearFile} />
              <FileUploadButton id="appraisalReport" label="Appraisal Report" required={true} file={files.appraisalReport} onFileChange={handleFileChange} onClear={handleClearFile} />
              <FileUploadButton id="surveyMap" label="Survey Map" required={true} file={files.surveyMap} onFileChange={handleFileChange} onClear={handleClearFile} />
            </CardContent>
             <CardFooter className="gap-2">
                <Button className="w-full h-12 text-base" onClick={handleMintAsset} disabled={isMintingDisabled}>
                    <CheckCircle className="mr-2 h-5 w-5" /> Finalize & Mint Asset
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
