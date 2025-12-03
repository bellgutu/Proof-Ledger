'use client';

import { useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { ABIS, getContractAddress, ContractName } from '@/contracts';
import { useToast } from '@/hooks/use-toast';
import { Address } from 'viem';

interface EventListenerOptions {
  contractName: ContractName;
  eventName: string;
  chainId?: number;
  onEvent: (event: any) => void;
  filter?: any;
}

export function useContractEvent({
  contractName,
  eventName,
  chainId = 11155111,
  onEvent,
  filter,
}: EventListenerOptions) {
  const publicClient = usePublicClient({ chainId });
  const { toast } = useToast();

  useEffect(() => {
    if (!publicClient) return;

    const address = getContractAddress(contractName, chainId);
    if (!address) return;

    const abi = ABIS[contractName as keyof typeof ABIS];
    if (!abi) return;

    const unwatch = publicClient.watchContractEvent({
      address,
      abi,
      eventName,
      args: filter,
      onLogs: (logs) => {
        logs.forEach(log => {
          onEvent(log);
          
          // Show toast for important events
          if (eventName === 'DigitalTwinMinted') {
            toast({
              title: "Asset Minted",
              description: "New digital asset has been minted",
            });
          } else if (eventName === 'ClaimFiled') {
            toast({
              title: "Insurance Claim Filed",
              description: "A new insurance claim has been submitted",
            });
          }
        });
      },
      onError: (error) => {
        console.error(`Event listener error for ${eventName}:`, error);
      },
    });

    return () => {
      unwatch();
    };
  }, [publicClient, contractName, eventName, chainId, onEvent, filter, toast]);
}
