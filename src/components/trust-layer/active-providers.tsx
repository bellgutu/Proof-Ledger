
"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

export const ActiveProvidersCard = () => {
  const { state } = useTrustLayer();
  const { trustOracleData, isLoading } = state;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Providers ({trustOracleData.providers.length})
        </CardTitle>
        <CardDescription>
          Registered data providers and their stakes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {trustOracleData.providers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No providers registered yet</p>
              </div>
            ) : (
              trustOracleData.providers.map((provider) => (
                <div
                  key={provider.address}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="font-mono text-sm">
                        {provider.address.slice(0, 8)}...{provider.address.slice(-6)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stake: {provider.stake} ETH
                      </div>
                    </div>
                  </div>
                  <Badge variant={provider.active ? "default" : "secondary"} className={provider.active ? "bg-green-600/20 text-green-700 dark:bg-green-500/20 dark:text-green-400" : ""}>
                    {provider.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
