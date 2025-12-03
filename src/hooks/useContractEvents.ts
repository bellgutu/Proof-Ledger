'use client';

import { useEffect } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { ABIS, getContractAddress } from '@/contracts';
import { useToast } from '@/hooks/use-toast';
import { Address } from 'viem';

interface EventListenerOptions {
  contractName: keyof typeof ABIS;
  eventName: string;
  chainId?: number;
  onEvent: (event: any) => void;
  filter?: any;
}

// Hook using wagmi's built-in event listener
export function useContractEvent({
  contractName,
  eventName,
  chainId = 11155111,
  onEvent,
  filter,
}: EventListenerOptions) {
  const address = getContractAddress(contractName, chainId);
  const abi = ABIS[contractName];
  const { toast } = useToast();

  useWatchContractEvent({
    address,
    abi,
    eventName,
    args: filter,
    onLogs: (logs) => {
      logs.forEach(log => {
        onEvent(log);
        
        // Show toast for important events
        if (eventName === 'DigitalTwinMinted') {
          const [tokenId, assetType] = log.args;
          toast({
            title: "Digital Twin Minted",
            description: `Token #${tokenId.toString()} (Type: ${assetType}) created`,
          });
        } else if (eventName === 'ClaimFiled') {
          const [claimId, policyId, claimant, amount] = log.args;
          toast({
            title: "Insurance Claim Filed",
            description: `Claim #${claimId.toString()} for ${policyId}`,
          });
        } else if (eventName === 'OracleSlashed') {
          const [oracleAddress, amount, reason] = log.args;
          toast({
            title: "Oracle Slashed",
            description: `Oracle ${oracleAddress.slice(0, 6)}... was slashed`,
            variant: "destructive",
          });
        }
      });
    },
  });
}

// Advanced event listener with polling
export function useContractEventPolling({
  contractName,
  eventName,
  chainId = 11155111,
  onEvent,
  filter,
  pollInterval = 15000, // 15 seconds
}: EventListenerOptions & { pollInterval?: number }) {
  const publicClient = usePublicClient({ chainId });
  const { toast } = useToast();

  useEffect(() => {
    if (!publicClient) return;

    const address = getContractAddress(contractName, chainId);
    if (!address) return;

    const abi = ABIS[contractName];
    if (!abi) return;

    const pollEvents = async () => {
      try {
        const logs = await publicClient.getLogs({
          address,
          event: abi.find((item: any) => item.name === eventName && item.type === 'event'),
          args: filter,
          fromBlock: 'latest' as any, // Get recent events
          toBlock: 'latest' as any,
        });

        logs.forEach(log => {
          onEvent(log);
        });
      } catch (error) {
        console.error(`Error polling events for ${eventName}:`, error);
      }
    };

    // Initial poll
    pollEvents();

    // Set up interval
    const interval = setInterval(pollEvents, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [publicClient, contractName, eventName, chainId, onEvent, filter, pollInterval, toast]);
}
