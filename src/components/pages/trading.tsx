
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { RefreshCcw, TrendingUp, TrendingDown, Loader2, Info, PlusCircle, MinusCircle, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletHeader } from '@/components/shared/wallet-header';
import TradingViewWidget from '@/components/trading/tradingview-widget';
import { OrderBook } from '@/components/trading/order-book';
import { WhaleWatch } from '@/components/trading/whale-watch';
import { Skeleton } from '../ui/skeleton';
import { getActivePosition, getOraclePrice } from '@/services/blockchain-service';
import { useToast } from '@/hooks/use-toast';
import type { Position } from '@/services/blockchain-service';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { formatTokenAmount, parseTokenAmount, calculateRequiredCollateral, USDT_DECIMALS, ETH_DECIMALS, formatSignedTokenAmount } from '@/lib/format';

const TradingPageContent = () => {
  const { walletState, walletActions } = useWallet();
  const { isConnected, balances, marketData, walletAddress, vaultCollateral, decimals } = walletState;
  const { depositCollateral, withdrawCollateral, openPosition, closePosition, updateVaultCollateral, updateOraclePrice } = walletActions;
  const { toast } = useToast();
  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [tradeSize, setTradeSize] = useState('');
  const [leverage, setLeverage] = useState([10]);
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const [activePosition, setActivePosition] = useState<Position | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  
  const [currentPrice, setCurrentPrice] = useState(marketData['ETH']?.price || 0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // New state variables for price oracle management
  const [customPrice, setCustomPrice] = useState('');
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [oraclePrice, setOraclePrice] = useState(3000); // Default oracle price
  
  const usdtBalance = balances['USDT'] || 0;
  
  const tradingViewSymbol = `BINANCE:${selectedPair.split('/')[0]}USDT`;
  
  const requiredCollateralDisplay = useMemo(() => {
    const sizeNum = parseFloat(tradeSize);
    const price = currentPrice;
    if (!sizeNum || !price || leverage[0] === 0) return '0.00';
    const positionValue = sizeNum * price;
    const collateral = positionValue / leverage[0];
    return collateral.toFixed(2);
  }, [tradeSize, currentPrice, leverage]);
  
  const requiredCollateralOnChain = useMemo(() => {
    const sizeNum = parseFloat(tradeSize);
    if (!sizeNum || !currentPrice || leverage[0] === 0) return BigInt(0);
    try {
      return calculateRequiredCollateral(tradeSize, currentPrice.toString(), leverage[0]);
    } catch (error) {
      console.error("Error calculating collateral:", error);
      return BigInt(0);
    }
  }, [tradeSize, currentPrice, leverage]);
  
  const tradeSizeOnChain = useMemo(() => {
    if (!tradeSize) return BigInt(0);
    try {
      return parseTokenAmount(tradeSize, ETH_DECIMALS);
    } catch (error) {
      console.error("Error parsing trade size:", error);
      return BigInt(0);
    }
  }, [tradeSize]);
  
  useEffect(() => {
    const pairAsset = selectedPair.split('/')[0];
    if (marketData[pairAsset]) {
      setCurrentPrice(marketData[pairAsset].price);
    }
    const interval = setInterval(() => {
         if (marketData[pairAsset]) {
            setCurrentPrice(prev => marketData[pairAsset].price || prev);
         }
    }, 2000);
    return () => clearInterval(interval);
  }, [marketData, selectedPair]);
  
  const fetchPosition = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    setIsLoadingPosition(true);
    try {
      const position = await getActivePosition(walletAddress as `0x${string}`);
      setActivePosition(position);
    } catch (e) {
      console.error("Failed to fetch active position:", e);
    }
    setIsLoadingPosition(false);
  }, [isConnected, walletAddress]);
  
  useEffect(() => {
    fetchPosition();
    const interval = setInterval(() => {
      fetchPosition();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPosition]);
  
  useEffect(() => {
    if (activePosition) {
      // This will trigger a re-render when the price changes
      // and update the PnL calculation
      const interval = setInterval(() => {
        // Force re-render to update PnL
        setCurrentPrice(prev => marketData[selectedPair.split('/')[0]]?.price || prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activePosition, marketData, selectedPair]);
  
  // Effect to check if the oracle price is outdated
  useEffect(() => {
    const checkOraclePrice = async () => {
      if (!isConnected) return;
      
      try {
        const price = await getOraclePrice();
        setOraclePrice(price);
        
        // If oracle price is more than 5% different from current price, show alert
        const priceDifference = Math.abs(currentPrice - price) / currentPrice;
        if (priceDifference > 0.05) {
          setShowPriceAlert(true);
        } else {
          setShowPriceAlert(false);
        }
      } catch (error) {
        console.error("Error checking oracle price:", error);
      }
    };
    
    checkOraclePrice();
    const interval = setInterval(checkOraclePrice, 10000); // Check every 10 seconds
    return () => clearInterval(interval);

  }, [isConnected, currentPrice]);
  
  const handlePairChange = (pair: string) => {
    if(activePosition) {
      toast({ variant: 'destructive', title: "Action blocked", description: "Close your active position before changing pairs."});
      return;
    }
    setSelectedPair(pair);
    const pairAsset = pair.split('/')[0];
    if (marketData[pairAsset]) {
        setCurrentPrice(marketData[pairAsset].price);
    }
    setTradeSize('');
  };
  
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if(isNaN(amount) || amount <= 0) {
        toast({variant: 'destructive', title: 'Invalid amount'});
        return;
    }
    if(amount > usdtBalance) {
        toast({variant: 'destructive', title: 'Insufficient USDT balance'});
        return;
    }
    setIsDepositing(true);
    try {
        await depositCollateral(depositAmount);
        setDepositAmount('');
    } catch(e) {
        // error handled by context
    } finally {
        setIsDepositing(false);
    }
  }
  
  const handleWithdraw = async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
          toast({ variant: 'destructive', title: 'Invalid amount' });
          return;
      }
      if (amount > vaultCollateral.available) {
          toast({ variant: 'destructive', title: 'Insufficient available collateral' });
          return;
      }
      setIsWithdrawing(true);
      try {
          await withdrawCollateral(withdrawAmount);
          setWithdrawAmount('');
      } catch (e) {
          // error handled by context
      } finally {
          setIsWithdrawing(false);
      }
  }
  
  const handlePlaceTradeReview = () => {
    const sizeNum = parseFloat(tradeSize);
    if (isNaN(sizeNum) || sizeNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid trade size' });
        return;
    };
    
    if (requiredCollateralOnChain === BigInt(0)) {
        toast({ variant: 'destructive', title: 'Invalid collateral amount' });
        return;
    };
    
    const availableCollateralOnChain = parseTokenAmount(vaultCollateral.available.toString(), USDT_DECIMALS);
    
    if (requiredCollateralOnChain > availableCollateralOnChain) {
      toast({ 
        variant: 'destructive', 
        title: 'Insufficient Available Collateral', 
        description: `You need to have at least ${requiredCollateralDisplay} USDT deposited in the vault and available for this trade.` 
      });
      return;
    }
    
    setIsConfirmOpen(true);
  };
  
  const executeTrade = async () => {
    if (!walletAddress) return;
    setIsConfirmOpen(false);
    setIsProcessing(true);
    try {
      // First, update the oracle price to the current market price
      await updateOraclePrice(currentPrice);
      setOraclePrice(currentPrice);
      
      // Then open the position
      await openPosition({
          side: tradeDirection === 'long' ? 0 : 1,
          size: tradeSize,
          collateral: requiredCollateralDisplay,
      });
      
      setTradeSize('');
      await fetchPosition();
    } catch(e: any) {
        // Error is handled by the wallet context dialog
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleCloseTrade = async () => {
    if (!walletAddress || !activePosition) return;
    setIsProcessing(true);
    try {
        await closePosition();
        setActivePosition(null); 
        
        await fetchPosition();
        await updateVaultCollateral();
        
    } catch(e: any) {
        // Error is handled by the wallet context dialog
    } finally {
        setIsProcessing(false);
    }
  };
  
  const calculatePnl = (position: Position) => {
    if (!position.active) return 0;
    
    const positionSizeInETH = position.size;
    const priceDifference = currentPrice - position.entryPrice;
    let pnl = positionSizeInETH * priceDifference;
    
    if (position.side === 'short') {
      pnl = -pnl;
    }
    
    return pnl;
  };
  
  const handleUpdatePrice = async () => {
    if (!isConnected) return;
    
    try {
      await updateOraclePrice(currentPrice);
      setOraclePrice(currentPrice);
      toast({
        title: "Success",
        description: `Price oracle updated to $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
      await fetchPosition();
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };
  
  const handleSetCustomPrice = async () => {
    if (!isConnected || !customPrice) return;
    
    try {
      const price = parseFloat(customPrice);
      if (isNaN(price) || price <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Price",
          description: "Please enter a valid price greater than 0",
        });
        return;
      }
      
      await updateOraclePrice(price);
      setOraclePrice(price);
      toast({
        title: "Success",
        description: `Price oracle updated to $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
      
      setCustomPrice('');
    } catch (error) {
      console.error("Error setting custom price:", error);
    }
  };
  
  const tradeablePairs = ['ETH/USDT', 'WETH/USDC', 'BNB/USDT', 'SOL/USDT', 'LINK/USDT'];
  const initialPriceForChart = marketData[selectedPair.split('/')[0]]?.price;
  
  if (!initialPriceForChart) {
    return null;
  }
  
  return (
    <TooltipProvider>
    <WalletHeader />
    
    {showPriceAlert && (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
        <div className="flex">
          <div className="py-1"><svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8h2v2H9v-2z"/></svg></div>
          <div>
            <p className="font-bold">Price Oracle Alert</p>
            <p className="text-sm">The price oracle appears to be outdated. Current ETH price is ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, but the oracle is using ${oraclePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. </p>
          </div>
           <button onClick={() => setShowPriceAlert(false)} className="ml-auto -mx-1.5 -my-1.5 bg-yellow-100 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-400 p-1.5 hover:bg-yellow-200 inline-flex h-8 w-8" aria-label="Dismiss">
            <span className="sr-only">Dismiss</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
      </div>
    )}
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      <div className="lg:col-span-2 space-y-8">
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
              <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-foreground">Futures</h2>
                  <Select value={selectedPair} onValueChange={handlePairChange} disabled={!!activePosition}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Pair" />
                      </SelectTrigger>
                      <SelectContent>
                          {tradeablePairs.map(pair => (
                              <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
            <span className="text-3xl font-bold text-foreground">${currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-card rounded-md">
                <TradingViewWidget symbol={tradingViewSymbol} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-primary">Active Position</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingPosition ? (
                    <Skeleton className="h-24 w-full"/>
                ) : activePosition ? (
                    <div className="space-y-4">
                    {(pos => {
                        const pnl = calculatePnl(pos);
                        const positionValue = pos.size * currentPrice;
                        const currentLeverage = pos.collateral > 0 ? positionValue / pos.collateral : 0;
                        
                        return (
                            <div key={pos.entryPrice} className="p-4 bg-background rounded-md border">
                                <div className="flex flex-wrap items-center justify-between mt-1 gap-4">
                                <span className={`text-lg font-bold ${pos.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                    {pos.side.toUpperCase()} {pos.size.toLocaleString('en-US', {maximumFractionDigits: 4})} {selectedPair.split('/')[0]}
                                </span>
                                <div className="flex items-center gap-4">
                                  <span className="text-foreground font-semibold">Entry: ${pos.entryPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</span>
                                  <span className="text-foreground font-semibold">Leverage: {currentLeverage.toFixed(2)}x</span>
                                </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                  <div><span className="text-muted-foreground">Collateral: </span><span className="font-mono">${pos.collateral.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                  <div className="text-right"><span className="text-muted-foreground">Value: </span><span className="font-mono">${positionValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                </div>
                                <div className="mt-2 text-2xl font-bold">
                                P&L: <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    ${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                                </div>
                                <Button onClick={handleCloseTrade} className="w-full mt-4" variant="destructive" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin"/> : 'Close Position'}
                                </Button>
                            </div>
                        );
                    })(activePosition)}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No active position.</p>
                )}
            </CardContent>
        </Card>
      </div>
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary"><PiggyBank/> Collateral Vault</CardTitle>
                <CardDescription>Deposit USDT here to use as collateral for trades.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-lg bg-background border mb-4 text-center space-y-1">
                    <Label className="text-muted-foreground">Available to Trade</Label>
                    <p className="text-2xl font-bold">${vaultCollateral.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">
                        Total: ${vaultCollateral.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
                        Locked: ${vaultCollateral.locked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <Tabs defaultValue="deposit">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="deposit"><PlusCircle/> Deposit</TabsTrigger>
                        <TabsTrigger value="withdraw"><MinusCircle/> Withdraw</TabsTrigger>
                    </TabsList>
                    <TabsContent value="deposit" className="pt-4 space-y-2">
                        <Label htmlFor="deposit-amount">Amount to Deposit (USDT)</Label>
                        <Input id="deposit-amount" type="number" placeholder="0.0" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                        <p className="text-xs text-muted-foreground text-right">
                          Wallet Balance: {usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button onClick={handleDeposit} disabled={isDepositing || !isConnected} className="w-full">
                           {isDepositing ? <Loader2 className="animate-spin" /> : "Deposit Collateral"}
                        </Button>
                    </TabsContent>
                    <TabsContent value="withdraw" className="pt-4 space-y-2">
                        <Label htmlFor="withdraw-amount">Amount to Withdraw (USDT)</Label>
                        <Input id="withdraw-amount" type="number" placeholder="0.0" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                        <p className="text-xs text-muted-foreground text-right">
                          Available in Vault: {vaultCollateral.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button onClick={handleWithdraw} disabled={isWithdrawing || !isConnected} variant="destructive" className="w-full">
                           {isWithdrawing ? <Loader2 className="animate-spin" /> : "Withdraw Collateral"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Open Position</CardTitle>
             <CardDescription>Use your deposited collateral to open a leveraged position.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trade-amount">Trade Size ({selectedPair.split('/')[0]})</Label>
              <Input
                id="trade-amount"
                type="number"
                value={tradeSize}
                onChange={(e) => setTradeSize(e.target.value)}
                disabled={!isConnected || !!activePosition}
                placeholder="0.0"
                className="mt-1"
              />
            </div>
             <div>
                <div className="flex justify-between items-center">
                    <Label htmlFor="leverage-slider">Leverage</Label>
                    <span className="font-bold text-primary">{leverage[0]}x</span>
                </div>
                <Slider
                    id="leverage-slider"
                    value={leverage}
                    onValueChange={setLeverage}
                    max={10}
                    min={1}
                    step={0.5}
                    disabled={!isConnected || !!activePosition}
                    className="mt-2"
                />
            </div>
            
            <div className="p-3 bg-muted/50 rounded-md text-sm text-center">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Required Collateral:</span>
                    <span className="font-bold text-foreground">{requiredCollateralDisplay} USDT</span>
                </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => setTradeDirection('long')} className={`w-full ${tradeDirection === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-secondary hover:bg-green-600/50'}`} disabled={!isConnected || !!activePosition}><TrendingUp size={16} className="mr-2" /> Long</Button>
              <Button onClick={() => setTradeDirection('short')} className={`w-full ${tradeDirection === 'short' ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary hover:bg-red-600/50'}`} disabled={!isConnected || !!activePosition}><TrendingDown size={16} className="mr-2" /> Short</Button>
            </div>
            <Button onClick={handlePlaceTradeReview} disabled={!isConnected || isProcessing || !!activePosition} className="w-full">
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Open Position'}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Price Oracle</CardTitle>
            <CardDescription>Update the ETH price used for new positions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-md text-sm text-center">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current ETH Price:</span>
                <span className="font-bold text-foreground">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oracle Price:</span>
                <span className="font-bold text-foreground">${oraclePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-price">Set Custom Price (USD)</Label>
              <Input
                id="custom-price"
                type="number"
                placeholder="4800.00"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSetCustomPrice} 
              disabled={!isConnected || !customPrice}
              className="w-full"
            >
              Set Custom Price
            </Button>
            <Button 
              onClick={handleUpdatePrice} 
              disabled={!isConnected}
              variant="outline"
              className="w-full"
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Use Current Market Price
            </Button>
          </CardContent>
        </Card>
        
        <WhaleWatch key={`whale-watch-${selectedPair}`} pair={selectedPair} />
        
        <OrderBook currentPrice={currentPrice} assetSymbol={selectedPair.split('/')[0]} />
      </div>
    </div>
    
     <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the details of your trade before submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Action:</span>
              <span className={`font-bold ${tradeDirection === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                {tradeDirection.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pair:</span>
              <span className="font-bold">{selectedPair}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-mono">{tradeSize} {selectedPair.split('/')[0]}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Required Collateral:</span>
              <span className="font-mono">{requiredCollateralDisplay} USDT</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Leverage:</span>
              <span className="font-mono">{leverage[0]}x</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Entry Price:</span>
              <span className="font-mono">${currentPrice.toLocaleString()}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeTrade} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Open Position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

export default function TradingPage() {
  const { walletState } = useWallet();
  const { isMarketDataLoaded } = walletState;
  if (!isMarketDataLoaded) {
    return (
      <div className="container mx-auto p-0 space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-[30rem] w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
      </div>
    )
  }
  return <TradingPageContent />;
}
