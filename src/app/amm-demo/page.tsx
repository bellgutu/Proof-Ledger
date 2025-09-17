
import InnovativeAMMDemo from '@/components/pages/amm-demo';
import { AmmDemoProvider } from '@/contexts/amm-demo-context';

export default function AmmDemoPage() {
  return (
    <AmmDemoProvider>
      <InnovativeAMMDemo />
    </AmmDemoProvider>
  );
}
