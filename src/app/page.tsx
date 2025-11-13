
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, ShieldCheck, Ship } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-center space-y-2 mt-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Enterprise Verification Platform
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          A closed-loop system for end-to-end verification of shipping, insurance, and quality control.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/verification" className="hover:scale-105 transition-transform duration-200">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Ship className="h-6 w-6" />
                Shipping & Logistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Verify FOB, CIF, and track shipments in real-time with integrated IoT and customs data.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/verification" className="hover:scale-105 transition-transform duration-200">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6" />
                Insurance & Finance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automate cargo, title, and luxury goods insurance validation. Process claims and financing against verified assets.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/verification" className="hover:scale-105 transition-transform duration-200">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <HardHat className="h-6 w-6" />
                Quality & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Validate agricultural, gemstone, and real estate quality with certification and inspection data.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
