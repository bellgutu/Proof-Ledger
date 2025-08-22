
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { type UserPosition } from '@/components/pages/liquidity';
import { Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ManageLiquidityDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  position: UserPosition;
}

export function ManageLiquidityDialog({ isOpen, setIsOpen, position }: ManageLiquidityDialogProps) {
  const { walletActions } = useWallet();
  const { removeLiquidity } = walletActions;
  
  const { toast } = useToast();
  
  const [withdrawPercent, setWithdrawPercent] = useState([50]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [token1, token2] = position.name.split('/');

  const handleWithdraw = async () => {
    const percent = withdrawPercent[0];
    if (percent <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount' });
      return;
    }

    setIsProcessing(true);
    try {
      await removeLiquidity(position, percent);
      toast({ title: 'Withdraw Submitted', description: `Your transaction to withdraw ${percent}% is processing.` });
      setIsOpen(false);
    } catch(e) {
      // Error is handled by wallet context dialog
    } finally {
      setIsProcessing(false);
      setWithdrawPercent([50]);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Your {position.name} Position</DialogTitle>
          <DialogDescription>Add more liquidity or withdraw your tokens.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Tabs defaultValue="withdraw">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="add"><PlusCircle className="mr-2"/>Add</TabsTrigger>
                    <TabsTrigger value="withdraw"><MinusCircle className="mr-2"/>Withdraw</TabsTrigger>
                </TabsList>
                <TabsContent value="add" className="pt-4">
                    <p className="text-center text-muted-foreground text-sm">Adding more liquidity is coming soon.</p>
                </TabsContent>
                <TabsContent value="withdraw" className="pt-4 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">Amount to Withdraw</label>
                            <span className="text-lg font-bold">{withdrawPercent[0]}%</span>
                        </div>
                        <Slider
                            value={withdrawPercent}
                            onValueChange={setWithdrawPercent}
                            max={100}
                            step={1}
                        />
                    </div>
                     <div className="p-3 bg-background/50 rounded-md border text-sm space-y-2">
                        <p className="font-bold">You will receive (est.):</p>
                        <div className="flex justify-between text-muted-foreground">
                            <span>{token1}:</span>
                            <span>...</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>{token2}:</span>
                            <span>...</span>
                        </div>
                    </div>
                    <Button onClick={handleWithdraw} disabled={isProcessing} variant="destructive" className="w-full">
                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Withdraw Liquidity'}
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
