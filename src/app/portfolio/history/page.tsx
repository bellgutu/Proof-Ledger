"use client";

import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Transaction } from '@/contexts/wallet-context';
import { TransactionDetailDialog } from '@/components/shared/transaction-detail-dialog';

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

    return (
        <div className="container mx-auto p-0 space-y-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2"/> Back to Portfolio
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <History size={28} className="text-primary"/>
                        <span className="text-2xl">Transaction History</span>
                    </CardTitle>
                    <CardDescription>A complete log of all your on-chain activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                    <TableRow key={tx.id} onClick={() => handleTxClick(tx)} className="cursor-pointer">
                                        <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                                        <TableCell>
                                            <div className="font-medium max-w-xs truncate">
                                                {typeof tx.details === 'string' ? tx.details : tx.type}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                        <TableCell className="text-right text-xs">
                                            {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No transactions yet.
                                    </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
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
