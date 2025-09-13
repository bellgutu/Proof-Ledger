"use client";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, XCircle } from 'lucide-react';

export function DebugWallet() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  const statusIndicator = isConnected 
    ? <span className="flex items-center text-green-400"><CheckCircle className="mr-2"/>Connected</span> 
    : <span className="flex items-center text-muted-foreground"><XCircle className="mr-2"/>Disconnected</span>;

  return (
    <Accordion type="single" collapsible className="w-full my-4 border rounded-lg bg-card/50 px-4">
        <AccordionItem value="item-1">
            <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4">
                     <h2 className="text-lg font-bold">Wallet Connection Panel</h2>
                     {statusIndicator}
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-1 text-sm pt-4">
                    <p>Status: <span className="font-semibold">{status}</span></p>
                    {address && <p>Address: <span className="font-mono text-xs">{address}</span></p>}
                    {error && <p className="text-red-500">Error: {error.message}</p>}
                </div>
                
                <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium">Connectors:</h3>
                    {connectors.map((connector) => (
                    <Button
                        key={connector.uid}
                        onClick={() => connect({ connector })}
                        variant="outline"
                        className="block w-full"
                        disabled={isConnected}
                    >
                        {`Connect with ${connector.name}`}
                    </Button>
                    ))}
                    
                    {isConnected && (
                    <Button onClick={() => disconnect()} variant="destructive" className="w-full mt-2">
                        Disconnect
                    </Button>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
  );
}
