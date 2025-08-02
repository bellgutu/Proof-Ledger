import CoinDetail from '@/components/pages/coin-detail';

export default function CoinDetailPage({ params }: { params: { symbol: string } }) {
  return <CoinDetail symbol={params.symbol} />;
}
