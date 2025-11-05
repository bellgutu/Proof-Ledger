import CoinDetail from '@/components/pages/coin-detail';

export default function Page({ params }: { params: { symbol: string[] } }) {
  const symbol = params.symbol?.[0] || 'eth';
  return <CoinDetail symbol={symbol} />;
}
