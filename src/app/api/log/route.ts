import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check for a 'command' field for scenario control
    if (body.command && ['uptrend', 'downtrend', 'normal'].includes(body.command)) {
      // This is a simple but effective way to communicate between tabs/apps on the same browser.
      // The frontend will listen for this storage event.
      return NextResponse.json({ 
        message: 'Command received and will be broadcasted via localStorage.',
        command: body.command 
      }, { status: 200 });
    }

    console.log('API Log:', body);
    return NextResponse.json({ message: 'Log received' }, { status: 200 });

  } catch (error) {
    console.error('Failed to parse log request:', error);
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }
}
