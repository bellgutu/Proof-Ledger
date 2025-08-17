

"use client";

import React, { useState } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Transaction } from '@/contexts/wallet-context';
import { TransactionDetailDialog } from '@/components/shared/transaction-detail-dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function HistoryPage() {
  const { walletState } = useWallet();
  const { transactions } = walletState;
  const router = useRouter();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleTxClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Completed</Badge>;
      case 'Pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'Failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) {
      return "Invalid date";
    }
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  }

  return (
    <div className="container mx-auto p-0 space-y-8">
       <Button variant="ghost" onClick={() => router.push('/portfolio')} className="mb-4">
            <ArrowLeft className="mr-2" />
            Back to Portfolio
        </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <History size={28} className="text-primary"/>
            <span className="text-2xl">Transaction History</span>
          </CardTitle>
          <CardDescription>A complete log of all your on-chain activity. Click a transaction for details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id} onClick={() => handleTxClick(tx)} className="cursor-pointer">
                    <TableCell className="font-medium">{tx.type}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                        {typeof tx.details === 'string' ? tx.details : `Interaction with ${tx.to.slice(0, 10)}...`}
                    </TableCell>
                    <TableCell>{tx.amount ? `${tx.amount.toLocaleString(undefined, {maximumFractionDigits: 6})} ${tx.token}` : 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-right">{formatDate(tx.timestamp)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedTx && (
        <TransactionDetailDialog 
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          transaction={selectedTx}
        />
      )}
    </div>
  );
}

    