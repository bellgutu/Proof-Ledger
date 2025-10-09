
import CoinDetail from '@/components/pages/coin-detail';

export default function CoinDetailPage({ params }: { params: { symbol: string } }) {
  // This page remains, it will be linked from the new /markets page
  return <CoinDetail symbol={params.symbol} />;
}
