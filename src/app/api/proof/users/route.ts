
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.PROOF_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is not configured.' },
      { status: 500 }
    );
  }

  const url = 'https://api.proof.com/v1/scim/users';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Log the error response from the external API for debugging
      const errorBody = await response.text();
      console.error(`Proof API Error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json(
        { error: `Failed to fetch from Proof.com API: ${response.statusText}` },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching from Proof API:', err);
    return NextResponse.json(
      { error: 'An internal error occurred.', message: err.message },
      { status: 500 }
    );
  }
}
