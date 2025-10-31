
"use client";
import TrustLayerPage from '@/components/pages/trust-layer';
import { AmmDemoProvider } from '@/contexts/amm-demo-context';
import { TrustLayerProvider } from '@/contexts/trust-layer-context';

export default function TrustLayer() {
  return (
    <AmmDemoProvider>
        <TrustLayerProvider>
            <TrustLayerPage />
        </TrustLayerProvider>
    </AmmDemoProvider>
  );
}
