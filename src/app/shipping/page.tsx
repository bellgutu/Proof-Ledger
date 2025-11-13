
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MapPin, Anchor } from "lucide-react";

export default function ShippingPage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Shipping & Logistics Verification
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          This module provides immutable, on-chain verification for every stage of the shipping process. From the port of origin to the final destination, each step is tracked and verified to ensure transparency and accountability.
        </p>
      </div>

       <Tabs defaultValue="fob" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
          <TabsTrigger value="fob" className="py-3 text-base">
            <Anchor className="mr-2 h-5 w-5" /> FOB Verification
          </TabsTrigger>
          <TabsTrigger value="cif" className="py-3 text-base">
            <FileText className="mr-2 h-5 w-5" /> CIF Verification
          </TabsTrigger>
          <TabsTrigger value="tracking" className="py-3 text-base">
            <MapPin className="mr-2 h-5 w-5" /> Real-time Tracking
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fob">
          <Card>
            <CardHeader>
              <CardTitle>Free On Board (FOB) Verification</CardTitle>
              <CardDescription>
                Verifies that goods have been successfully transferred at the port of origin, confirming bill of lading, export documentation, and customs status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">FOB verification dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cif">
          <Card>
            <CardHeader>
              <CardTitle>Cost, Insurance, and Freight (CIF) Verification</CardTitle>
              <CardDescription>
                Verifies the successful delivery of goods to the destination port, including validation of shipping insurance, freight costs, and import clearance.
              </CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">CIF verification dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Shipment Tracking</CardTitle>
              <CardDescription>
                Integrates with IoT sensors and GPS to provide live tracking of container location, temperature, humidity, and tamper detection.
              </CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg border">
                <p className="text-center text-muted-foreground">Real-time tracking dashboard coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
