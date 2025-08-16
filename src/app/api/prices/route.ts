
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const coinIds = 'ethereum,solana,binancecoin,tether,usd-coin,chainlink,ripple';
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`CoinGecko API request failed with status ${response.status}`);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      return NextResponse.json({ message: `CoinGecko API request failed` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Failed to fetch from CoinGecko API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
