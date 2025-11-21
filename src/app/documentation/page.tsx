
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

// This list maps to the PDF files you should place in the /public/documents/ folder.
// To add a new document, add an object to this array and ensure the PDF file exists.
const documents = [
  {
    title: "Proof Ledger Technical Whitepaper",
    description: "The complete technical overview of the platform's architecture, smart contracts, and decentralized protocols.",
    href: "/documents/Proof Ledger_ Institutional Infrastructure for Verifiable Real-World Assets.pdf",
    icon: <FileText className="h-10 w-10 text-primary" />,
  },
  {
    title: "Security Audit Report - Q3 2024",
    description: "The full security audit and penetration test results conducted by a third-party cybersecurity firm.",
    href: "/documents/Security_Audit_Q3_2024.pdf",
    icon: <FileText className="h-10 w-10 text-primary" />,
  },
  {
    title: "API Integration Guide",
    description: "Comprehensive guide for developers on integrating with the Proof Ledger API and Oracle Network.",
    href: "/documents/API_Integration_Guide.pdf",
    icon: <FileText className="h-10 w-10 text-primary" />,
  },
];

export default function DocumentationPage() {
  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
         <div className="flex items-center gap-4">
            <FileText className="h-12 w-12 text-primary" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Document Library
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                Access official whitepapers, security audits, and integration guides for the Proof Ledger platform.
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{doc.title}</CardTitle>
                    <CardDescription className="mt-2">{doc.description}</CardDescription>
                  </div>
                  {doc.icon}
              </div>
            </CardHeader>
            <CardContent className="flex-grow"></CardContent>
            <CardFooter>
                <a href={doc.href} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button className="w-full">
                        View Document <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
