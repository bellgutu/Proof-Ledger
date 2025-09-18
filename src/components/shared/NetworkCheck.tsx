
"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useSwitchChain } from 'wagmi';

export default function NetworkCheck() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    if (chain) {
      const correctNetwork = chain.id === 11155111; // Sepolia chain ID
      setIsWrongNetwork(!correctNetwork);

      if (!correctNetwork) {
        toast({
          variant: "destructive",
          title: "Wrong Network",
          description: "Please switch to the Sepolia network to use this dApp.",
          duration: Infinity,
        });
      }
    } else {
      setIsWrongNetwork(false);
    }
  }, [chain, toast]);

  if (isWrongNetwork) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm z-50">
        You are on the wrong network. Please switch to Sepolia in your wallet.
        <button
          onClick={() => switchChain?.({ chainId: 11155111 })}
          className="ml-4 underline font-bold"
        >
          Switch Network
        </button>
      </div>
    );
  }

  return null;
}
