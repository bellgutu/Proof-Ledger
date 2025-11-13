
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FileUp, Diamond, ShieldAlert, History, CheckCircle, ScanLine, Car, Watch, ShoppingBag, Shirt } from "lucide-react";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from "next/image";
import imageData from '@/lib/placeholder-images.json';

type AssetType = 'gemstone' | 'luxury_item';
type LuxurySubType = 'watch' | 'bag' | 'automobile' | 'garment' | '';

const GemstoneForm = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2">
      <Label htmlFor="certId">GIA / Certification ID</Label>
      <Input id="certId" placeholder="e.g., GIA-12345678" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="origin">Origin Mine / Manufacturer</Label>
      <Input id="origin" placeholder="e.g., De Beers Group" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="weight">Weight / Carat</Label>
      <Input id="weight" placeholder="e.g., 1.02" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="grading">4C Grading</Label>
      <Input id="grading" placeholder="e.g., VVS1, D Color" />
    </div>
    <div className="md:col-span-2">
        <Badge variant="secondary" className="w-fit">
            <ScanLine className="h-4 w-4 mr-2"/>
            Cross-Reference Oracle: Ready to verify against GIA database...
        </Badge>
    </div>
  </div>
);

const WatchForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="watch-manufacturer">Manufacturer</Label><Input id="watch-manufacturer" placeholder="e.g., Rolex" /></div>
        <div className="space-y-2"><Label htmlFor="watch-model">Model No.</Label><Input id="watch-model" placeholder="e.g., 126610LV" /></div>
        <div className="space-y-2"><Label htmlFor="watch-serial">Serial No.</Label><Input id="watch-serial" placeholder="e.g., YZ123456" /></div>
        <div className="space-y-2"><Label htmlFor="watch-movement">Movement Caliber</Label><Input id="watch-movement" placeholder="e.g., Cal. 3235" /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="watch-service-hash">Service History Hash</Label><Input id="watch-service-hash" placeholder="Hash of service records..." /></div>
        <div className="md:col-span-2"><Badge variant="secondary" className="w-fit"><ScanLine className="h-4 w-4 mr-2"/>OEM/Manufacturer Database Oracle: Ready</Badge></div>
    </div>
);

const BagForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="bag-brand">Brand</Label><Input id="bag-brand" placeholder="e.g., Hermès" /></div>
        <div className="space-y-2"><Label htmlFor="bag-model">Model Name</Label><Input id="bag-model" placeholder="e.g., Birkin 30" /></div>
        <div className="space-y-2"><Label htmlFor="bag-sku">SKU/Item No.</Label><Input id="bag-sku" placeholder="e.g., H076262CK89" /></div>
        <div className="space-y-2"><Label htmlFor="bag-date-code">Date Code/Blind Stamp</Label><Input id="bag-date-code" placeholder="e.g., Z" /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="bag-material-hash">Material Certification Hash</Label><Input id="bag-material-hash" placeholder="Hash of material certs..." /></div>
        <div className="md:col-span-2"><Badge variant="secondary" className="w-fit"><ScanLine className="h-4 w-4 mr-2"/>3rd-Party Authentication Oracle (Entrupy): Ready</Badge></div>
    </div>
);

const AutomobileForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="auto-vin">VIN (Vehicle Identification Number)</Label><Input id="auto-vin" placeholder="17-character VIN" /></div>
        <div className="space-y-2"><Label htmlFor="auto-engine">Engine/Chassis No.</Label><Input id="auto-engine" placeholder="Engine serial number" /></div>
        <div className="space-y-2"><Label htmlFor="auto-year">Year</Label><Input id="auto-year" type="number" placeholder="e.g., 2023" /></div>
        <div className="space-y-2"><Label htmlFor="auto-mileage">Mileage</Label><Input id="auto-mileage" type="number" placeholder="e.g., 5,400" /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="auto-title-hash">Title Hash</Label><Input id="auto-title-hash" placeholder="Hash of the official vehicle title..." /></div>
        <div className="md:col-span-2"><Badge variant="secondary" className="w-fit"><ScanLine className="h-4 w-4 mr-2"/>DMV & Insurance Oracle: Ready to verify VIN & history</Badge></div>
    </div>
);

const GarmentForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="garment-designer">Designer/Label</Label><Input id="garment-designer" placeholder="e.g., Chanel" /></div>
        <div className="space-y-2"><Label htmlFor="garment-collection">Collection/Season</Label><Input id="garment-collection" placeholder="e.g., Spring/Summer 2023" /></div>
        <div className="space-y-2"><Label htmlFor="garment-style">Style No.</Label><Input id="garment-style" placeholder="e.g., 23S-P12345V67890" /></div>
        <div className="space-y-2"><Label htmlFor="garment-size">Size</Label><Input id="garment-size" placeholder="e.g., 38" /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="garment-material-hash">Material Composition Hash</Label><Input id="garment-material-hash" placeholder="Hash of fabric composition report..." /></div>
        <div className="md:col-span-2"><Badge variant="secondary" className="w-fit"><ScanLine className="h-4 w-4 mr-2"/>Retail/Designer Oracle: Ready</Badge></div>
    </div>
);


const renderProvenanceForm = (asset: AssetType, subType: LuxurySubType) => {
    if (asset === 'gemstone') return <GemstoneForm />;
    if (asset === 'luxury_item') {
        switch (subType) {
            case 'watch': return <WatchForm />;
            case 'bag': return <BagForm />;
            case 'automobile': return <AutomobileForm />;
            case 'garment': return <GarmentForm />;
            default: return <p className="text-sm text-muted-foreground p-4 text-center">Please select a luxury item type to see its specific verification fields.</p>;
        }
    }
    return null;
}

