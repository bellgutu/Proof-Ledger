
"use client"
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Search } from 'lucide-react';
import { Button } from '../ui/button';

export const RoundHistoryCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Round History
        </CardTitle>
        <CardDescription>
          Explore historical consensus data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Search className="h-12 w-12 opacity-50 mb-4" />
                <p className="font-semibold">Historical Data Explorer</p>
                <p className="text-sm">This feature is part of Phase 2 and will be available soon.</p>
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

    