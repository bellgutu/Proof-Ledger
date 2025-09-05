"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function NetworkCheck() {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
        // If there's no wallet, we can assume we don't need to show a network error.
        setIsCorrectNetwork(true);
        return;
    }
    
    const checkNetwork = async () => {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const correct = chainId === '0xaa36a7'; // Sepolia chain ID
        setIsCorrectNetwork(correct);
        
        if (!correct) {
          toast({
            variant: "destructive",
            title: "Wrong Network",
            description: "Please switch to Sepolia network to use this DEX.",
            duration: Infinity, // Keep the toast until dismissed or network changes
            action: {
              label: "Switch Network",
              onClick: async () => {
                try {
                  await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }],
                  });
                } catch (error: any) {
                  // This error code indicates that the chain has not been added to MetaMask.
                  if (error.code === 4902) {
                     try {
                        await window.ethereum.request({
                          method: 'wallet_addEthereumChain',
                          params: [
                            {
                              chainId: '0xaa36a7',
                              chainName: 'Sepolia',
                              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                              rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'], // A public key, replace with user's if needed
                              blockExplorerUrls: ['https://sepolia.etherscan.io'],
                            },
                          ],
                        });
                     } catch (addError) {
                        console.error("Failed to add Sepolia network", addError);
                     }
                  }
                }
              },
            },
          });
        }
      } catch (error) {
        console.error("Error checking network:", error);
      }
    };

    checkNetwork();
    
    const handleChainChanged = (chainId: string) => {
      window.location.reload();
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
    }

  }, [toast]);

  if (!isCorrectNetwork) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm z-50">
        You are on the wrong network. Please switch to Sepolia in your wallet.
      </div>
    );
  }

  return null;
}
