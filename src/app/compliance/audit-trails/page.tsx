
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditTrailsPage() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Audit Trails</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will display immutable audit trails for all verification activities.</p>
        </CardContent>
      </Card>
    </div>
  );
}
