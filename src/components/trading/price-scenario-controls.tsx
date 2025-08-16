
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';

export type PriceScenario = 'uptrend' | 'downtrend' | 'normal';

interface PriceScenarioControlsProps {
  onScenarioChange: (scenario: PriceScenario | null) => void;
}

export function PriceScenarioControls({ onScenarioChange }: PriceScenarioControlsProps) {
  const [activeScenario, setActiveScenario] = useState<PriceScenario | null>(null);

  const handleScenarioClick = (scenario: PriceScenario) => {
    if (activeScenario === scenario) {
        // If clicking the same button, turn it off
        setActiveScenario(null);
        onScenarioChange(null);
    } else {
        setActiveScenario(scenario);
        onScenarioChange(scenario);
    }
  };
  
  const resetScenario = () => {
    setActiveScenario(null);
    onScenarioChange(null);
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <span>Scenario Controls</span>
             <Button variant="ghost" size="icon" onClick={resetScenario}>
                <RotateCcw className="h-4 w-4"/>
             </Button>
        </CardTitle>
        <CardDescription>
          For educational purposes only. Manually trigger price trends to see how they affect your P&L.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          onClick={() => handleScenarioClick('uptrend')}
          variant={activeScenario === 'uptrend' ? 'default' : 'outline'}
          className="w-full bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300 data-[state=active]:bg-green-500"
        >
          <ArrowUpRight className="mr-2"/> Simulate Uptrend
        </Button>
        <Button
          onClick={() => handleScenarioClick('downtrend')}
          variant={activeScenario === 'downtrend' ? 'destructive' : 'outline'}
          className="w-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          <ArrowDownRight className="mr-2"/> Simulate Downtrend
        </Button>
      </CardContent>
    </Card>
  );
}
