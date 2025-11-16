import { NextResponse } from 'next/server';

// This is a placeholder API route to demonstrate creating an integration.
export async function POST(request: Request) {
  const apiKey = process.env.PROOF_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is not configured.' },
      { status: 500 }
    );
  }

  // In a real app, you might pass a name or configuration in the request body
  const body = await request.json();
  const integrationName = body.name || "Default Integration";


  const url = 'https://api.proof.com/v1/integrations';
  
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'ApiKey': apiKey,
    },
    body: JSON.stringify({ name: integrationName }) // In a real request, you'd send a body
  };

  try {
    // In a real app, you'd fetch from the URL. For this demo, we return mock data.
    // const response = await fetch(url, options);
    // if (!response.ok) { ... error handling ... }
    // const data = await response.json();
    
    const mockData = {
      id: `int_${new Date().getTime()}`,
      name: integrationName,
      status: "active",
      created: new Date().toISOString()
    };

    return NextResponse.json(mockData);

  } catch (err: any) {
    console.error('Error creating integration with Proof API:', err);
    return NextResponse.json(
      { error: 'An internal error occurred.', message: err.message },
      { status: 500 }
    );
  }
}
