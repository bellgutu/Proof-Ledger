
"use client";

import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, ExternalLink, ArrowDownCircle } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { getTokenLogo } from '@/lib/tokenLogos';
import { Skeleton } from '../ui/skeleton';

export function TransactionStatusDialogController() {
    const { walletState, walletActions } = useWallet();
    const { txStatusDialog } = walletState;
    const { setTxStatusDialog } = walletActions;

    const { isOpen, state, transaction, error } = txStatusDialog;
    const { amount = 0, token = '', to = '', txHash = '' } = transaction;

    const { marketData, walletAddress } = walletState;
    const assetPrice = marketData[token]?.price || 0;
    const blockExplorerUrl = txHash ? `https://etherscan.io/tx/${txHash}` : '#';

    const handleClose = () => {
        setTxStatusDialog({ isOpen: false, state: 'processing', transaction: {} });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
                // Prevent closing while processing
                if (state === 'processing') e.preventDefault();
            }}>
                {state === 'processing' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-center">Transaction Processing</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                            <p className="text-lg font-semibold">Sending {amount.toLocaleString()} {token}</p>
                            <p className="text-sm text-muted-foreground">Please wait for blockchain confirmation...</p>
                        </div>
                    </>
                )}

                {state === 'success' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-center">Transaction Successful!</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <Image src={getTokenLogo(token)} alt={token} width={48} height={48} className="rounded-full"/>
                                <p className="text-4xl font-bold">
                                {amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                                </p>
                                <p className="text-muted-foreground">
                                    ~{(amount * assetPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </p>
                            </div>
                            <ArrowDownCircle size={24} className="text-muted-foreground"/>
                             <div className="w-full text-left p-3 bg-muted rounded-md text-sm space-y-2">
                                <span className="text-xs text-muted-foreground font-semibold">TO</span>
                                <p className="font-mono text-xs break-all">{to}</p>
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2">
                            <a href={blockExplorerUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button variant="outline" className="w-full">
                                    <ExternalLink className="mr-2"/> View on Explorer
                                </Button>
                            </a>
                            <DialogClose asChild><Button className="w-full">Close</Button></DialogClose>
                        </DialogFooter>
                    </>
                )}

                 {state === 'error' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-center">Transaction Failed</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <XCircle className="h-16 w-16 text-destructive" />
                            <p className="text-sm text-center text-muted-foreground">
                                {error || 'An unexpected error occurred. Your funds have not been moved.'}
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
