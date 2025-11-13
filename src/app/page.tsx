
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, ShieldCheck, Ship, GanttChartSquare } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const modules = [
    {
      href: "/shipping",
      icon: Ship,
      title: "Shipping & Logistics",
      description: "Verify FOB, CIF, and track shipments in real-time with integrated IoT and customs data.",
    },
    {
      href: "/insurance",
      icon: ShieldCheck,
      title: "Insurance & Finance",
      description: "Automate cargo, title, and luxury goods insurance validation. Process claims and financing.",
    },
    {
      href: "/quality",
      icon: HardHat,
      title: "Quality Control",
      description: "Validate agricultural, gemstone, and real estate quality with certification and inspection data.",
    },
     {
      href: "/compliance",
      icon: GanttChartSquare,
      title: "Compliance & Regulatory",
      description: "Centralized verification for KYC, AML, and other industry-specific regulatory requirements.",
    },
  ];

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-center space-y-2 mt-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Enterprise Verification Platform
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          A closed-loop system for end-to-end verification of shipping, insurance, and quality control. This platform is designed to reduce costs, mitigate risks, and increase efficiency for businesses that deal with physical assets and complex supply chains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {modules.map((module) => (
          <Link href={module.href} key={module.href} className="block hover:scale-[1.02] transition-transform duration-200">
            <Card className="h-full w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <module.icon className="h-6 w-6 text-accent" />
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
