import { NextResponse } from 'next/server';

// This is a placeholder API route to demonstrate fetching a single document.
// In a real application, the transaction and document IDs would be dynamic.
export async function GET(request: Request) {
  const apiKey = process.env.PROOF_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is not configured.' },
      { status: 500 }
    );
  }

  // Example IDs
  const transactionId = 'some-transaction-id';
  const documentId = 'some-document-id';

  const url = `https://api.proof.com/v1/transactions/${transactionId}/documents/${documentId}?document_url_version=v1`;
  
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'ApiKey': apiKey,
    },
  };

  try {
    // In a real app, you'd fetch from the URL. For this demo, we return mock data.
    // const response = await fetch(url, options);
    // if (!response.ok) { ... error handling ... }
    // const data = await response.json();
    
    const mockData = {
      id: documentId,
      transaction_id: transactionId,
      name: "Verified Status Snapshot (VSS) - Pre-Transit",
      file_name: "vss_pre_transit_SH-734-556.pdf",
      created: new Date().toISOString(),
      document_hash: "0x2c5a8e31057e5b10594411a7b49464522941afd4d39f4a7436e1d2c67a78a1b2",
      download_url: "https://example.com/download/document-id"
    };

    return NextResponse.json(mockData);

  } catch (err: any) {
    console.error('Error fetching from Proof API:', err);
    return NextResponse.json(
      { error: 'An internal error occurred.', message: err.message },
      { status: 500 }
    );
  }
}
