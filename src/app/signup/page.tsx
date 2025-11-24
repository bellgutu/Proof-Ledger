
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, KeyRound, ShieldCheck, ArrowRight, UserCheck, DatabaseZap } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export default function SignUpPage() {
  const roles = [
    {
      title: "Become an Oracle Provider",
      description: "Provide trusted data attestations for real-world assets. Stake ETH, perform verifications, and earn rewards for maintaining the integrity of the ledger.",
      icon: <DatabaseZap size={32} />,
      href: "/oracle-providers",
      buttonText: "Go to Oracle Console"
    },
    {
      title: "Become an Asset Verifier",
      description: "Mint and manage the lifecycle of digital twins. This role requires the 'VERIFIER' permission granted by the platform administrator to your wallet address.",
      icon: <UserCheck size={32} />,
      href: "/asset-verification",
      buttonText: "Go to Verification Hub"
    },
  ];

  return (
    <div className="container mx-auto p-0 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-8">
       <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary">Welcome to Proof Ledger</h1>
            <p className="text-lg text-muted-foreground mt-2">Choose your role to get started.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {roles.map(role => (
          <Card key={role.title} className="flex flex-col">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    {role.icon}
                </div>
              <CardTitle className="text-2xl">{role.title}</CardTitle>
              <CardDescription className="px-4">
                {role.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter>
              <Link href={role.href} passHref className="w-full">
                <Button className="w-full h-11 text-base">
                  {role.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
       </div>

       <div className="text-center space-y-2 !mt-12">
            <p className="text-muted-foreground">First, connect your secure digital wallet.</p>
            <ConnectButton />
       </div>
    </div>
  );
}
