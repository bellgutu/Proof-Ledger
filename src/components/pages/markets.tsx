
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { TrendingUp, TrendingDown, RefreshCcw, Newspaper, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getTokenLogo } from '@/lib/tokenLogos';
import Link from 'next/link';
import { generateNews, type NewsGeneratorOutput } from '@/ai/flows/news-generator';
import { WalletHeader } from '../shared/wallet-header';
import { useWallet } from '@/contexts/wallet-context';

interface Market {
  id: string;
  name: string;
  symbol: string;
  value: string;
  change: string;
  isPositive: boolean;
}

type NewsArticle = NewsGeneratorOutput['articles'][0];

const MarketCard = ({ name, symbol, value, change, isPositive }: Market) => {
    return (
        <Card className="bg-card text-card-foreground transform transition-transform duration-300 hover:scale-105 h-full">
            <Link href={`/markets/${symbol.toLowerCase()}`} className="block h-full">
                <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-muted-foreground">{name}</h3>
                    <Image 
                      src={getTokenLogo(symbol)} 
                      alt={`${name} logo`} 
                      width={40} 
                      height={40}
                      className="drop-shadow-lg"
                    />
                </div>
                <p className="text-3xl font-bold mb-2 text-foreground">
                    ${value}
                </p>
                <div className={`flex items-center font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp className="mr-1" size={16} /> : <TrendingDown className="mr-1" size={16} />}
                    <span>{change}</span>
                </div>
                </CardContent>
            </Link>
        </Card>
    );
};

const NewsCard = ({ title, content }: NewsArticle) => (
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
  const { walletState } = useWallet();
  const { marketData, isMarketDataLoaded } = walletState;
  
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsArticle[]>([]);
  const [newsFetched, setNewsFetched] = useState(false);

  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    setNewsFetched(true);
    try {
        const newsOutput = await generateNews();
        setNewsFeed(newsOutput.articles);
    } catch(e) {
        console.error("Failed to generate news:", e);
        setNewsFeed([
             { id: 1, title: 'AI News Feed Error', content: 'Could not generate news from the AI service. Please try again later.' },
        ]);
    }
    setIsLoadingNews(false);
  }, []);

  useEffect(() => {
    if (isMarketDataLoaded) {
        const newMarkets = Object.values(marketData).map(data => ({
            id: data.symbol,
            name: data.name,
            symbol: data.symbol,
            value: data.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: data.price > 1 ? 2 : 4}),
            change: data.change.toFixed(2) + '%',
            isPositive: data.change >= 0,
        }));
        setMarkets(newMarkets);
    }
  }, [marketData, isMarketDataLoaded]);

  return (
    <div className="container mx-auto p-0 space-y-8">
        <WalletHeader />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {!isMarketDataLoaded ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[170px] w-full" />)
        ) : (
          markets.map(market => <MarketCard key={market.id} {...market} />)
        )}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Newspaper size={24} className="text-primary mr-3" />
              <h2 className="text-2xl font-bold text-foreground">Top Web3 News</h2>
            </div>
            <Button onClick={fetchNews} disabled={isLoadingNews} size="sm" variant="ghost">
                {isLoadingNews ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                <span className="sr-only">Refresh News</span>
            </Button>
        </div>
        <div className="flex overflow-x-auto gap-4 py-4 -mx-6 px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <style>{`
            .overflow-x-auto::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {isLoadingNews ? (
             Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-80 h-40 flex-none" />)
          ) : newsFetched ? (
            newsFeed.map(news => <NewsCard key={news.id} {...news} />)
          ) : (
            <div className="w-full h-40 flex items-center justify-center text-muted-foreground">
              Click the refresh button to load AI-generated news.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
