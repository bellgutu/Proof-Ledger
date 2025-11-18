
import { NextResponse } from 'next/server';

// This is a mock API route to simulate fetching live sensor data for an asset.
// In a real-world application, this endpoint would connect to an IoT platform
// (like Google Cloud IoT, AWS IoT, etc.) to get data from physical devices.

// Function to generate a random number within a range
const getRandomValue = (min: number, max: number, decimals: number = 1) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

export async function GET(
  request: Request,
  { params }: { params: { assetId: string } }
) {
  const { assetId } = params;

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required.' }, { status: 400 });
  }

  // Simulate different data types based on a prefix in the asset ID
  let responseData = {};

  if (assetId.startsWith('SH-')) { // Shipping Container
    responseData = {
      assetId,
      timestamp: new Date().toISOString(),
      location: {
        lat: getRandomValue(20, 50),
        lon: getRandomValue(-120, 120),
      },
      temperature: getRandomValue(2, 8), // Celsius, refrigerated
      humidity: getRandomValue(85, 95), // Percent
      tamper_status: 'sealed',
    };
  } else if (assetId.startsWith('LX-')) { // Luxury Good
     responseData = {
      assetId,
      timestamp: new Date().toISOString(),
      location: {
        lat: getRandomValue(40, 48),
        lon: getRandomValue(-74, -70),
      },
      light_exposure: getRandomValue(0, 5), // lux
      shock_event: 'none',
      tamper_status: 'secure',
    };
  } else { // Generic/default data
     responseData = {
      assetId,
      timestamp: new Date().toISOString(),
      temperature: getRandomValue(15, 25),
    };
  }

  return NextResponse.json(responseData);
}
