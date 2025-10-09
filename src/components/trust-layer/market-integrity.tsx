"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, FileCheck, GitCommit } from 'lucide-react';
import { ArbitrageInsightPanel } from './ArbitrageInsightPanel';

export const MarketIntegrity = () => {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <GitCommit /> Oracle & Market Analysis
                    </CardTitle>
                     <CardDescription>
                        Visualize real-time data from multiple oracles to identify discrepancies and ensure market integrity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <ArbitrageInsightPanel />
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <FileCheck /> Asset Verification
                    </CardTitle>
                    <CardDescription>
                        Real-time data on the backing and verification of tokenized real-world assets (RWAs).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-16 text-muted-foreground">
                        <p>Asset verification dashboard coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
