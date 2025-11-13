
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Database, Gem, Home, Sprout, UploadCloud } from 'lucide-react';

const RealEstateForm = () => {
    const { toast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Oracle Data Submitted",
            description: "Real estate ground truth data has been fed to the oracle.",
        });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="propId">Property ID (APN)</Label>
                <Input id="propId" placeholder="e.g., 012-345-678" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="titleDeed">Title Deed Document (JSON)</Label>
                <Textarea id="titleDeed" placeholder='{ "owner": "John Doe", "history": [...] }' />
            </div>
            <div className="space-y-2">
                <Label htmlFor="appraisalData">Appraisal Data (JSON)</Label>
                <Textarea id="appraisalData" placeholder='{ "value": 1200000, "date": "2024-05-20" }' />
            </div>
            <Button type="submit" className="w-full">
                <UploadCloud className="mr-2 h-4 w-4" />
                Submit to Oracle
            </Button>
        </form>
    );
};

const CommoditiesForm = () => {
    const { toast } = useToast();
     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Oracle Data Submitted",
            description: "Commodities ground truth data has been fed to the oracle.",
        });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="shipId">Shipment ID (Bill of Lading)</Label>
                <Input id="shipId" placeholder="e.g., MSKU1234567" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="qualityCert">Quality Certificate (JSON)</Label>
                <Textarea id="qualityCert" placeholder='{ "grade": "Arabica Grade 1", "origin": "Colombia" }' />
            </div>
            <div className="space-y-2">
                <Label htmlFor="custodyChain">Chain of Custody (JSON)</Label>
                <Textarea id="custodyChain" placeholder='[{"handler": "Farm A", "timestamp": "..."},{...}]' />
            </div>
            <Button type="submit" className="w-full">
                 <UploadCloud className="mr-2 h-4 w-4" />
                Submit to Oracle
            </Button>
        </form>
    );
};

const LuxuryGoodsForm = () => {
    const { toast } = useToast();
     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Oracle Data Submitted",
            description: "Luxury goods ground truth data has been fed to the oracle.",
        });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="assetId">Asset ID (Serial/Cert #)</Label>
                <Input id="assetId" placeholder="e.g., GIA22078..." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="certData">Certification Data (JSON)</Label>
                <Textarea id="certData" placeholder='{ "certProvider": "GIA", "reportNumber": "22078..." }' />
            </div>
            <div className="space-y-2">
                <Label htmlFor="provenanceData">Provenance Data (JSON)</Label>
                <Textarea id="provenanceData" placeholder='[{"owner": "Royalty", "year": 1920}, {...}]' />
            </div>
            <Button type="submit" className="w-full">
                 <UploadCloud className="mr-2 h-4 w-4" />
                Submit to Oracle
            </Button>
        </form>
    );
};

export default function OracleDataPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Database className="h-8 w-8 text-primary" />
                    Oracle Data Feeds
                </h1>
                <p className="text-muted-foreground">Submit ground truth data to the trust oracle for verification.</p>
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Submit Verification Data</CardTitle>
                    <CardDescription>Select the asset class and provide the authoritative data. This simulates feeding the oracle its source of truth.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="real_estate">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="real_estate"><Home className="mr-2 h-4 w-4" />Real Estate</TabsTrigger>
                            <TabsTrigger value="commodities"><Sprout className="mr-2 h-4 w-4" />Commodities</TabsTrigger>
                            <TabsTrigger value="luxury_goods"><Gem className="mr-2 h-4 w-4" />Luxury Goods</TabsTrigger>
                        </TabsList>
                        <TabsContent value="real_estate" className="pt-6">
                            <RealEstateForm />
                        </TabsContent>
                        <TabsContent value="commodities" className="pt-6">
                            <CommoditiesForm />
                        </TabsContent>
                        <TabsContent value="luxury_goods" className="pt-6">
                            <LuxuryGoodsForm />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
