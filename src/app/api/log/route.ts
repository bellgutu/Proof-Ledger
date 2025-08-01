import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('API Log:', body);
    return NextResponse.json({ message: 'Log received' }, { status: 200 });
  } catch (error) {
    console.error('Failed to parse log request:', error);
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }
}
