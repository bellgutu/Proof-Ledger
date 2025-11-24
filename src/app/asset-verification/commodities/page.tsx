
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, Wheat, Thermometer, Droplets, FlaskConical, CheckCircle, Ship, GitMerge, GitPullRequest, Beaker, Unplug, Coffee, Wind, HardHat, LandPlot, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CommodityType = 'wheat' | 'coffee' | 'oil' | 'steel' | '';

interface SensorData {
    humidity?: number;
    grainTemp?: number;
    co2Level?: number;
    dewPoint?: number;
    ambientTemp?: number;
    tankLevel?: number;
    pressure?: number;
}


const batches = [
  { id: 'BATCH-001A', weight: '5.0 MT', parent: 'BATCH-001' },
  { id: 'BATCH-001B', weight: '15.0 MT', parent: 'BATCH-001' },
];

const WheatForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="protein">Protein Content (%)</Label><Input id="protein" type="number" placeholder="e.g., 12.8" required /></div>
        <div className="space-y-2"><Label htmlFor="testWeight">Test Weight (lb/bu)</Label><Input id="testWeight" type="number" placeholder="e.g., 60.5" /></div>
        <div className="space-y-2"><Label htmlFor="moisture">Moisture (%)</Label><Input id="moisture" type="number" placeholder="e.g., 11.5" required /></div>
        <div className="space-y-2"><Label htmlFor="harvestDate">Expiration/Harvest Date</Label><Input id="harvestDate" type="date" required /></div>
    </div>
);

const CoffeeForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="defectCount">Bean Defect Count</Label><Input id="defectCount" type="number" placeholder="e.g., 5" required /></div>
        <div className="space-y-2">
            <Label htmlFor="screenSize">Screen Size</Label>
            <Select><SelectTrigger id="screenSize"><SelectValue placeholder="Select screen size..."/></SelectTrigger><SelectContent><SelectItem value="18">18</SelectItem><SelectItem value="17">17</SelectItem><SelectItem value="16">16</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-2"><Label htmlFor="caffeine">Caffeine Content (%)</Label><Input id="caffeine" type="number" placeholder="e.g., 1.2" /></div>
        <div className="space-y-2"><Label htmlFor="harvestDate">Expiration/Harvest Date</Label><Input id="harvestDate" type="date" required /></div>
    </div>
);

const OilForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="apiGravity">API Gravity (°API)</Label><Input id="apiGravity" type="number" placeholder="e.g., 42.5" required /></div>
        <div className="space-y-2"><Label htmlFor="sulfur">Sulfur Content (%)</Label><Input id="sulfur" type="number" placeholder="e.g., 0.2" required /></div>
        <div className="space-y-2"><Label htmlFor="viscosity">Viscosity (cSt)</Label><Input id="viscosity" type="number" placeholder="e.g., 5.3" /></div>
        <div className="space-y-2"><Label htmlFor="batchDate">Batch Creation Date</Label><Input id="batchDate" type="date" required /></div>
    </div>
);

const SteelForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label htmlFor="yieldStrength">Yield Strength (MPa)</Label><Input id="yieldStrength" type="number" placeholder="e.g., 345" required /></div>
        <div className="space-y-2"><Label htmlFor="coilWidth">Coil Width (mm)</Label><Input id="coilWidth" type="number" placeholder="e.g., 1500" /></div>
        <div className="space-y-2"><Label htmlFor="millCertHash">Mill Certification Hash</Label><Input id="millCertHash" placeholder="0x..." required /></div>
        <div className="space-y-2"><Label htmlFor="productionDate">Production Date</Label><Input id="productionDate" type="date" required /></div>
    </div>
);

const renderQCForm = (type: CommodityType) => {
    switch (type) {
        case 'wheat': return <WheatForm />;
        case 'coffee': return <CoffeeForm />;
        case 'oil': return <OilForm />;
        case 'steel': return <SteelForm />;
        default: return <p className="text-sm text-muted-foreground p-4 text-center">Please select a commodity type to see its specific quality control fields.</p>;
    }
};

