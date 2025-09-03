
"use client";

import React from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PositionHistory() {
  const { walletState } = useWallet();
  const { pastPositions } = walletState;

  return (
    <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center">
          <History className="mr-3" /> Trade History
        </CardTitle>
        <CardDescription>A record of your past trading positions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Side</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Entry / Exit</TableHead>
                <TableHead className="text-right">PnL</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastPositions.length > 0 ? (
                pastPositions.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell>
                      <div className={`flex items-center gap-1 font-semibold ${pos.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.side === 'long' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {pos.side.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>{pos.size.toFixed(4)} ETH</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>${pos.entryPrice.toFixed(2)}</span>
                        <span className="text-muted-foreground">${pos.exitPrice.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${pos.pnl.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(pos.timestamp), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No past positions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
