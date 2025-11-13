
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FileUp, Diamond, ShieldAlert, History, CheckCircle, ArrowRight, ScanLine } from "lucide-react";
import Image from "next/image";

export default function LuxuryGoodsPage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
       <div className="text-left space-y-2">
        <div className="flex items-center gap-4">
            <Diamond className="h-12 w-12 text-primary" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Luxury & Gemstones Verification
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                Prove the provenance, authenticity, and grading of high-value, portable assets.
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>A. Authenticity & Provenance</CardTitle>
              <CardDescription>Enter official grading and manufacturing details.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Label htmlFor="grading">4C Grading / Serial Number</Label>
                <Input id="grading" placeholder="e.g., VVS1, D Color / SN-98765" />
              </div>
              <div className="md:col-span-2">
                <Badge variant="secondary" className="w-fit">
                    <ScanLine className="h-4 w-4 mr-2"/>
                    Cross-Reference Oracle: Ready to verify...
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>B. High-Resolution Visuals</CardTitle>
              <CardDescription>Upload mandatory 360-degree photos for visual hashing.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Carousel className="w-full max-w-xs">
                <CarouselContent>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex aspect-square items-center justify-center p-0 rounded-lg overflow-hidden">
                             <Image src={`https://picsum.photos/seed/gem${index}/400/400`} width={400} height={400} alt={`Gemstone view ${index + 1}`} />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              <Button variant="outline" className="w-full max-w-xs">
                <FileUp className="mr-2 h-4 w-4" /> Upload 360° Photo/Video Set
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security & Re-verification */}
        <div className="lg:col-span-1 space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>C. Security Sensor Data</CardTitle>
              <CardDescription>Live feed from the asset's security packaging.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <ShieldAlert className="mx-auto h-8 w-8 text-green-400 mb-2" />
                <p className="text-lg font-bold text-green-400">Secure</p>
                <p className="text-sm text-muted-foreground">No tamper events detected.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Trust Score</h4>
                <p className="text-3xl font-bold text-green-400">100%</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-mono">✅ Tamper Log Initialized</p>
                <p className="font-mono">✅ Light Sensor Active</p>
              </div>
            </CardContent>
          </Card>

           <Card>
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
                <Input type="text" readOnly value={new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString()} />
              </div>
              <Button variant="secondary" className="w-full">
                <History className="mr-2 h-4 w-4" /> View Full Provenance
              </Button>
            </CardContent>
             <CardFooter>
                 <Button className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" /> Finalize & Mint Asset
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
