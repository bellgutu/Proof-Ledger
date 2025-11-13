
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileUp, MapPin, Building, ShieldAlert, Users, CheckCircle, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function RealEstatePage() {
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
        {/* Left Column: Forms */}
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
                  <Input id="legalId" placeholder="e.g., APN-012-345-67" />
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
                 <Image src="https://picsum.photos/seed/realestate/600/600" layout="fill" objectFit="cover" alt="Abstract image of a property" data-ai-hint="abstract property" className="opacity-70" />
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
                <Input id="appraisedValue" type="number" placeholder="e.g., 1,200,000" />
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
                    <Input id="recipient" placeholder="0x..." />
                </div>
                 <Badge>
                    <Users className="h-4 w-4 mr-2"/>
                    Recipient KYC Level: Requires Tier 3
                </Badge>
            </CardContent>
            <CardFooter>
                 <Button className="w-full h-11 text-base lg:w-auto">
                    <ArrowRight className="mr-2 h-4 w-4" /> Initiate Multi-Sig Transfer
                </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Document Uploads & Summary */}
        <div className="lg:col-span-1 space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>C. Document Uploads</CardTitle>
              <CardDescription>Upload mandatory legal documents for hashing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center justify-between">Title Deed <Badge variant="destructive">Required</Badge></Label>
                <Button variant="outline" className="w-full mt-2 h-11 text-base"><FileUp className="mr-2 h-4 w-4" /> Upload PDF/DWG</Button>
              </div>
               <div>
                <Label className="flex items-center justify-between">Appraisal Report <Badge variant="destructive">Required</Badge></Label>
                <Button variant="outline" className="w-full mt-2 h-11 text-base"><FileUp className="mr-2 h-4 w-4" /> Upload PDF</Button>
              </div>
               <div>
                <Label className="flex items-center justify-between">Survey Map <Badge variant="destructive">Required</Badge></Label>
                <Button variant="outline" className="w-full mt-2 h-11 text-base"><FileUp className="mr-2 h-4 w-4" /> Upload PDF/DWG</Button>
              </div>
            </CardContent>
             <CardFooter>
                 <Button className="w-full h-12 text-base">
                    <CheckCircle className="mr-2 h-5 w-5" /> Finalize & Mint Asset
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