const SensorDisplay = ({ icon: Icon, value, unit, label }: { icon: React.ElementType, value?: number, unit: string, label: string }) => (
    <div className="bg-secondary/50 p-4 rounded-lg">
        <Icon className="mx-auto h-6 w-6 text-primary mb-2" />
        {value !== undefined ? (
            <p className="text-lg font-bold">{value}{unit}</p>
        ) : (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);


const renderSensorData = (type: CommodityType, data?: SensorData) => {
    switch (type) {
        case 'wheat': return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <SensorDisplay icon={Droplets} value={data?.humidity} unit="%" label="Humidity" />
            <SensorDisplay icon={Thermometer} value={data?.grainTemp} unit="°C" label="Grain Temp." />
            <SensorDisplay icon={Wind} value={data?.co2Level} unit="ppm" label="CO2 Level" />
        </div>;
        case 'coffee': return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <SensorDisplay icon={Droplets} value={data?.humidity} unit="%" label="Humidity" />
            <SensorDisplay icon={LandPlot} value={data?.dewPoint} unit="°C" label="Dew Point" />
            <SensorDisplay icon={Thermometer} value={data?.ambientTemp} unit="°C" label="Ambient" />
        </div>;
        case 'oil': return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <SensorDisplay icon={Beaker} value={data?.tankLevel} unit="%" label="Tank Level" />
            <SensorDisplay icon={Unplug} value={data?.pressure} unit=" psi" label="Pressure" />
        </div>;
        case 'steel': return <p className="text-sm text-muted-foreground p-4 text-center">Sensor data not typically required for this commodity type during transit.</p>;
        default: return <p className="text-sm text-muted-foreground p-4 text-center">Select commodity to view relevant sensor data.</p>;
    }
};

const getCoAFields = (type: CommodityType) => {
    switch (type) {
        case 'wheat': return "Protein Content, Test Weight, Moisture...";
        case 'coffee': return "Defect Count, Screen Size, Caffeine...";
        case 'oil': return "API Gravity, Sulfur Content, Viscosity...";
        case 'steel': return "Yield Strength, Coil Width, Mill Certification...";
        default: return "Awaiting document upload...";
    }
}

const getIcon = (type: CommodityType) => {
  switch(type) {
    case 'wheat': return <Wheat className="h-12 w-12 text-primary" />;
    case 'coffee': return <Coffee className="h-12 w-12 text-primary" />;
    case 'oil': return <Beaker className="h-12 w-12 text-primary" />;
    case 'steel': return <HardHat className="h-12 w-12 text-primary" />;
    default: return <Wheat className="h-12 w-12 text-primary" />;
  }
}

export default function CommoditiesPage() {
  const [commodityType, setCommodityType] = useState<CommodityType>('wheat');
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [sensorData, setSensorData] = useState<SensorData | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSensorData = async () => {
        if (!commodityType || commodityType === 'steel') {
            setSensorData(undefined);
            return;
        }

        setSensorData(undefined); // Reset to show loading state
        
        // Use a mock asset ID prefix based on commodity
        const assetIdPrefix = commodityType === 'coffee' ? 'LX' : 'SH';
        const mockAssetId = `${assetIdPrefix}-mock-123`;
        
        try {
            // Adding a delay to make loading state more visible
            await new Promise(resolve => setTimeout(resolve, 500));
            const response = await fetch(`/api/sensor-data/${mockAssetId}`);
            if (!response.ok) throw new Error("Failed to fetch sensor data");
            const data = await response.json();
            
            // Map API response to our SensorData interface
            setSensorData({
                humidity: data.humidity,
                grainTemp: data.temperature,
                co2Level: data.co2Level,
                dewPoint: data.dew_point,
                ambientTemp: data.ambient_temp,
                tankLevel: data.tank_level,
                pressure: data.pressure,
            });

        } catch (error) {
            console.error(error);
            toast({
                title: "Sensor Data Error",
                description: "Could not load live sensor data.",
                variant: "destructive"
            })
        }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [commodityType, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoaFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} is ready for processing.`
      });
    }
  };

  const isMintingDisabled = useMemo(() => {
    return !commodityType || !coaFile;
  }, [commodityType, coaFile]);


  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <div className="flex items-center gap-4">
            {getIcon(commodityType)}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Commodity & Agri Asset Verification
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                Track fungible goods in bulk, focusing on batch quality and supply chain conditions.
                </p>
            </div>
        </div>
      </div>
      
       <Card>
        <CardHeader>
            <CardTitle>Initial Classification</CardTitle>
            <CardDescription>Select the type of commodity you are verifying to customize the workflow.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="w-full md:w-1/2">
                <Label htmlFor="commodityType">Commodity Type</Label>
                 <Select onValueChange={(value: CommodityType) => setCommodityType(value)} defaultValue="wheat">
                    <SelectTrigger id="commodityType">
                        <SelectValue placeholder="Select commodity type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="wheat">Wheat (Hard Red)</SelectItem>
                        <SelectItem value="coffee">Arabica Green Coffee</SelectItem>
                        <SelectItem value="oil">Crude Oil (WTI)</SelectItem>
                        <SelectItem value="steel">Steel Coil (HR)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>A. Batch & Quality Control</CardTitle>
              <CardDescription>Define the initial properties of the commodity batch. Note: Minting requires the connected wallet to have the 'VERIFIER' role.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderQCForm(commodityType)}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>C. Certificate of Analysis (CoA)</CardTitle>
              <CardDescription>Upload lab results for automated data extraction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="relative w-full">
                <Button variant="outline" className="w-full h-12 text-base" asChild>
                    <label htmlFor="coa-upload" className="cursor-pointer">
                       <FileUp className="mr-2 h-5 w-5" /> 
                       {coaFile ? <span className="truncate">{coaFile.name}</span> : "Upload CoA PDF"}
                    </label>
                </Button>
                <Input id="coa-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
               </div>
               <div className="p-4 rounded-lg bg-secondary/50 text-sm space-y-2">
                   <p className="text-muted-foreground">AI Extractor Status: <span className="text-foreground font-medium">{coaFile ? "Processing..." : "Ready"}</span></p>
                   <p className="font-mono text-xs">{coaFile ? `Extracting data from ${coaFile.name}` : `Awaiting document... will extract ${getCoAFields(commodityType)}`}</p>
               </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>D. Shipping Container Binding</CardTitle>
              <CardDescription>Associate this batch with its transport containers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter Container/Vessel ID..." className="h-11" />
                <Button size="lg">Add</Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                  <Ship className="h-4 w-4 text-primary" />
                  <span>CMA-CGM-123456-7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>B. Bulk Sensor Data Logging</CardTitle>
              <CardDescription>Define and monitor critical environmental thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {renderSensorData(commodityType, sensorData)}
                <div className="space-y-2 text-left pt-4">
                    <Label htmlFor="tempThreshold">Critical Threshold Logic</Label>
                    <Input id="tempThreshold" readOnly value={ commodityType === 'wheat' ? 'Moisture > 13.5% AND Temp > 25°C' : commodityType ? 'Logic specific to commodity' : 'Select commodity to see logic' } className="text-xs font-mono"/>
                </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
              <CardTitle>Fungibility Management</CardTitle>
              <CardDescription>Split or merge batches while maintaining provenance. Merging recalculates QC Grade as a weighted average.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Input readOnly defaultValue="BATCH-001" />
                    <Button variant="outline"><GitMerge className="h-4 w-4 mr-2" /> Merge</Button>
                    <Button variant="outline"><GitPullRequest className="h-4 w-4 mr-2" /> Split</Button>
                </div>
                <Table>
                    <TableHeader><TableRow><TableHead>New Batch ID</TableHead><TableHead>Weight</TableHead><TableHead>Parent</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {batches.map(b => (
                            <TableRow key={b.id}>
                                <TableCell className="font-mono text-xs">{b.id}</TableCell>
                                <TableCell>{b.weight}</TableCell>
                                <TableCell className="font-mono text-xs">{b.parent}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="w-full">
                            <Button className="w-full h-12 text-base" disabled={isMintingDisabled}>
                                <CheckCircle className="mr-2 h-5 w-5" /> Finalize & Mint Batch Assets
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Minting is restricted to addresses with the 'VERIFIER' role.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
