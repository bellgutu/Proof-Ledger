
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/contexts/wallet-context';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

interface TransactionDetailDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transaction: Transaction;
}

export function TransactionDetailDialog({ isOpen, setIsOpen, transaction }: TransactionDetailDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast({ title: `${field} copied to clipboard!` });
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Completed</Badge>;
      case 'Pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'Failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const blockExplorerUrl = `https://etherscan.io/tx/${transaction.txHash}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Detailed information for your {transaction.type} transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            {getStatusBadge(transaction.status)}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Date</span>
            <span>{format(new Date(transaction.timestamp), "MMM d, yyyy, h:mm a")}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground">Description</span>
            <span className="text-right max-w-[70%]">
                {typeof transaction.details === 'string' ? transaction.details : transaction.type}
            </span>
          </div>
          {transaction.amount && (
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{transaction.amount.toLocaleString()} {transaction.token}</span>
            </div>
          )}
          <hr className="border-border" />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">From</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(transaction.from, 'From address')}>
                {copied === 'From address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">To</span>
             <div className="flex items-center gap-2">
              <span className="font-mono">{transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(transaction.to, 'To address')}>
                {copied === 'To address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
           <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Transaction Hash</span>
             <div className="flex items-center gap-2">
              <span className="font-mono">{transaction.txHash.slice(0, 6)}...{transaction.txHash.slice(-4)}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(transaction.txHash, 'Tx Hash')}>
                 {copied === 'Tx Hash' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>
              <a href={blockExplorerUrl} target="_blank" rel="noopener noreferrer">
                 <Button size="icon" variant="ghost" className="h-6 w-6"><ExternalLink size={14}/></Button>
              </a>
            </div>
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
