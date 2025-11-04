
"use client";
import React from 'react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Users, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { ProviderRegistrationCard } from './provider-registration';
import { ObservationSubmissionCard } from './observation-submission';
import { ActiveProvidersCard } from './active-providers';
import { RoundConsensusCard } from './round-consensus';
import { RoundHistoryCard } from './round-history';
import { BondManagementCard } from './bond-management';

export const DashboardLayout = () => {
  const { state } = useTrustLayer();
  const { trustOracleData, isLoading, userOracleStatus } = state;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-0 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Providers"
          value={trustOracleData.activeProviders.toString()}
          description="Registered data providers"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Minimum Stake"
          value={`${trustOracleData.minStake} ETH`}
          description="Required to become provider"
          icon={<Shield className="h-4 w-4" />}
        />
        <StatCard
          title="Latest Consensus"
          value={`$${parseFloat(trustOracleData.latestPrice).toLocaleString()}`}
          description="Current round price"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Min Submissions"
          value={trustOracleData.minSubmissions.toString()}
          description="Required per round"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* User Status Alert */}
      {userOracleStatus.isProvider && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            You are registered as a data provider with {userOracleStatus.stake} ETH staked.
            {!userOracleStatus.isActive && " (Currently inactive)"}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Provider Management */}
        <div className="space-y-6">
          <ProviderRegistrationCard />
          <ObservationSubmissionCard />
        </div>

        {/* Middle Column - Live Data */}
        <div className="space-y-6">
          <ActiveProvidersCard />
          <RoundConsensusCard />
        </div>

        {/* Right Column - Historical Data */}
        <div className="space-y-6">
          <RoundHistoryCard />
          <BondManagementCard />
        </div>
      </div>
    </div>
  );
};

// Supporting Components
const StatCard = ({ title, value, description, icon }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <div className="container mx-auto p-0 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
           <CardContent>
            <Skeleton className="h-8 w-3/4 mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div className="space-y-6" key={i}>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  </div>
);

    