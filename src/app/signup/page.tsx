
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ConnectButton } from "@/components/connect-button";
import { Wallet, KeyRound, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="container mx-auto p-0 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Wallet size={32} />
            </div>
          <CardTitle className="text-3xl">Create Your Account</CardTitle>
          <CardDescription>
            Proof Ledger uses a secure digital wallet for authentication. Your wallet is your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-4">
                    <KeyRound className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-foreground">Self-Custody</h4>
                        <p>You own your keys, you own your assets. Proof Ledger never has access to your funds or private information.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <ShieldCheck className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-foreground">Secure & Decentralized</h4>
                        <p>By using a wallet, you benefit from the highest level of security provided by the Ethereum blockchain.</p>
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <ConnectButton />
          <p className="text-xs text-muted-foreground text-center">
            Don't have a wallet? The "Connect Wallet" button will help you create one.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
