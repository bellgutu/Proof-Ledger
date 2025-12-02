
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Library, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useWallet } from "@/components/wallet-provider";

export default function MyAssetsPage() {
    const { myAssets, isConnected } = useWallet();

    const getStatusClass = (status: string) => {
        switch(status) {
            case "Verified": return "bg-green-600/20 text-green-300 border-green-500/30";
            case "In-Transit": return "bg-blue-600/20 text-blue-300 border-blue-500/30";
            case "Re-verification Required": return "bg-yellow-600/20 text-yellow-300 border-yellow-500/30";
            default: return "";
        }
    }

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          My Assets
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          A unified dashboard to track the status, provenance, and insurance of your verified digital twins.
        </p>
      </div>

      {isConnected && myAssets.length === 0 && (
         <Card className="bg-secondary/70 border-dashed">
            <CardHeader className="flex flex-row items-center gap-4">
                <Info className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Your Portfolio is Empty</CardTitle>
                    <CardDescription>Mint a new digital twin from the Asset Verification Hub to see it here.</CardDescription>
                </div>
            </CardHeader>
            <CardFooter>
                 <Link href="/asset-verification" passHref>
                    <Button>
                        Go to Verification Hub <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
         </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myAssets.map((asset) => (
          <Card key={asset.tokenId} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <CardTitle>{asset.name}</CardTitle>
                    <CardDescription>{asset.assetType} - Token ID: {asset.tokenId}</CardDescription>
                </div>
                {asset.icon}
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <div className="text-sm">
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={cn("mt-1", getStatusClass(asset.status))}>{asset.status}</Badge>
                </div>
                 <div className="text-sm">
                    <p className="text-muted-foreground">Custodian</p>
                    <p className="font-medium">{asset.custody.current}</p>
                </div>
                 <div className="text-sm">
                    <p className="text-muted-foreground">Last Known Location</p>
                    <p className="font-medium">{asset.custody.location}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Link href={`/my-assets/${asset.tokenId}`} passHref className="w-full">
                    <Button className="w-full">
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

       {!isConnected && (
            <div className="text-center py-16">
                <Library className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-md font-medium text-muted-foreground">Connect your wallet to view your asset portfolio.</p>
            </div>
       )}
    </div>
  );
}
