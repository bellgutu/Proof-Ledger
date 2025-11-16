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
      'ApiKey': apiKey,
    },
  };

  try {
    // For this demo, we'll return mock data instead of making a real call.
    // In a real app, you would uncomment the fetch call.
    /*
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
    */

    // Mock data that mimics the SCIM API response structure
    const mockData = {
      "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
      "totalResults": 3,
      "startIndex": 1,
      "itemsPerPage": 50,
      "Resources": [
        {
          "id": "2d9c198a-2c49-43c3-8a39-a912239d5b0c",
          "userName": "abel.gutu@example.com",
          "displayName": "Abel Gutu",
          "active": true,
          "name": {
            "givenName": "Abel",
            "familyName": "Gutu"
          },
          "emails": [
            {
              "value": "abel.gutu@example.com",
              "type": "work",
              "primary": true
            }
          ]
        },
        {
          "id": "9f7b3c2e-1a8d-4f0e-8a6b-2e9a1d3b0c5d",
          "userName": "jane.doe@example.com",
          "displayName": "Jane Doe",
          "active": true,
          "name": {
            "givenName": "Jane",
            "familyName": "Doe"
          },
          "emails": [
            {
              "value": "jane.doe@example.com",
              "type": "work",
              "primary": true
            }
          ]
        },
        {
            "id": "c5a4b1e3-6d9f-4c8a-b0e1-3d2c1a9b8e7f",
            "userName": "john.smith@example.com",
            "displayName": "John Smith",
            "active": false,
             "name": {
                "givenName": "John",
                "familyName": "Smith"
            },
            "emails": [
                {
                    "value": "john.smith@example.com",
                    "type": "work",
                    "primary": true
                }
            ]
        }
      ]
    };
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json(mockData);
  } catch (err: any) {
    console.error('Error fetching from Proof API:', err);
    return NextResponse.json(
      { error: 'An internal error occurred.', message: err.message },
      { status: 500 }
    );
  }
}

    