const renderVisualsContent = (asset: AssetType, subType: LuxurySubType) => {
    let title = "High-Resolution Visuals";
    let description = "Upload mandatory 360-degree photos for visual hashing.";
    let buttonText = "Upload 360° Photo/Video Set";
    let extraField = null;
    
    let imageKey: keyof typeof imageData.luxury_goods = 'gemstone';
    if (asset === 'gemstone') {
        imageKey = 'gemstone';
        extraField = <div className="w-full max-w-xs space-y-2"><Label htmlFor="inclusion-map">Microscopic Inclusions Map Hash (Optional)</Label><Input id="inclusion-map" placeholder="Hash of spectral analysis data..."/></div>
    } else if (asset === 'luxury_item' && subType) {
        imageKey = subType;
        switch (subType) {
            case 'automobile':
                description = "Upload required photos: 4 exterior sides, interior, and engine bay.";
                buttonText = "Upload Damage Assessment Photos";
                break;
            case 'watch':
                description = "Upload focused images of the movement, caseback, and dial for visual hashing.";
                buttonText = "Upload Watch Detail Photos";
                break;
        }
    }

    const images = imageData.luxury_goods[imageKey] || imageData.luxury_goods.gemstone;


    return (
        <>
            <CardHeader>
                <CardTitle>B. {title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Carousel className="w-full max-w-xs">
                <CarouselContent>
                  {images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex aspect-square items-center justify-center p-0 rounded-lg overflow-hidden">
                             <Image 
                                src={image.src} 
                                width={400} 
                                height={400} 
                                alt={image.alt}
                                data-ai-hint={image.hint}
                             />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              {extraField}
              <Button variant="outline" className="w-full max-w-xs h-12 text-base">
                <FileUp className="mr-2 h-5 w-5" /> {buttonText}
              </Button>
            </CardContent>
        </>
    )
}

const renderSecurityContent = (asset: AssetType, subType: LuxurySubType) => {
    let sensorType = "Security Sensor Data";
    let sensorDesc = "Live feed from the asset's security packaging.";
    let trustScore = "100%";
    let trustColor = "text-green-400";
    let log = <p className="font-mono">✅ Tamper Log Initialized</p>;

    if (asset === 'luxury_item') {
        switch (subType) {
            case 'automobile':
                sensorType = "GPS & OBD-II Port Monitoring";
                sensorDesc = "Live feed of location and vehicle diagnostics.";
                log = <p className="font-mono">✅ GPS & OBD-II Feed Active</p>;
                break;
            case 'garment':
                sensorType = "Passive RFID/NFC Tag";
                sensorDesc = "Monitors presence within a secure storage facility.";
                log = <p className="font-mono">✅ RFID Tag Active</p>;
                break;
        }
    }
    
    return (
        <>
            <CardHeader>
              <CardTitle>C. {sensorType}</CardTitle>
              <CardDescription>{sensorDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <ShieldAlert className="mx-auto h-8 w-8 text-green-400 mb-2" />
                <p className="text-lg font-bold text-green-400">Secure</p>
                <p className="text-sm text-muted-foreground">No critical events detected.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Trust Score</h4>
                <p className={`text-3xl font-bold ${trustColor}`}>{trustScore}</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {log}
                <p className="font-mono">✅ Light Sensor Active</p>
              </div>
            </CardContent>
        </>
    );
};


const renderReVerificationContent = (asset: AssetType, subType: LuxurySubType) => {
    let yearsToAdd = 5; // Default for Gemstones
     if (asset === 'luxury_item') {
        switch (subType) {
            case 'automobile': yearsToAdd = 7; break;
            case 'bag':
            case 'garment': yearsToAdd = 3; break;
        }
    }
    const nextVerificationDate = new Date(new Date().setFullYear(new Date().getFullYear() + yearsToAdd)).toLocaleDateString();

    return (
        <>
            <CardHeader>
              <CardTitle>D. Re-Verification Schedule</CardTitle>
              <CardDescription>Manage the asset's verification lifecycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Last Verified Date</Label>
                <Input type="text" readOnly value={new Date().toLocaleDateString()} />
              </div>
              <div className="space-y-2">
                <Label>Next Required Re-Verification</Label>
                <Input type="text" readOnly value={nextVerificationDate} />
              </div>
              <Button variant="secondary" className="w-full">
                <History className="mr-2 h-4 w-4" /> View Full Provenance
              </Button>
            </CardContent>
             <CardFooter>
                 <Button className="w-full h-12 text-base">
                    <CheckCircle className="mr-2 h-5 w-5" /> Finalize & Mint Asset
                </Button>
            </CardFooter>
        </>
    );
};

const getPageIcon = (asset: AssetType, subType: LuxurySubType) => {
  if (asset === 'gemstone') return <Diamond className="h-12 w-12 text-primary" />;
  if (asset === 'luxury_item') {
    switch (subType) {
      case 'watch': return <Watch className="h-12 w-12 text-primary" />;
      case 'bag': return <ShoppingBag className="h-12 w-12 text-primary" />;
      case 'automobile': return <Car className="h-12 w-12 text-primary" />;
      case 'garment': return <Shirt className="h-12 w-12 text-primary" />;
    }
  }
  return <Diamond className="h-12 w-12 text-primary" />;
}

export default function LuxuryGoodsPage() {
  const [assetType, setAssetType] = useState<AssetType>('gemstone');
  const [luxurySubType, setLuxurySubType] = useState<LuxurySubType>('');

  const handleAssetTypeChange = (value: AssetType) => {
    setAssetType(value);
    setLuxurySubType(''); // Reset sub-type when main type changes
  };

  return (
    <div className="container mx-auto p-0 space-y-8">
       <div className="text-left space-y-2">
        <div className="flex items-center gap-4">
            {getPageIcon(assetType, luxurySubType)}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Luxury & High-Value Asset Verification
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                Prove the provenance, authenticity, and grading of high-value, portable assets.
                </p>
            </div>
        </div>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Initial Classification</CardTitle>
            <CardDescription>Select the type of asset you are verifying to customize the workflow.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <RadioGroup defaultValue="gemstone" onValueChange={handleAssetTypeChange} className="space-y-2">
                <Label>1. Select Certification Type</Label>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gemstone" id="r-gem" />
                    <Label htmlFor="r-gem">Gemstone (Diamond, Ruby, etc.)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="luxury_item" id="r-lux" />
                    <Label htmlFor="r-lux">Luxury Item (Watch, Bag, Car, etc.)</Label>
                </div>
            </RadioGroup>
            {assetType === 'luxury_item' && (
                 <div className="space-y-2">
                    <Label>2. Select Luxury Sub-Type</Label>
                    <Select onValueChange={(value: LuxurySubType) => setLuxurySubType(value)} value={luxurySubType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select sub-type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="watch">Watch</SelectItem>
                            <SelectItem value="bag">Bag / Leather Good</SelectItem>
                            <SelectItem value="automobile">Automobile (Luxury Car)</SelectItem>
                            <SelectItem value="garment">Garment (Haute Couture)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            )}
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>A. Authenticity & Provenance</CardTitle>
              <CardDescription>Enter official grading and manufacturing details based on the asset type.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderProvenanceForm(assetType, luxurySubType)}
            </CardContent>
          </Card>

          <Card>
             {renderVisualsContent(assetType, luxurySubType)}
          </Card>
        </div>

        {/* Right Column: Security & Re-verification */}
        <div className="lg:col-span-1 space-y-8">
           <Card>
            {renderSecurityContent(assetType, luxurySubType)}
          </Card>
           <Card>
            {renderReVerificationContent(assetType, luxurySubType)}
          </Card>
        </div>
      </div>
    </div>
  );
}
