
import { NextResponse } from 'next/server';
import { getNewsBriefing } from '@/ai/flows/news-generator-flow';

export async function GET(request: Request) {
  try {
    const newsData = await getNewsBriefing();
    return NextResponse.json({ articles: newsData.articles });
  } catch (error) {
    console.error('Failed to fetch from AI news generator:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
