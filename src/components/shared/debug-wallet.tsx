"use client";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';

export function DebugWallet() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="p-4 my-4 border rounded-lg bg-card/50">
      <h2 className="text-lg font-bold mb-2">Wallet Debug Panel</h2>
      <div className="space-y-1 text-sm">
        <p>Status: <span className="font-semibold">{status}</span></p>
        <p>Connected: <span className="font-semibold">{isConnected ? 'Yes' : 'No'}</span></p>
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
    </div>
  );
}
