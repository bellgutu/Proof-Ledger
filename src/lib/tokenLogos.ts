
// utils/getTokenLogo.ts

export const getTokenLogo = (symbol: string): string => {
  const symbolUpper = symbol.toUpperCase();

  const logos: { [key: string]: string } = {
    BTC: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',
    ETH: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png',
    SOL: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png',
    USDT: 'https://assets.coingecko.com/coins/images/325/thumb/Tether-logo.png',
    USDC: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    BNB: 'https://assets.coingecko.com/coins/images/825/thumb/binance-coin-logo.png',
    XRP: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png',
    WETH: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
    LINK: 'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png',
    XAUT: 'https://assets.coingecko.com/coins/images/10481/thumb/tether-gold.png',
    PEPE: 'https://pepecoin.org/assets/img/brand-assets/Pepecoin_onWhite_IconOnly-RGB%20[Converted].svg',
    DOGE: 'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png',
  };

  return logos[symbolUpper] || `https://placehold.co/32x32.png`;
};

    