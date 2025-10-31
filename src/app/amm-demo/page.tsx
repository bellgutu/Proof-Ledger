
"use client";
import AmmDemoPage from '@/components/pages/amm-demo';
import { AmmDemoProvider } from '@/contexts/amm-demo-context';

export default function Page() {
  return (
    <AmmDemoProvider>
      <AmmDemoPage />
    </AmmDemoProvider>
  );
}
