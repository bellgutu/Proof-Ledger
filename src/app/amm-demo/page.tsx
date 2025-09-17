
import InnovativeAMMDemo from '@/components/pages/amm-demo';
import { AmmDemoProvider } from '@/contexts/amm-demo-context';

const AmmDemoPage = () => {
    return (
        <AmmDemoProvider>
            <InnovativeAMMDemo />
        </AmmDemoProvider>
    );
};

export default AmmDemoPage;
