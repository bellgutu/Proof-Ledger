
"use client";
import TrustLayerPage from '@/components/pages/trust-layer';
import { TrustLayerProvider } from '@/contexts/trust-layer-context';

export default function TrustLayer() {
  return (
    <TrustLayerProvider>
      <TrustLayerPage />
    </TrustLayerProvider>
  );
}
