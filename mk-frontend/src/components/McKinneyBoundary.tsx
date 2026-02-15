'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

const MCKINNEY_ZIPS = new Set(['75069', '75070', '75071', '75072']);

/*  `/public/data/Zip_Codes.json`  →  served at  <basePath>/data/Zip_Codes.json  */
const FILE_URL = '/data/Zip_Codes.json';

export function McKinneyBoundary({ show = true, data }: { show: boolean; data: any }) {
    const [shape, setShape] = useState<GeoJSON.FeatureCollection | null>(null);
    const map = useMap();

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    useEffect(() => {
        if (!show || !data) return;

        const fc = data;
        setShape({
            ...fc,
            features: fc.features.filter(
                (f: { properties: { ZIP_NO: string } }) => MCKINNEY_ZIPS.has(f.properties.ZIP_NO)
            )
        });
    }, [show, data]);

    /* auto-fit once the layer is ready */
    useEffect(() => {
        if (shape && map) {
            const layer = L.geoJSON(shape);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20] });
            }
        }
    }, [shape, map]);

    if (!show || !shape) return null;

    return (
        <GeoJSON
            data={shape}
            style={{
                color: isDark ? '#1F2937' : '#4B5563', // Gray-800 : Gray-600
                weight: 3,
                opacity: 0.8,
                fillColor: '#3B82F6',
                fillOpacity: 0.05,
                dashArray: '10, 5'
            }}
        />
    );
}
