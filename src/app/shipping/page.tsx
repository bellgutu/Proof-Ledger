
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, Anchor } from "lucide-react";

export default function ShippingPage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Shipping & Logistics Verification
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Immutable, on-chain verification for every stage of the shipping process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Anchor className="h-6 w-6 text-accent" />
                FOB Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Verifies that goods have been successfully transferred at the port of origin, confirming bill of lading, export documentation, and customs status.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-accent" />
                CIF Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Verifies the successful delivery of goods to the destination port, including validation of shipping insurance, freight costs, and import clearance.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-accent" />
                Real-time Shipment Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Integrates with IoT sensors and GPS to provide live tracking of container location, temperature, humidity, and tamper detection.
              </CardDescription>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
