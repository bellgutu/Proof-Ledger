
export const getTokenLogo = (symbol: string): string => {
  const logos: { [key: string]: string } = {
    BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    USDC: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    BNB: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
    XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
  };

  return logos[symbol.toUpperCase()] || 'https://placehold.co/32x32.png';
};
