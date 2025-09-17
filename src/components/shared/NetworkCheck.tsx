
"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useSwitchChain } from 'wagmi';

export default function NetworkCheck() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window.ethereum === 'undefined' || !chain) {
      return;
    }

    const isCorrectNetwork = chain.id === 11155111; // Sepolia chain ID

    if (!isCorrectNetwork) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Sepolia network to use this dApp.",
        duration: Infinity,
      });
    }

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [chain, toast]);

  if (chain && chain.id !== 11155111) {
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
