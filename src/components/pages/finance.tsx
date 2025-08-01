"use client";

import React, { useState } from 'react';
import { RefreshCcw, ArrowDown } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletHeader } from '@/components/shared/wallet-header';

export default function FinancePage() {
  const { walletState, walletActions } = useWallet();
  const { isConnected, ethBalance, usdcBalance } = walletState;
  const { setEthBalance, setUsdcBalance } = walletActions;

  const [stakedAmount, setStakedAmount] = useState(0);
  const [stakingLoading, setStakingLoading] = useState(false);
  const [token1Amount, setToken1Amount] = useState('');
  const [token2Amount, setToken2Amount] = useState('');
  const [swapping, setSwapping] = useState(false);

  const ethToUsdcRate = 3500;

  const handleToken1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || parseFloat(val) < 0) {
      setToken1Amount('');
      setToken2Amount('');
      return;
    }
    const numVal = parseFloat(val);
    setToken1Amount(val);
    setToken2Amount((numVal * ethToUsdcRate).toFixed(2));
  };
  
  const handleSwap = () => {
    const amountToSwap = parseFloat(token1Amount);
    if (amountToSwap <= 0 || amountToSwap > ethBalance) return;
    setSwapping(true);
    setTimeout(() => {
      const usdcReceived = amountToSwap * ethToUsdcRate;
      setEthBalance(prev => parseFloat((prev - amountToSwap).toFixed(4)));
      setUsdcBalance(prev => parseFloat((prev + usdcReceived).toFixed(4)));
      setToken1Amount('');
      setToken2Amount('');
      setSwapping(false);
    }, 1500);
  };

  const handleStake = () => {
    const amountToStake = 0.5;
    if (ethBalance < amountToStake) {
      console.log('Not enough ETH to stake!');
      return;
    }
    setStakingLoading(true);
    setTimeout(() => {
      setEthBalance(prev => parseFloat((prev - amountToStake).toFixed(4)));
      setStakedAmount(prev => parseFloat((prev + amountToStake).toFixed(4)));
      setStakingLoading(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-0 space-y-8">
      <WalletHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Token Swap</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <div>
              <label htmlFor="from-token" className="block text-sm font-medium text-muted-foreground mb-1">From (ETH)</label>
              <Input
                id="from-token"
                type="number"
                value={token1Amount}
                onChange={handleToken1Change}
                disabled={!isConnected}
                placeholder="0.0"
              />
              <p className="text-xs text-muted-foreground mt-1">Balance: {ethBalance.toFixed(4)} ETH</p>
            </div>
            <div className="flex justify-center my-2">
              <ArrowDown size={24} className="text-muted-foreground" />
            </div>
            <div>
              <label htmlFor="to-token" className="block text-sm font-medium text-muted-foreground mb-1">To (USDC)</label>
              <Input
                id="to-token"
                type="number"
                value={token2Amount}
                readOnly
                disabled={!isConnected}
                placeholder="0.0"
              />
              <p className="text-xs text-muted-foreground mt-1">Balance: {usdcBalance.toFixed(2)} USDC</p>
            </div>
            <Button
              onClick={handleSwap}
              disabled={!isConnected || swapping || !token1Amount || parseFloat(token1Amount) <= 0}
              className="w-full mt-6"
              variant="default"
            >
              {swapping ? (
                <span className="flex items-center">
                  <RefreshCcw size={16} className="mr-2 animate-spin" /> Swapping...
                </span>
              ) : (
                'Swap Tokens'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Staking Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-md border">
              <p className="text-sm text-muted-foreground">Your Staked Assets:</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-foreground">{stakedAmount.toFixed(4)} ETH</span>
                <span className="text-green-400 font-semibold">12% APY (Simulated)</span>
              </div>
            </div>
            <div>
              <label htmlFor="stake-amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount to Stake (ETH)</label>
              <Input
                id="stake-amount"
                type="number"
                value={0.5}
                readOnly
                disabled={!isConnected}
              />
            </div>
            <Button
              onClick={handleStake}
              disabled={!isConnected || stakingLoading || ethBalance < 0.5}
              className="w-full bg-green-600 text-white hover:bg-green-700"
            >
              {stakingLoading ? (
                <span className="flex items-center">
                  <RefreshCcw size={16} className="mr-2 animate-spin" /> Staking...
                </span>
              ) : (
                'Stake 0.5 ETH'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
