"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { TrendingUp, TrendingDown, RefreshCcw, Newspaper, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getTokenLogo } from '@/lib/tokenLogos';

interface Market {
  id: number;
  name: string;
  symbol: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface News {
  id: number;
  title: string;
  content: string;
}

const MarketCard = ({ name, symbol, value, change, isPositive }: Market) => (
  <Card className="bg-card text-card-foreground transform transition-transform duration-300 hover:scale-105">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-muted-foreground">{name}</h3>
        <Image src={getTokenLogo(symbol)} alt={`${symbol} logo`} width={24} height={24} />
      </div>
      <p className="text-3xl font-bold mb-2 text-foreground">
        ${value}
      </p>
      <div className={`flex items-center font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="mr-1" size={16} /> : <TrendingDown className="mr-1" size={16} />}
        <span>{change}</span>
      </div>
    </CardContent>
  </Card>
);

const NewsCard = ({ title, content }: News) => (
  <Card className="bg-card text-card-foreground flex-none w-80 min-w-80 h-full p-4 hover:bg-secondary transition-colors duration-200 cursor-pointer">
    <div className="flex flex-col h-full">
      <h4 className="text-md font-semibold text-primary mb-2 truncate">{title}</h4>
      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{content}</p>
      <div className="mt-auto flex items-center text-primary font-medium text-sm">
        Read more <ArrowRight size={16} className="ml-1" />
      </div>
    </div>
  </Card>
);

export default function MarketsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [newsFeed, setNewsFeed] = useState<News[]>([]);

  const fetchMarketData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newMarkets = [
        {
          id: 1, name: 'Bitcoin', symbol: 'BTC', value: (Math.random() * 5000 + 65000).toFixed(2), change: (Math.random() * 3 - 1.5).toFixed(2) + '%', isPositive: Math.random() > 0.5
        },
        {
          id: 2, name: 'Ethereum', symbol: 'ETH', value: (Math.random() * 200 + 3800).toFixed(2), change: (Math.random() * 4 - 2).toFixed(2) + '%', isPositive: Math.random() > 0.5
        },
        {
          id: 3, name: 'Solana', symbol: 'SOL', value: (Math.random() * 10 + 150).toFixed(2), change: (Math.random() * 8 - 4).toFixed(2) + '%', isPositive: Math.random() > 0.5
        },
        {
          id: 4, name: 'USDC', symbol: 'USDC', value: (1 + (Math.random() * 0.01 - 0.005)).toFixed(4), change: (Math.random() * 0.02 - 0.01).toFixed(2) + '%', isPositive: Math.random() > 0.5
        },
        {
          id: 5, name: 'BNB', symbol: 'BNB', value: (Math.random() * 50 + 580).toFixed(2), change: (Math.random() * 5 - 2.5).toFixed(2) + '%', isPositive: Math.random() > 0.5
        },
        {
          id: 6, name: 'USDT', symbol: 'USDT', value: (1 + (Math.random() * 0.01 - 0.005)).toFixed(4), change: (Math.random() * 0.02 - 0.01).toFixed(2) + '%', isPositive: Math.random() > 0.5
        },
        {
          id: 7, name: 'XRP', symbol: 'XRP', value: (Math.random() * 0.1 + 0.5).toFixed(4), change: (Math.random() * 10 - 5).toFixed(2) + '%', isPositive: Math.random() > 0.5
        },
      ];
      setMarkets(newMarkets);

      const generatedNews = [
        { id: 1, title: 'Major Protocol Upgrade Announced', content: 'Developers behind a leading DeFi protocol have announced a significant upgrade, promising lower transaction fees and enhanced security.' },
        { id: 2, title: 'New NFT Marketplace Launches with Exclusive Art', content: 'A new player in the NFT space has launched its platform, featuring a curated collection from renowned digital artists.' },
        { id: 3, title: 'Bitcoin ETF Sees Record Inflows', content: 'Recent data shows unprecedented inflows into the largest spot Bitcoin ETF, signaling growing institutional interest.' },
        { id: 4, title: 'Web3 Gaming Studio Secures $50M in Funding', content: 'A Web3 gaming studio focusing on play-to-earn mechanics has closed a massive funding round, with plans to launch its first title this year.' },
        { id: 5, title: 'Decentralized Identity Solution Goes Live', content: 'A new decentralized identity (DID) project has officially launched on the mainnet, aiming to give users more control over their data.' },
        { id: 6, title: 'Stablecoin Regulation Discussions Heat Up', content: 'Global regulators are intensifying talks around stablecoin legislation, a move that could bring more clarity and stability to the market.' },
      ];
      setNewsFeed(generatedNews);

      setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-center mb-8">
        <Button onClick={fetchMarketData} disabled={isLoading} variant="default" size="lg">
          {isLoading ? (
            <span className="flex items-center">
              <RefreshCcw size={16} className="mr-2 animate-spin" /> Refreshing...
            </span>
          ) : (
            <span className="flex items-center">
              <RefreshCcw size={16} className="mr-2" /> Refresh Data
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[170px] w-full" />)
        ) : (
          markets.map(market => <MarketCard key={market.id} {...market} />)
        )}
      </div>

      <div className="mt-12">
        <div className="flex items-center mb-4">
          <Newspaper size={24} className="text-primary mr-3" />
          <h2 className="text-2xl font-bold text-foreground">Top Web3 News</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 py-4 -mx-6 px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <style>{`
            .overflow-x-auto::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-80 h-40 flex-none" />)
          ) : (
            newsFeed.map(news => <NewsCard key={news.id} {...news} />)
          )}
        </div>
      </div>
    </div>
  );
};