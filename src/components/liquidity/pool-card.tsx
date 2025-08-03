"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Droplets, PlusCircle } from 'lucide-react';
import { getTokenLogo } from '@/lib/tokenLogos';
import { type Pool, type UserPosition } from '@/components/pages/liquidity';
import { AddLiquidityDialog } from './add-liquidity-dialog';
import { ManageLiquidityDialog } from './manage-liquidity-dialog';

interface PoolCardProps {
  pool: Pool;
  userPosition?: UserPosition;
  onAddPosition: (pool: Pool, lpTokens: number, share: number) => void;
  onUpdatePosition: (poolId: string, lpAmount: number, shareChange: number) => void;
}

export function PoolCard({ pool, userPosition, onAddPosition, onUpdatePosition }: PoolCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  const [token1, token2] = pool.name.split('/');
  
  return (
    <>
      <Card className="bg-background/50 hover:bg-background transition-colors">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
          <div className="flex items-center gap-4 col-span-1">
            <div className="flex -space-x-4">
              <Image src={getTokenLogo(token1)} alt={token1} width={40} height={40} className="rounded-full z-10 border-2 border-background" />
              <Image src={getTokenLogo(token2)} alt={token2} width={40} height={40} className="rounded-full" />
            </div>
            <p className="font-bold text-lg">{pool.name}</p>
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">TVL</p>
              <p className="font-semibold">${(pool.tvl / 1_000_000).toFixed(1)}M</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Volume 24h</p>
              <p className="font-semibold">${(pool.volume24h / 1_000_000).toFixed(1)}M</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">APR</p>
              <p className="font-semibold text-green-400">{pool.apr.toFixed(2)}%</p>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end gap-2 col-span-1">
            {userPosition && userPosition.lpTokens > 0 ? (
                <Button onClick={() => setIsManageDialogOpen(true)}>Manage</Button>
            ) : (
                <Button onClick={() => setIsAddDialogOpen(true)}>Add Liquidity</Button>
            )}
          </div>
        </CardContent>
        
        {userPosition && (
          <CardHeader className="pt-0 px-4 pb-4">
              <div className="bg-primary/10 p-3 rounded-lg text-xs">
                <div className="flex justify-between items-center font-bold text-primary mb-2">
                    <span>Your Position</span>
                    <span>{userPosition.share.toFixed(4)}% of pool</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">LP Tokens:</span>
                    <span>{userPosition.lpTokens.toLocaleString('en-US', {maximumFractionDigits: 4})}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Unclaimed Rewards:</span>
                    <span className="text-green-400">${userPosition.unclaimedRewards.toFixed(2)}</span>
                </div>
              </div>
          </CardHeader>
        )}
      </Card>
      
      <AddLiquidityDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        pool={pool}
        onAddPosition={onAddPosition}
      />
      
      {userPosition && (
        <ManageLiquidityDialog
          isOpen={isManageDialogOpen}
          setIsOpen={setIsManageDialogOpen}
          position={userPosition}
          onUpdatePosition={onUpdatePosition}
        />
      )}
    </>
  );
}
