
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnterpriseSettingsPage() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will manage users, billing, and API configuration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
