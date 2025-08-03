
"use client"

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { type Pool } from '@/components/pages/liquidity';
import Image from 'next/image';
import { getTokenLogo } from '@/lib/tokenLogos';
import { ArrowDown, Loader2 } from 'lucide-react';

interface AddLiquidityDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  pool: Pool;
  onAddPosition: (pool: Pool, lpTokens: number, share: number) => void;
}

export function AddLiquidityDialog({ isOpen, setIsOpen, pool, onAddPosition }: AddLiquidityDialogProps) {
  const { walletState, walletActions } = useWallet();
  const { marketData, ethBalance, usdcBalance, wethBalance, solBalance, usdtBalance } = walletState;
  const { setEthBalance, setUsdcBalance, setWethBalance, setSolBalance, setUsdtBalance } = walletActions;
  
  const { toast } = useToast();
  
  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const [token1, token2] = pool.name.split('/');
  
  const balances = {
    ETH: ethBalance,
    WETH: wethBalance,
    SOL: solBalance,
    USDC: usdcBalance,
    USDT: usdtBalance,
  };

  const setters = {
    ETH: setEthBalance,
    WETH: setWethBalance,
    SOL: setSolBalance,
    USDC: setUsdcBalance,
    USDT: setUsdtBalance,
  }

  const token1Price = marketData[token1 as keyof typeof marketData]?.price || 0;
  const token2Price = marketData[token2 as keyof typeof marketData]?.price || 0;
  const priceRatio = token1Price > 0 ? token2Price / token1Price : 0;

  const handleAmount1Change = (value: string) => {
    setAmount1(value);
    if (value && !isNaN(parseFloat(value)) && priceRatio > 0) {
      setAmount2((parseFloat(value) * priceRatio).toFixed(4));
    } else {
      setAmount2('');
    }
  };

  const handleDeposit = () => {
    const numAmount1 = parseFloat(amount1);
    const numAmount2 = parseFloat(amount2);

    if (isNaN(numAmount1) || isNaN(numAmount2) || numAmount1 <= 0 || numAmount2 <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount' });
      return;
    }
    
    if (numAmount1 > balances[token1 as keyof typeof balances] || numAmount2 > balances[token2 as keyof typeof balances]) {
        toast({ variant: 'destructive', title: 'Insufficient balance' });
        return;
    }

    setIsDepositing(true);
    setTimeout(() => {
        // Simulate transaction
        setters[token1 as keyof typeof setters]((prev) => prev - numAmount1);
        setters[token2 as keyof typeof setters]((prev) => prev - numAmount2);

        const lpTokensReceived = Math.sqrt(numAmount1 * numAmount2);
        const poolShare = (lpTokensReceived / (pool.tvl + numAmount1 * token1Price + numAmount2 * token2Price)) * 100;
        
        onAddPosition(pool, lpTokensReceived, poolShare);

        toast({ title: 'Liquidity Added', description: `You received ${lpTokensReceived.toFixed(4)} LP tokens.` });
        setIsDepositing(false);
        setAmount1('');
        setAmount2('');
        setIsOpen(false);
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Liquidity to {pool.name}</DialogTitle>
          <DialogDescription>Provide tokens to the pool to earn fees. Amounts will be automatically balanced.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-background/50 rounded-md border space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{token1}</span>
              <span>Balance: {balances[token1 as keyof typeof balances].toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src={getTokenLogo(token1)} alt={token1} width={24} height={24} />
              <Input type="number" value={amount1} onChange={(e) => handleAmount1Change(e.target.value)} placeholder="0.0" className="text-lg" />
            </div>
          </div>
          
          <div className="flex justify-center -my-2"><ArrowDown size={16} className="text-muted-foreground"/></div>

          <div className="p-4 bg-background/50 rounded-md border space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{token2}</span>
              <span>Balance: {balances[token2 as keyof typeof balances].toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src={getTokenLogo(token2)} alt={token2} width={24} height={24} />
              <Input type="number" value={amount2} placeholder="0.0" readOnly className="text-lg" />
            </div>
          </div>

          <Button onClick={handleDeposit} disabled={isDepositing} className="w-full">
            {isDepositing ? <Loader2 className="animate-spin" /> : 'Deposit & Add Liquidity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
