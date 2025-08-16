import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // The command is now handled by the client-side listener in trading.tsx
    // which should be triggered by the sender app after this API call succeeds.
    console.log('API Log/Command Received:', body);

    // Acknowledge receipt. The sender app can now trigger the localStorage change.
    return NextResponse.json({ message: 'Log received', receivedBody: body }, { status: 200 });

  } catch (error) {
    console.error('Failed to parse log request:', error);
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }
}
