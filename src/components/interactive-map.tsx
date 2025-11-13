"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Mock data for at-risk shipments
const MOCK_AT_RISK_SHIPMENTS = [
  { id: 'SH-734-556', position: [34.0522, -118.2437] as [number, number], info: "Tamper Alert" },
  { id: 'SH-456-881', position: [1.3521, 103.8198] as [number, number], info: "FOB Delay" },
  { id: 'SH-101-322', position: [51.5072, -0.1276] as [number, number], info: "Temp. Anomaly" },
];

// Custom icon for the markers
const createCustomIcon = () => {
    return new L.Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" fill="#FECACA"/>
                <circle cx="12" cy="12" r="4" fill="#EF4444"/>
            </svg>
        `),
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};

const CustomMarker = ({ position, info, icon }: { position: [number, number], info: string, icon: L.Icon }) => {
    return (
        <Marker position={position} icon={icon}>
            <Popup>
                <div className="font-sans">
                    <div className="font-bold text-base mb-1">At-Risk Shipment</div>
                    <div className="text-sm"><strong>ID:</strong> {position.toString()}</div>
                    <div className="text-sm"><strong>Alert:</strong> {info}</div>
                </div>
            </Popup>
        </Marker>
    );
};

// A component to remove the default Leaflet attribution prefix
const MapAttribution = () => {
    const map = useMap();

    useEffect(() => {
        // This is a workaround to remove the "Leaflet |" prefix.
        if (map.attributionControl) {
            map.attributionControl.setPrefix(false);
        }
    }, [map]);

    return null;
}

export default function InteractiveMap() {
    const center: [number, number] = [25, 20];
    const customIcon = createCustomIcon();

    return (
        <MapContainer center={center} zoom={2} scrollWheelZoom={false} className="w-full h-full z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapAttribution />
            {MOCK_AT_RISK_SHIPMENTS.map((shipment) => (
                <CustomMarker
                    key={shipment.id}
                    position={shipment.position}
                    info={shipment.info}
                    icon={customIcon}
                />
            ))}
        </MapContainer>
    );
}
