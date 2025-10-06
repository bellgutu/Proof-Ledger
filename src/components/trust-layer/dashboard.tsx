
"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Users, FileCheck, Landmark, GitCommit, LineChart } from 'lucide-react';
import * as trustLayerContracts from '@/lib/trustlayer-contract-addresses.json';

const ContractCard = ({ name, address, description, children, status, isLoading }: { name: string, address: string, description: string, children?: React.ReactNode, status?: 'Verified' | 'Configured', isLoading?: boolean }) => (
    <Card className="transform transition-transform duration-300 hover:scale-[1.01] flex flex-col">
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-3">
                    <ShieldCheck className="text-primary"/> {name}
                </span>
                {status && <Badge variant={status === 'Verified' ? 'secondary' : 'default'}>{status}</Badge>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            {isLoading ? (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ) : children}
            <div className="text-xs font-mono text-muted-foreground pt-4">
                <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {address}
                </a>
            </div>
        </CardContent>
    </Card>
);

export const Dashboard = () => {
    const { state } = useTrustLayer();
    const { isLoading, mainContractData, trustOracleData, safeVaultData, proofBondData, forgeMarketData, openGovernorData } = state;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <ContractCard 
                    name="MainContract" 
                    address={trustLayerContracts.MainContract} 
                    description="The central hub managing contract authorizations, the treasury, fees, and emergency pause functionality for the entire ecosystem."
                    status="Verified"
                    isLoading={isLoading}
                >
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Protocol Fee on All Trades</p>
                        <p className="text-3xl font-bold">{mainContractData.protocolFee / 100}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Collected and stored in the MainContract treasury.</p>
                    </div>
                </ContractCard>
            </div>

             <ContractCard 
                name="AIPredictiveLiquidityOracle" 
                address={trustLayerContracts.AIPredictiveLiquidityOracle} 
                description="A multi-provider oracle where AI agents stake ETH to submit predictions on optimal fees and market volatility."
                status="Configured"
                isLoading={isLoading}
            >
                 <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground flex items-center gap-2"><Users /> Active Oracles</p>
                        <p className="text-xl font-bold text-green-400">{trustOracleData.activeProviders}</p>
                    </div>
                     <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Min Stake</p>
                        <p className="text-sm font-mono">{trustOracleData.minStake} ETH</p>
                    </div>
                     <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Min Submissions</p>
                        <p className="text-sm font-mono">{trustOracleData.minSubmissions}</p>
                    </div>
                </div>
            </ContractCard>

            <ContractCard 
                name="AdvancedPriceOracle" 
                address={trustLayerContracts.AdvancedPriceOracle} 
                description="A robust, multi-source price oracle with historical tracking and volatility calculations to provide secure and reliable price data."
                status="Verified"
                isLoading={isLoading}
            >
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Value Secured</p>
                    <p className="text-3xl font-bold">${parseFloat(proofBondData.tvl).toLocaleString(undefined, { maximumFractionDigits: 2 })}M</p>
                    <p className="text-xs text-muted-foreground mt-1">Across all integrated markets.</p>
                </div>
            </ContractCard>
            
            <ContractCard 
                name="ProofBond"
                address={trustLayerContracts.ProofBond}
                description="A contract for issuing and managing yield-bearing bonds backed by real-world assets, linked to the oracle for verifiable data."
                status="Verified"
                isLoading={isLoading}
            >
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Active Bonds</p>
                    <p className="text-3xl font-bold">{proofBondData.activeBonds.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Value Locked: ${parseFloat(proofBondData.tvl).toLocaleString()}</p>
                </div>
            </ContractCard>
            
            <ContractCard 
                name="SafeVault"
                address={trustLayerContracts.SafeVault}
                description="A secure vault for depositing assets, which are then utilized in various yield-generating strategies managed by the ecosystem."
                status="Verified"
                isLoading={isLoading}
            >
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Deposits</p>
                    <p className="text-3xl font-bold">${parseFloat(safeVaultData.totalAssets).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Across 3 active strategies.</p>
                </div>
            </ContractCard>
            
            <ContractCard 
                name="ForgeMarket"
                address={trustLayerContracts.ForgeMarket}
                description="A marketplace for trading tokenized assets, using the AdvancedPriceOracle for reliable pricing."
                status="Configured"
                isLoading={isLoading}
            >
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="text-3xl font-bold">${parseFloat(forgeMarketData.totalVolume).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Across all listed assets.</p>
                </div>
            </ContractCard>

            <div className="lg:col-span-3">
                 <ContractCard 
                    name="OpenGovernor" 
                    address={trustLayerContracts.OpenGovernor} 
                    description="A DAO for governing the entire Trust Layer ecosystem, allowing token holders to create and vote on proposals."
                    status="Verified"
                    isLoading={isLoading}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Proposals</p>
                            <p className="text-3xl font-bold">{openGovernorData.activeProposals}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Treasury Value</p>
                            <p className="text-3xl font-bold">${parseFloat(openGovernorData.treasuryValue).toFixed(2)}</p>
                        </div>
                    </div>
                </ContractCard>
            </div>
        </div>
    );
};
