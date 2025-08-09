
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.CRYTOPANIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: 'CryptoPanic API key is not configured.' }, { status: 500 });
  }

  try {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&public=true`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`CryptoPanic API request failed with status ${response.status}`);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      return NextResponse.json({ message: `CryptoPanic API request failed` }, { status: response.status });
    }

    const data = await response.json();
    
    const articles = data.results.map((article: any) => ({
        id: article.id,
        title: article.title,
        url: article.url,
        domain: article.domain,
        createdAt: article.created_at,
    }));

    return NextResponse.json({ articles });

  } catch (error) {
    console.error('Failed to fetch from CryptoPanic API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
