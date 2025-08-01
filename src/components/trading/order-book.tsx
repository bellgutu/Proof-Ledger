"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Order {
  price: string;
  size: string;
}

interface OrderBookProps {
  currentPrice: number;
}

export function OrderBook({ currentPrice }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<{ bids: Order[], asks: Order[] }>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const newBids = Array.from({ length: 8 }, (_, i) => ({
        price: (currentPrice - 1 - (Math.random() * 5)).toFixed(2),
        size: (Math.random() * 20).toFixed(4)
      })).sort((a, b) => Number(b.price) - Number(a.price));
      const newAsks = Array.from({ length: 8 }, (_, i) => ({
        price: (currentPrice + 1 + (Math.random() * 5)).toFixed(2),
        size: (Math.random() * 20).toFixed(4)
      })).sort((a, b) => Number(a.price) - Number(b.price));
      setOrderBook({ bids: newBids, asks: newAsks });
      if (isLoading) setIsLoading(false);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentPrice, isLoading]);

  const spread = (orderBook.asks.length > 0 && orderBook.bids.length > 0)
    ? (Number(orderBook.asks[0].price) - Number(orderBook.bids[0].price)).toFixed(2)
    : 'N/A';

  return (
    <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm text-muted-foreground">
            <thead>
              <tr className="text-left">
                <th className="py-2 font-medium">Price (USDC)</th>
                <th className="py-2 font-medium text-right">Size (ETH)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length: 8}).map((_, i) => (
                  <tr key={i}><td colSpan={2}><Skeleton className="h-6 w-full my-1"/></td></tr>
                ))
              ) : (
                orderBook.asks.slice().reverse().map((ask, index) => (
                  <tr key={index} className="text-red-400">
                    <td className="py-1">{ask.price}</td>
                    <td className="text-right">{ask.size}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="text-center font-bold text-foreground py-2 my-1 border-y border-border">
              Spread: <span className="text-primary">${spread}</span>
          </div>
          <table className="w-full text-sm text-muted-foreground">
             <tbody>
              {isLoading ? (
                Array.from({length: 8}).map((_, i) => (
                  <tr key={i}><td colSpan={2}><Skeleton className="h-6 w-full my-1"/></td></tr>
                ))
              ) : (
                orderBook.bids.map((bid, index) => (
                  <tr key={index} className="text-green-400">
                    <td className="py-1">{bid.price}</td>
                    <td className="text-right">{bid.size}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
