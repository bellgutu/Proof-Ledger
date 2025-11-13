"use client";

import React from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const MOCK_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const MOCK_AT_RISK_SHIPMENTS = [
  { id: 'SH-734-556', position: { lat: 34.0522, lng: -118.2437 } }, // Los Angeles
  { id: 'SH-456-881', position: { lat: 1.3521, lng: 103.8198 } }, // Singapore
  { id: 'SH-101-322', position: { lat: 51.5072, lng: -0.1276 } }, // London
];

export default function GoogleMap() {
  if (!MOCK_API_KEY) {
    return (
      <div className="flex items-center justify-center h-full bg-muted text-muted-foreground text-center p-4">
        <p>Google Maps API Key is missing. <br />Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={MOCK_API_KEY}>
      <Map
        defaultCenter={{ lat: 25, lng: 20 }}
        defaultZoom={2}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId={'a2a2a2a2a2a2a2a2'} // A simple, non-descript Map ID
        className="w-full h-full"
      >
        {MOCK_AT_RISK_SHIPMENTS.map((shipment) => (
          <AdvancedMarker key={shipment.id} position={shipment.position}>
            <div className="w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}