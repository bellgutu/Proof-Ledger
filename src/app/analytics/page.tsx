
"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, AlertTriangle, BarChart } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Analytics Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Measure ROI, detect risks, and monitor platform performance with data-driven insights.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will visualize ROI and efficiency gains from using the decentralized verification system compared to traditional methods.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Fraud Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will contain dashboards for analyzing and flagging potential fraudulent activity or anomalies in the verification data.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will display key performance indicators (KPIs) for the platform, such as verification times, oracle uptime, and transaction throughput.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
